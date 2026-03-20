import countriesData from "@/data/countries.json";
import type { AllergyType, PreviousVaccination } from "@/lib/types";

// Same mapping as server-side recommendation-engine (no Node deps)
const RISK_PROFILE_VACCINES: Record<string, string> = {
  hepatitis_a: "hep_a",
  hepatitis_b: "hep_b",
  typhoid: "typhoid_inj",
  rabies: "rabies",
  japanese_encephalitis: "japanese_encephalitis",
  meningococcal: "meningococcal",
  cholera: "cholera",
};

const VACCINE_ALLERGENS: Partial<Record<string, AllergyType[]>> = {
  yellow_fever: ["egg", "gelatin"],
  varicella: ["gelatin", "neomycin"],
  mmr: ["gelatin", "neomycin"],
  japanese_encephalitis: ["gelatin"],
  hep_b: ["yeast"],
  hep_ab: ["yeast"],
};

export function getCandidateVaccineIds(
  destinations: { countryCode: string }[],
  accommodationType: "hotel" | "local",
  localContact: "minimal" | "extensive"
): string[] {
  const codes = new Set(destinations.map((d) => d.countryCode));
  const relevantCountries = (countriesData as Array<{
    code: string;
    riskProfiles: string[];
    yellowFeverRequirement: string;
    yellowFeverRecommended: boolean;
  }>).filter((c) => codes.has(c.code));

  const riskProfiles = new Set<string>();
  let yellowFeverNeeded = false;

  for (const country of relevantCountries) {
    for (const rp of country.riskProfiles) riskProfiles.add(rp);
    if (country.yellowFeverRequirement === "required" || country.yellowFeverRecommended) {
      yellowFeverNeeded = true;
    }
  }

  const highExposure = accommodationType === "local" || localContact === "extensive";
  if (highExposure) {
    riskProfiles.add("rabies");
    riskProfiles.add("hepatitis_b");
  }

  const candidates = new Set<string>();
  for (const rp of riskProfiles) {
    if (RISK_PROFILE_VACCINES[rp]) candidates.add(RISK_PROFILE_VACCINES[rp]);
  }
  if (yellowFeverNeeded) candidates.add("yellow_fever");

  return Array.from(candidates);
}

function getOutstandingVaccineIds(
  vaccineIds: string[],
  previousVaccinations: PreviousVaccination[]
): string[] {
  const completedIds = new Set(
    previousVaccinations
      .filter((vaccination) => vaccination.completed === true)
      .map((vaccination) => vaccination.vaccineId)
  );

  if (completedIds.has("hep_ab")) {
    completedIds.add("hep_a");
    completedIds.add("hep_b");
  }

  return vaccineIds.filter((vaccineId) => !completedIds.has(vaccineId));
}

export function getRelevantAllergyTypes(
  vaccineIds: string[],
  previousVaccinations: PreviousVaccination[] = []
): AllergyType[] {
  const relevant = new Set<AllergyType>();
  const outstandingVaccineIds = getOutstandingVaccineIds(vaccineIds, previousVaccinations);

  for (const vaccineId of outstandingVaccineIds) {
    for (const a of VACCINE_ALLERGENS[vaccineId] ?? []) relevant.add(a);
  }

  if (outstandingVaccineIds.length > 0) {
    relevant.add("latex");
    relevant.add("other");
  }

  const allergyOrder: AllergyType[] = ["egg", "gelatin", "neomycin", "yeast", "latex", "other"];

  return allergyOrder.filter((allergy) => relevant.has(allergy));
}
