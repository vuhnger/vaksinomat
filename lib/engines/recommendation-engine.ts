import type {
  PatientData,
  RecommendationResult,
  Country,
  DynamicQuestion,
  VaccineRecommendation,
} from "@/lib/types";
import { getCountryByCode, getVaccines } from "@/lib/data/loader";
import {
  checkContraindications,
  getDynamicQuestions,
} from "./contraindication-checker";
import {
  scheduleVaccines,
  scheduleMalariaProphylaxis,
} from "./scheduling-engine";

// Risk profile → vaccine mapping
const RISK_PROFILE_VACCINES: Record<
  string,
  {
    vaccineId: string;
    level: "required" | "strongly_recommended" | "recommended" | "consider";
    reason: string;
  }
> = {
  hepatitis_a: {
    vaccineId: "hep_a",
    level: "strongly_recommended",
    reason: "Hepatitt A smitter via forurenset mat/vann i destinasjonslandet.",
  },
  hepatitis_b: {
    vaccineId: "hep_b",
    level: "recommended",
    reason: "Hepatitt B smitter via blod/kroppsvæsker – risiko ved lokal medisinsk kontakt.",
  },
  typhoid: {
    vaccineId: "typhoid_inj",
    level: "recommended",
    reason: "Tyfoid smitter via forurenset mat/vann.",
  },
  rabies: {
    vaccineId: "rabies",
    level: "consider",
    reason: "Rabies anbefales ved tett kontakt med dyr og/eller utilgjengelig medisinsk hjelp.",
  },
  japanese_encephalitis: {
    vaccineId: "japanese_encephalitis",
    level: "consider",
    reason: "Japansk encefalitt anbefales ved lengre opphold på landsbygda i risikoperioden.",
  },
  meningococcal: {
    vaccineId: "meningococcal",
    level: "recommended",
    reason: "Meningokokkvaksine anbefales for reiser til meningittbeltet.",
  },
  cholera: {
    vaccineId: "cholera",
    level: "consider",
    reason: "Dukoral vurderes ved risiko for kolera/ETEC-diaré.",
  },
};

// Yellow fever specific logic
const YELLOW_FEVER_REQUIRED_COUNTRIES = new Set([
  "AO", "BJ", "BF", "CM", "CF", "TD", "CG", "CD", "CI", "GQ",
  "ET", "GA", "GH", "GN", "GW", "KE", "LR", "ML", "MR", "NE",
  "NG", "RW", "SN", "SL", "SO", "SS", "SD", "TG", "TZ", "UG", "ZM"
]);

const UNIVERSAL_TRAVEL_VACCINES: Array<{
  vaccineId: string;
  level: "required" | "strongly_recommended" | "recommended" | "consider";
  reason: string;
}> = [
  {
    vaccineId: "dtap",
    level: "recommended",
    reason: "Pass på at grunnvaksinasjon og oppfriskningsdoser for dTP-IPV er oppdatert for utenlandsreise.",
  },
  {
    vaccineId: "mmr",
    level: "recommended",
    reason: "Pass på at MMR-vaksinasjon er oppdatert for utenlandsreise.",
  },
];

function getMalariaProhylaxisId(malariaRisk: string): string {
  // Default to Malarone for most destinations
  switch (malariaRisk) {
    case "high":
    case "moderate":
    case "rural_only":
      return "malarone";
    default:
      return "";
  }
}

export function runRecommendationEngine(
  consultationId: string,
  patient: PatientData,
  dynamicAnswers: Record<string, unknown> = {}
): RecommendationResult {
  // Apply dynamic answers to patient data
  const enrichedPatient = applyDynamicAnswers(patient, dynamicAnswers);

  // Collect all destination countries
  const countries: Country[] = enrichedPatient.destinations
    .map((d) => getCountryByCode(d.countryCode))
    .filter((c): c is Country => c !== undefined);

  // Aggregate risk profiles from all destinations
  const allRiskProfiles = new Set<string>();
  let maxMalariaRisk: "none" | "low" | "rural_only" | "moderate" | "high" = "none";
  let yellowFeverNeeded = false;
  const malariaRiskOrder = ["none", "low", "rural_only", "moderate", "high"];

  for (const country of countries) {
    for (const rp of country.riskProfiles) {
      allRiskProfiles.add(rp);
    }
    if (
      malariaRiskOrder.indexOf(country.malariaRisk) >
      malariaRiskOrder.indexOf(maxMalariaRisk)
    ) {
      maxMalariaRisk = country.malariaRisk;
    }
    if (
      country.yellowFeverRequirement === "required" ||
      country.yellowFeverRecommended
    ) {
      yellowFeverNeeded = true;
    }
  }

  // Adjust based on exposure profile
  const highExposure =
    enrichedPatient.accommodationType === "local" ||
    enrichedPatient.localContact === "extensive";
  const hasDestinationSpecificRisk = countries.some(
    (country) =>
      country.riskProfiles.length > 0 ||
      country.yellowFeverRequirement === "required" ||
      country.yellowFeverRecommended
  );

  if (highExposure && hasDestinationSpecificRisk) {
    // Upgrade rabies from "consider" to "recommended" for high exposure
    allRiskProfiles.add("rabies");
    allRiskProfiles.add("hepatitis_b");
  }

  // Build candidate vaccine list
  const candidates: Array<{
    vaccineId: string;
    level: "required" | "strongly_recommended" | "recommended" | "consider";
    reason: string;
  }> = [];

  if (countries.length > 0) {
    candidates.push(...UNIVERSAL_TRAVEL_VACCINES);
  }

  for (const riskProfile of allRiskProfiles) {
    const mapping = RISK_PROFILE_VACCINES[riskProfile];
    if (mapping) {
      // Upgrade rabies to "recommended" for high exposure
      if (mapping.vaccineId === "rabies" && highExposure) {
        candidates.push({
          ...mapping,
          level: "recommended",
          reason: "Rabies anbefales ved lokal overnatting og/eller tett kontakt med lokalbefolkning.",
        });
      } else {
        candidates.push(mapping);
      }
    }
  }

  if (yellowFeverNeeded) {
    candidates.push({
      vaccineId: "yellow_fever",
      level: "required",
      reason:
        "Gulfeber er obligatorisk innreisekrav eller sterkt anbefalt for destinasjonslandet.",
    });
  }

  // Deduplicate candidates (keep highest level)
  const deduped = deduplicateCandidates(candidates);

  // Filter out vaccines the patient has already completed
  const completedIds = new Set(
    enrichedPatient.previousVaccinations
      .filter((v) => v.completed === true)
      .map((v) => v.vaccineId)
  );
  // If hep_ab is complete, both hep_a and hep_b are covered
  if (completedIds.has("hep_ab")) {
    completedIds.add("hep_a");
    completedIds.add("hep_b");
  }
  const filteredCandidates = deduped.filter((c) => !completedIds.has(c.vaccineId));

  // Check contraindications
  const candidateIds = filteredCandidates.map((c) => c.vaccineId);
  const { contraindications, internkontrollFlags, requiresDoctorReview, blockedVaccineIds } =
    checkContraindications(candidateIds, enrichedPatient);

  // Get dynamic follow-up questions
  const dynamicQuestions: DynamicQuestion[] = getDynamicQuestions(
    candidateIds,
    enrichedPatient,
    dynamicAnswers
  );

  // Schedule vaccines
  const { recommendations, conflicts: _conflicts } = scheduleVaccines(
    filteredCandidates,
    enrichedPatient,
    blockedVaccineIds
  );

  // Add contraindication info to blocked recommendations
  for (const rec of recommendations) {
    rec.contraindications = contraindications.filter((ci) =>
      ci.affectedVaccineIds.includes(rec.vaccineId)
    );
  }

  // Malaria prophylaxis
  let malariaRecommendation = undefined;
  if (maxMalariaRisk !== "none" && maxMalariaRisk !== "low") {
    const prophylaxisId = getMalariaProhylaxisId(maxMalariaRisk);
    if (prophylaxisId) {
      malariaRecommendation =
        scheduleMalariaProphylaxis(
          prophylaxisId,
          enrichedPatient,
          `Malaria er en risiko i deler av reisemålet (${maxMalariaRisk}).`
        ) ?? undefined;
    }
  }

  return {
    consultationId,
    patientData: enrichedPatient,
    recommendations: sortRecommendations(recommendations),
    malariaRecommendation,
    contraindications,
    internkontrollFlags,
    requiresDoctorReview,
    dynamicQuestions,
    generatedAt: new Date().toISOString(),
  };
}

function sortRecommendations(recommendations: VaccineRecommendation[]): VaccineRecommendation[] {
  const levelOrder: Record<VaccineRecommendation["level"], number> = {
    required: 0,
    strongly_recommended: 1,
    recommended: 2,
    consider: 3,
    not_recommended: 4,
  };

  return [...recommendations].sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

function applyDynamicAnswers(
  patient: PatientData,
  answers: Record<string, unknown>
): PatientData {
  const updated = { ...patient };

  if (answers["egg_allergy_followup"] === true) {
    if (!updated.allergies.includes("egg")) {
      updated.allergies = [...updated.allergies, "egg"];
    }
  }
  if (answers["hiv_status"] === true) {
    updated.isHivPositive = true;
  }
  if (typeof answers["cd4_count"] === "number") {
    updated.cd4Count = answers["cd4_count"] as number;
  }

  return updated;
}

function deduplicateCandidates(
  candidates: Array<{
    vaccineId: string;
    level: "required" | "strongly_recommended" | "recommended" | "consider";
    reason: string;
  }>
) {
  const levelOrder: Record<string, number> = {
    required: 4,
    strongly_recommended: 3,
    recommended: 2,
    consider: 1,
  };

  const map = new Map<
    string,
    { vaccineId: string; level: "required" | "strongly_recommended" | "recommended" | "consider"; reason: string }
  >();

  for (const c of candidates) {
    const existing = map.get(c.vaccineId);
    if (!existing || levelOrder[c.level] > levelOrder[existing.level]) {
      map.set(c.vaccineId, c);
    }
  }

  return Array.from(map.values());
}
