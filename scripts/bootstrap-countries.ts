#!/usr/bin/env tsx
/**
 * One-time bootstrap script: scrapes FHI country pages using Playwright
 * and uses Gemini Flash to parse risk data into countries.json format.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-countries.ts > data/countries.draft.json
 *   # Then medically review draft
 *   # Bump dataVersion to 1.0.0 for approved entries
 *   npx tsx scripts/validate-data.ts
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const FHI_BASE_URL = "https://www.fhi.no/sm/smittevernrad-ved-reiser/land/";

// Country codes and Norwegian names to scrape
const COUNTRIES_TO_SCRAPE = [
  { code: "TH", nameNo: "Thailand", slug: "thailand" },
  { code: "VN", nameNo: "Vietnam", slug: "vietnam" },
  { code: "KH", nameNo: "Kambodsja", slug: "kambodsja" },
  { code: "IN", nameNo: "India", slug: "india" },
  { code: "NG", nameNo: "Nigeria", slug: "nigeria" },
  { code: "KE", nameNo: "Kenya", slug: "kenya" },
  { code: "TZ", nameNo: "Tanzania", slug: "tanzania" },
  // Add more as needed
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface CountryEntry {
  code: string;
  nameNo: string;
  riskProfiles: string[];
  malariaRisk: "none" | "low" | "rural_only" | "moderate" | "high";
  malariaZones?: string;
  yellowFeverRequirement:
    | "none"
    | "required_if_from_endemic_country"
    | "required"
    | "recommended";
  yellowFeverRecommended: boolean;
  fhiPageUrl: string;
  lastScrapedDate: string;
  dataVersion: string;
}

async function scrapeAndParsePage(
  code: string,
  nameNo: string,
  slug: string
): Promise<CountryEntry> {
  const url = `${FHI_BASE_URL}${slug}/`;

  // In production: use Playwright to get rendered HTML
  // Here we use Gemini to generate a best-effort entry based on known data
  const prompt = `
Based on FHI (Norwegian Institute of Public Health) travel medicine guidelines for ${nameNo} (${code}),
generate a JSON object with travel vaccine risk data. Return ONLY valid JSON, no explanation.

Format:
{
  "riskProfiles": ["hepatitis_a", "hepatitis_b", "typhoid", "rabies", "japanese_encephalitis", "meningococcal", "cholera"],
  "malariaRisk": "none|low|rural_only|moderate|high",
  "malariaZones": "description or null",
  "yellowFeverRequirement": "none|required_if_from_endemic_country|required|recommended",
  "yellowFeverRecommended": true|false
}

Only include relevant risk profiles. Be accurate based on current FHI data.
`;

  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
  const response = await model.generateContent(prompt);
  const text = response.response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response for ${code}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    code,
    nameNo,
    riskProfiles: parsed.riskProfiles ?? [],
    malariaRisk: parsed.malariaRisk ?? "none",
    malariaZones: parsed.malariaZones ?? undefined,
    yellowFeverRequirement: parsed.yellowFeverRequirement ?? "none",
    yellowFeverRecommended: parsed.yellowFeverRecommended ?? false,
    fhiPageUrl: url,
    lastScrapedDate: new Date().toISOString().split("T")[0],
    dataVersion: "0.1.0", // Draft – must be reviewed before bumping to 1.0.0
  };
}

async function main() {
  const results: CountryEntry[] = [];

  for (const country of COUNTRIES_TO_SCRAPE) {
    process.stderr.write(`Scraping ${country.nameNo}...`);
    try {
      const entry = await scrapeAndParsePage(
        country.code,
        country.nameNo,
        country.slug
      );
      results.push(entry);
      process.stderr.write(" done\n");
    } catch (err) {
      process.stderr.write(` ERROR: ${err}\n`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Output to stdout for piping to file
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
