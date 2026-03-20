import { createHash } from "node:crypto";

const FHI_BASE_URL = "https://www.fhi.no/sm/smittevernrad-ved-reiser/land/";
const FHI_REISERAD_INDEX_URL = "https://www.fhi.no/sm/smittevernrad-ved-reiser/reiserad/";

export type CountrySeed = {
  code: string;
  nameNo: string;
  slug?: string;
};

export type ReviewSectionKey = "vaccinesForAll" | "specialSituations" | "malaria" | "yellowFever";

export type CountryEntryDraft = {
  code: string;
  nameNo: string;
  riskProfiles: string[];
  malariaRisk: "none" | "low" | "rural_only" | "moderate" | "high";
  malariaZones: string | null;
  yellowFeverRequirement: "none" | "required_if_from_endemic_country" | "required" | "recommended";
  yellowFeverRecommended: boolean;
  fhiPageUrl: string;
  lastScrapedDate: string;
  dataVersion: string;
};

export type ScrapedVaccineSignals = {
  vaccinesForAll: string[];
  travelVaccines: string[];
};

export type FhiPageSnapshot = {
  fetchedAt: string;
  pageHash: string;
  pageUrl: string;
  pageTitle: string;
  sections: Record<ReviewSectionKey, string | null>;
};

const UNIVERSAL_VACCINE_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "dtap", pattern: /dtp-?ipv|difteri|stivkrampe|kikhoste|poliomyelitt/i },
  { id: "mmr", pattern: /\bmmr\b|meslinger|kusma|rode hunder|røde hunder/i },
];

const TRAVEL_VACCINE_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "hepatitis_a", pattern: /hepatitt\s*a|\bhep\s*a\b/i },
  { id: "hepatitis_b", pattern: /hepatitt\s*b|\bhep\s*b\b/i },
  { id: "typhoid", pattern: /tyfoid/i },
  { id: "rabies", pattern: /rabies/i },
  { id: "japanese_encephalitis", pattern: /japansk encefalitt/i },
  { id: "meningococcal", pattern: /meningokokk|men acwy|men b/i },
  { id: "cholera", pattern: /kolera|dukoral/i },
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xE5;|&aring;/gi, "å")
    .replace(/&#xC5;|&Aring;/gi, "Å")
    .replace(/&#xE6;|&aelig;/gi, "æ")
    .replace(/&#xC6;|&AElig;/gi, "Æ")
    .replace(/&#xF8;|&oslash;/gi, "ø")
    .replace(/&#xD8;|&Oslash;/gi, "Ø")
    .replace(/&#xF6;/gi, "ö")
    .replace(/&#xFC;/gi, "ü")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeName(value: string): string {
  return decodeHtmlEntities(value)
    .toLowerCase()
    .replace(/[^a-z0-9æøåéöü\- ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeForHash(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return stripHtml(match?.[1] ?? "FHI reiseside");
}

function getSectionSlice(text: string, heading: string, nextHeadings: string[]): string | null {
  const lowerText = text.toLowerCase();
  const startIndex = lowerText.indexOf(heading.toLowerCase());

  if (startIndex === -1) {
    return null;
  }

  let endIndex = text.length;

  for (const nextHeading of nextHeadings) {
    const nextIndex = lowerText.indexOf(nextHeading.toLowerCase(), startIndex + heading.length);
    if (nextIndex !== -1 && nextIndex < endIndex) {
      endIndex = nextIndex;
    }
  }

  return text.slice(startIndex + heading.length, endIndex).trim() || null;
}

export async function fetchFhiPageSnapshot(country: CountrySeed): Promise<FhiPageSnapshot> {
  const pageUrl = country.slug?.startsWith("http")
    ? country.slug
    : `${FHI_BASE_URL}${country.slug ?? ""}`;
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Vaksinomat FHI sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente ${pageUrl} (${response.status})`);
  }

  const html = await response.text();
  const text = stripHtml(html);
  const normalized = normalizeForHash(text);

  return {
    fetchedAt: new Date().toISOString(),
    pageHash: createHash("sha256").update(normalized).digest("hex"),
    pageUrl,
    pageTitle: extractTitle(html),
    sections: {
      vaccinesForAll: getSectionSlice(text, "Vaksiner anbefalt for alle", [
        "Aktuelle vaksiner ut ifra individuell risiko",
        "Vaksiner og medisiner for spesielle situasjoner",
        "Malaria",
        "Gulfebersertifikat",
      ]),
      specialSituations: getSectionSlice(text, "Aktuelle vaksiner ut ifra individuell risiko", [
        "Vaksiner og medisiner for spesielle situasjoner",
        "Malaria",
        "Gulfebersertifikat",
        "Smittefare og hygienerad",
        "Spesielle forhold",
      ]),
      malaria: getSectionSlice(text, "Malaria", ["Gulfebersertifikat", "Smittefare og hygienerad", "Andre forhold"]),
      yellowFever: getSectionSlice(text, "Gulfebersertifikat", ["Smittefare og hygienerad", "Andre forhold"]),
    },
  };
}

export async function fetchCountryUrlMap(): Promise<Map<string, string>> {
  const response = await fetch(FHI_REISERAD_INDEX_URL, {
    headers: {
      "User-Agent": "Vaksinomat FHI sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Kunne ikke hente ${FHI_REISERAD_INDEX_URL} (${response.status})`);
  }

  const html = await response.text();
  const entries = html.match(/&quot;name&quot;:&quot;.*?&quot;url&quot;:&quot;.*?&quot;/g) ?? [];
  const map = new Map<string, string>();

  for (const entry of entries) {
    const nameMatch = entry.match(/&quot;name&quot;:&quot;(.*?)&quot;/);
    const urlMatch = entry.match(/&quot;url&quot;:&quot;(.*?)&quot;/);

    if (!nameMatch || !urlMatch) {
      continue;
    }

    const name = decodeHtmlEntities(nameMatch[1]);
    const path = decodeHtmlEntities(urlMatch[1]);
    map.set(normalizeName(name), path.startsWith("http") ? path : `https://www.fhi.no${path}`);
  }

  return map;
}

export function resolveCountryPageUrl(country: CountrySeed, countryUrlMap: Map<string, string>): string {
  if (country.slug?.startsWith("http")) {
    return country.slug;
  }

  const byName = countryUrlMap.get(normalizeName(country.nameNo));
  if (byName) {
    return byName;
  }

  if (country.slug) {
    return `${FHI_BASE_URL}${country.slug.replace(/^\/+|\/+$/g, "")}/`;
  }

  throw new Error(`Fant ikke FHI-side for ${country.nameNo}`);
}

function extractMatches(text: string | null, patterns: Array<{ id: string; pattern: RegExp }>): string[] {
  if (!text) {
    return [];
  }

  return patterns.filter(({ pattern }) => pattern.test(text)).map(({ id }) => id);
}

function inferMalariaRisk(malariaText: string | null): CountryEntryDraft["malariaRisk"] {
  if (!malariaText) {
    return "none";
  }

  if (/ingen malaria|ingen risiko|malaria forekommer ikke/i.test(malariaText)) {
    return "none";
  }

  if (/hoy risiko|høy risiko/i.test(malariaText)) {
    return "high";
  }

  if (/middels risiko|moderat risiko/i.test(malariaText)) {
    return "moderate";
  }

  if (/lav risiko/i.test(malariaText)) {
    return "low";
  }

  if (/kun i|landsbygda|rurale omrader|rurale områder/i.test(malariaText)) {
    return "rural_only";
  }

  return "none";
}

function inferYellowFeverRequirement(yellowFeverText: string | null): CountryEntryDraft["yellowFeverRequirement"] {
  if (!yellowFeverText) {
    return "none";
  }

  if (/påkrevd.*alle reisende|obligatorisk.*alle reisende/i.test(yellowFeverText)) {
    return "required";
  }

  if (/påkrevd.*ved innreise fra endemisk område|fra land med gulfeber/i.test(yellowFeverText)) {
    return "required_if_from_endemic_country";
  }

  if (/anbefales/i.test(yellowFeverText)) {
    return "recommended";
  }

  return "none";
}

export function extractScrapedVaccineSignals(snapshot: FhiPageSnapshot): ScrapedVaccineSignals {
  const combinedTravelText = [
    snapshot.sections.vaccinesForAll,
    snapshot.sections.specialSituations,
    snapshot.sections.malaria,
    snapshot.sections.yellowFever,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    vaccinesForAll: extractMatches(snapshot.sections.vaccinesForAll, UNIVERSAL_VACCINE_PATTERNS),
    travelVaccines: extractMatches(combinedTravelText, TRAVEL_VACCINE_PATTERNS),
  };
}

export function buildCountryDraft(country: CountrySeed, snapshot: FhiPageSnapshot): CountryEntryDraft {
  const vaccineSignals = extractScrapedVaccineSignals(snapshot);
  const malariaRisk = inferMalariaRisk(snapshot.sections.malaria);
  const yellowFeverRequirement = inferYellowFeverRequirement(snapshot.sections.yellowFever);

  return {
    code: country.code,
    nameNo: country.nameNo,
    riskProfiles: vaccineSignals.travelVaccines,
    malariaRisk,
    malariaZones: snapshot.sections.malaria,
    yellowFeverRequirement,
    yellowFeverRecommended: yellowFeverRequirement === "recommended",
    fhiPageUrl: snapshot.pageUrl,
    lastScrapedDate: snapshot.fetchedAt.slice(0, 10),
    dataVersion: "0.1.0",
  };
}
