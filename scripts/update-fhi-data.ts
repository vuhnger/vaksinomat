#!/usr/bin/env tsx
/**
 * Monthly update job: diffs existing countries.json against newly scraped data
 * and creates a GitHub PR with changes.
 *
 * Run by Cloud Scheduler on the 1st of each month.
 * Usage: npx tsx scripts/update-fhi-data.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ROOT = join(__dirname, "..");
const COUNTRIES_PATH = join(ROOT, "data", "countries.json");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface CountryEntry {
  code: string;
  nameNo: string;
  [key: string]: unknown;
}

interface DiffResult {
  country: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

function findDiffs(
  existing: CountryEntry[],
  updated: CountryEntry[]
): DiffResult[] {
  const diffs: DiffResult[] = [];

  for (const updatedCountry of updated) {
    const existingCountry = existing.find((c) => c.code === updatedCountry.code);
    if (!existingCountry) {
      diffs.push({
        country: updatedCountry.nameNo,
        field: "NEW_COUNTRY",
        oldValue: null,
        newValue: updatedCountry,
      });
      continue;
    }

    const fields = ["riskProfiles", "malariaRisk", "yellowFeverRequirement", "yellowFeverRecommended"] as const;
    for (const field of fields) {
      const oldVal = existingCountry[field];
      const newVal = updatedCountry[field];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({
          country: updatedCountry.nameNo,
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }
  }

  return diffs;
}

async function generatePRDescription(diffs: DiffResult[]): Promise<string> {
  if (diffs.length === 0) {
    return "No changes detected in FHI country data.";
  }

  const diffSummary = diffs
    .map(
      (d) =>
        `${d.country}: ${d.field} changed from ${JSON.stringify(d.oldValue)} to ${JSON.stringify(d.newValue)}`
    )
    .join("\n");

  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
  const response = await model.generateContent(
    `Summarize these FHI travel medicine data changes for a medical review pull request. Be concise and flag any safety-critical changes:\n\n${diffSummary}`
  );
  return response.response.text();
}

async function createGitHubPR(
  title: string,
  body: string,
  branchName: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // format: owner/repo

  if (!token || !repo) {
    console.log("GitHub PR creation skipped (GITHUB_TOKEN or GITHUB_REPO not set)");
    console.log("PR Title:", title);
    console.log("PR Body:", body);
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: "main",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub PR creation failed: ${err}`);
  }

  const pr = await response.json() as { html_url: string };
  console.log("PR created:", pr.html_url);
}

async function main() {
  console.log("Starting monthly FHI data update...");

  // Load existing data
  const existing: CountryEntry[] = JSON.parse(
    readFileSync(COUNTRIES_PATH, "utf-8")
  );

  // In production: run Playwright scraper here
  // For now, we compare against same data (no-op) to demonstrate the flow
  const updated = existing.map((c) => ({
    ...c,
    lastScrapedDate: new Date().toISOString().split("T")[0],
  }));

  const diffs = findDiffs(existing, updated);

  if (diffs.length === 0) {
    console.log("No changes detected. Exiting.");
    return;
  }

  console.log(`Found ${diffs.length} changes.`);

  const description = await generatePRDescription(diffs);
  const date = new Date().toISOString().split("T")[0];
  const branchName = `fhi-update-${date}`;

  // Write updated data
  writeFileSync(
    COUNTRIES_PATH,
    JSON.stringify(updated, null, 2) + "\n"
  );

  await createGitHubPR(
    `FHI data update – ${date}`,
    `## Månedlig FHI-dataoppdatering\n\n${description}\n\n**Endringer:** ${diffs.length} felter oppdatert\n\nPlease review before merging.`,
    branchName
  );

  console.log("Update complete.");
}

main().catch(console.error);
