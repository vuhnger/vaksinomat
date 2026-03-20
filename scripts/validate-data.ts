#!/usr/bin/env tsx
/**
 * Validates vaccines.json and countries.json against Zod schemas.
 * CI fails if dataVersion < 1.0.0 for any country.
 * Run: npx tsx scripts/validate-data.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { validateVaccines, validateCountries } from "../lib/data/validator";

const ROOT = join(__dirname, "..");

function loadJson(relativePath: string): unknown {
  const absPath = join(ROOT, relativePath);
  try {
    return JSON.parse(readFileSync(absPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to read ${relativePath}:`, err);
    process.exit(1);
  }
}

let hasErrors = false;

// Validate vaccines.json
console.log("Validating data/vaccines.json...");
try {
  const vaccines = validateVaccines(loadJson("data/vaccines.json"));
  console.log(`  ✓ ${vaccines.length} vaccines valid`);
} catch (err) {
  console.error("  ✗ vaccines.json validation failed:", err);
  hasErrors = true;
}

// Validate countries.json
console.log("Validating data/countries.json...");
try {
  const countries = validateCountries(loadJson("data/countries.json"));
  console.log(`  ✓ ${countries.length} countries valid`);

  // Check dataVersion – CI fails if any country has version < 1.0.0 (i.e., draft)
  const draftCountries = countries.filter((c) => {
    const [major] = c.dataVersion.split(".").map(Number);
    return major < 1;
  });
  if (draftCountries.length > 0) {
    console.error(
      `  ✗ ${draftCountries.length} countries have draft dataVersion (< 1.0.0):`
    );
    draftCountries.forEach((c) =>
      console.error(`    - ${c.code} ${c.nameNo}: ${c.dataVersion}`)
    );
    hasErrors = true;
  }
} catch (err) {
  console.error("  ✗ countries.json validation failed:", err);
  hasErrors = true;
}

if (hasErrors) {
  console.error("\nValidation failed.");
  process.exit(1);
} else {
  console.log("\nAll data valid.");
}
