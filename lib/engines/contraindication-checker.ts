import type {
  PatientData,
  ContraindIndicationResult,
  DynamicQuestion,
  InternkontrollFlag,
} from "@/lib/types";
import { getVaccineById } from "@/lib/data/loader";

// Map of contraindication IDs to patient condition checks
function patientHasContraindication(
  conditionId: string,
  patient: PatientData
): boolean {
  switch (conditionId) {
    case "pregnant":
      return patient.isPregnant;
    case "immunocompromised":
      return patient.isImmunocompromised;
    case "egg_allergy":
      return patient.allergies.includes("egg");
    case "age_under_9_months": {
      const age = new Date().getFullYear() - patient.birthYear;
      return age < 1; // Simplified: < 1 year old
    }
    case "hiv_low_cd4":
      return (
        patient.isHivPositive === true &&
        (patient.cd4Count === undefined || patient.cd4Count < 200)
      );
    default:
      return false;
  }
}

const CONTRAINDICATION_DESCRIPTIONS: Record<string, string> = {
  pregnant:
    "Levende vaksiner er kontraindisert under graviditet (absolutt KI).",
  immunocompromised:
    "Levende vaksiner er kontraindisert ved immunsuppresjon (absolutt KI).",
  egg_allergy:
    "Gulfeberrvaksine er kontraindisert ved kjent eggehviteallergi (absolutt KI).",
  age_under_9_months:
    "Gulfeberrvaksine er kontraindisert hos barn under 9 måneder.",
  hiv_low_cd4:
    "Levende vaksiner og rabies er kontraindisert ved HIV med CD4 < 200.",
};

export interface ContraindicationCheckResult {
  contraindications: ContraindIndicationResult[];
  internkontrollFlags: InternkontrollFlag[];
  requiresDoctorReview: boolean;
  blockedVaccineIds: Set<string>;
}

export function checkContraindications(
  candidateVaccineIds: string[],
  patient: PatientData
): ContraindicationCheckResult {
  const contraindications: ContraindIndicationResult[] = [];
  const flags: InternkontrollFlag[] = [];
  const blockedVaccineIds = new Set<string>();

  for (const vaccineId of candidateVaccineIds) {
    const vaccine = getVaccineById(vaccineId);
    if (!vaccine) continue;

    for (const conditionId of vaccine.contraindications) {
      if (patientHasContraindication(conditionId, patient)) {
        blockedVaccineIds.add(vaccineId);

        // Check if we've already recorded this condition
        const existing = contraindications.find(
          (c) => c.condition === conditionId
        );
        if (existing) {
          if (!existing.affectedVaccineIds.includes(vaccineId)) {
            existing.affectedVaccineIds.push(vaccineId);
          }
        } else {
          contraindications.push({
            condition: conditionId,
            severity: "absolute",
            affectedVaccineIds: [vaccineId],
            description:
              CONTRAINDICATION_DESCRIPTIONS[conditionId] ??
              `Kontraindikasjon: ${conditionId}`,
          });
        }

        // Map to internkontroll flags
        if (conditionId === "pregnant" && vaccine.isLive) {
          if (!flags.includes("pregnant_live_vaccine")) {
            flags.push("pregnant_live_vaccine");
          }
        }
        if (conditionId === "immunocompromised" && vaccine.isLive) {
          if (!flags.includes("immunocompromised_live_vaccine")) {
            flags.push("immunocompromised_live_vaccine");
          }
        }
        if (conditionId === "egg_allergy") {
          if (!flags.includes("egg_allergy_yellow_fever")) {
            flags.push("egg_allergy_yellow_fever");
          }
        }
        if (conditionId === "hiv_low_cd4") {
          if (!flags.includes("hiv_low_cd4")) {
            flags.push("hiv_low_cd4");
          }
        }

        if (!flags.includes("absolute_contraindication")) {
          flags.push("absolute_contraindication");
        }
      }
    }
  }

  const requiresDoctorReview =
    patient.isPregnant ||
    patient.isImmunocompromised ||
    patient.isHivPositive === true ||
    flags.length > 0;

  return { contraindications, internkontrollFlags: flags, requiresDoctorReview, blockedVaccineIds };
}

// Dynamic follow-up questions triggered by candidate vaccines
export function getDynamicQuestions(
  candidateVaccineIds: string[],
  patient: PatientData,
  existingAnswers: Record<string, unknown> = {}
): DynamicQuestion[] {
  const questions: DynamicQuestion[] = [];

  if (candidateVaccineIds.includes("yellow_fever") && !patient.allergies.includes("egg")) {
    if (existingAnswers["egg_allergy_followup"] === undefined) {
      questions.push({
        id: "egg_allergy_followup",
        triggeredByVaccineId: "yellow_fever",
        question: "Har pasienten kjent eggehviteallergi?",
        type: "boolean",
      });
    }
  }

  if (
    (patient.isImmunocompromised || candidateVaccineIds.includes("rabies")) &&
    existingAnswers["hiv_status"] === undefined
  ) {
    questions.push({
      id: "hiv_status",
      triggeredByVaccineId: "rabies",
      question: "Er pasienten HIV-positiv?",
      type: "boolean",
    });
  }

  if (
    patient.isHivPositive === true &&
    existingAnswers["cd4_count"] === undefined
  ) {
    questions.push({
      id: "cd4_count",
      triggeredByVaccineId: "rabies",
      question: "Hva er siste kjente CD4-telling?",
      type: "number",
    });
  }

  return questions;
}
