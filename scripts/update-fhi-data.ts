#!/usr/bin/env tsx
/**
 * Deterministic FHI refresh job.
 *
 * Fetches the live FHI country pages, derives draft structured fields from
 * scraped text, and prints a review report. With `--write`, it updates
 * `data/countries.json` with the deterministically scraped draft values.
 *
 * Usage:
 *   npx tsx scripts/update-fhi-data.ts
 *   npx tsx scripts/update-fhi-data.ts --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCountryDraft,
  extractScrapedVaccineSignals,
  fetchCountryUrlMap,
  fetchFhiPageSnapshot,
  resolveCountryPageUrl,
  type CountrySeed,
} from "./fhi-source";

type CountryEntry = {
  code: string;
  nameNo: string;
  riskProfiles: string[];
  malariaRisk: "none" | "low" | "rural_only" | "moderate" | "high";
  malariaZones?: string | null;
  yellowFeverRequirement: "none" | "required_if_from_endemic_country" | "required" | "recommended";
  yellowFeverRecommended: boolean;
  fhiPageUrl?: string;
  lastScrapedDate: string;
  dataVersion: string;
};

type CountryReview = {
  code: string;
  nameNo: string;
  changedFields: string[];
  extractedVaccines: ReturnType<typeof extractScrapedVaccineSignals>;
  current: CountryEntry;
  scraped: CountryEntry;
};

const ROOT = join(__dirname, "..");
const COUNTRIES_PATH = join(ROOT, "data", "countries.json");
const shouldWrite = process.argv.includes("--write");

function loadCountries(): CountryEntry[] {
  return JSON.parse(readFileSync(COUNTRIES_PATH, "utf-8")) as CountryEntry[];
}

function getChangedFields(current: CountryEntry, scraped: CountryEntry): string[] {
  const fields: Array<keyof CountryEntry> = [
    "riskProfiles",
    "malariaRisk",
    "malariaZones",
    "yellowFeverRequirement",
    "yellowFeverRecommended",
  ];

  return fields.filter((field) => JSON.stringify(current[field]) !== JSON.stringify(scraped[field]));
}

async function main() {
  const existingCountries = loadCountries();
  const countryUrlMap = await fetchCountryUrlMap();
  const updatedCountries: CountryEntry[] = [];
  const review: CountryReview[] = [];

  for (const current of existingCountries) {
    const seed: CountrySeed = {
      code: current.code,
      nameNo: current.nameNo,
      slug: current.fhiPageUrl,
    };

    process.stderr.write(`Henter ${current.nameNo}...`);

    try {
      const pageUrl = resolveCountryPageUrl(seed, countryUrlMap);
      const snapshot = await fetchFhiPageSnapshot({ ...seed, slug: pageUrl });
      const scraped = buildCountryDraft(seed, snapshot);
      const changedFields = getChangedFields(current, scraped);

      updatedCountries.push({
        ...current,
        ...scraped,
      });

      review.push({
        code: current.code,
        nameNo: current.nameNo,
        changedFields,
        extractedVaccines: extractScrapedVaccineSignals(snapshot),
        current,
        scraped,
      });

      process.stderr.write(changedFields.length > 0 ? ` endret (${changedFields.join(", ")})\n` : " uendret\n");
    } catch (error) {
      updatedCountries.push(current);
      process.stderr.write(` feil: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  if (shouldWrite) {
    writeFileSync(COUNTRIES_PATH, `${JSON.stringify(updatedCountries, null, 2)}\n`);
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? "write" : "dry-run",
        updatedCountries: shouldWrite ? updatedCountries.length : undefined,
        changedCountries: review.filter((item) => item.changedFields.length > 0).length,
        review,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
