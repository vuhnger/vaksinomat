#!/usr/bin/env tsx
/**
 * Deterministic bootstrap for FHI country data.
 *
 * This script fetches FHI country pages, extracts relevant text sections,
 * and builds a draft countries dataset without using AI.
 * Output is draft data and should still be medically reviewed before it
 * replaces `data/countries.json`.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-countries.ts > data/countries.draft.json
 */
import {
  buildCountryDraft,
  extractScrapedVaccineSignals,
  fetchCountryUrlMap,
  fetchFhiPageSnapshot,
  resolveCountryPageUrl,
  type CountrySeed,
} from "./fhi-source";

const COUNTRIES_TO_SCRAPE: CountrySeed[] = [
  { code: "TH", nameNo: "Thailand", slug: "thailand" },
  { code: "VN", nameNo: "Vietnam", slug: "vietnam" },
  { code: "KH", nameNo: "Kambodsja", slug: "kambodsja" },
  { code: "IN", nameNo: "India", slug: "india" },
  { code: "NG", nameNo: "Nigeria", slug: "nigeria" },
  { code: "KE", nameNo: "Kenya", slug: "kenya" },
  { code: "TZ", nameNo: "Tanzania", slug: "tanzania" },
  { code: "FR", nameNo: "Frankrike", slug: "frankrike" },
];

async function main() {
  const countryUrlMap = await fetchCountryUrlMap();
  const drafts = [];

  for (const country of COUNTRIES_TO_SCRAPE) {
    process.stderr.write(`Henter ${country.nameNo}...`);

    try {
      const pageUrl = resolveCountryPageUrl(country, countryUrlMap);
      const snapshot = await fetchFhiPageSnapshot({ ...country, slug: pageUrl });
      drafts.push({
        ...buildCountryDraft(country, snapshot),
        reviewStatus: "needs_manual_medical_review",
        source: {
          pageHash: snapshot.pageHash,
          pageTitle: snapshot.pageTitle,
          extractedVaccines: extractScrapedVaccineSignals(snapshot),
          sections: snapshot.sections,
        },
      });
      process.stderr.write(" ok\n");
    } catch (error) {
      process.stderr.write(` feil: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log(JSON.stringify(drafts, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
