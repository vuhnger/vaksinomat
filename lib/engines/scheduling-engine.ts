import { addDays, differenceInDays, format, parseISO } from "date-fns";
import type {
  Vaccine,
  VaccineRecommendation,
  DatedDose,
  PatientData,
  MalariaRecommendation,
} from "@/lib/types";
import { getVaccineById, getMalariaProphylaxisById } from "@/lib/data/loader";

const ISO_DATE = "yyyy-MM-dd";

function toDate(dateStr: string): Date {
  return parseISO(dateStr);
}

function formatDate(date: Date): string {
  return format(date, ISO_DATE);
}

// Live vaccines must be given same day OR ≥ 28 days apart
const LIVE_VACCINE_MIN_GAP_DAYS = 28;

// IDs of live vaccines
const LIVE_VACCINE_IDS = new Set([
  "yellow_fever",
  "mmr",
  "varicella",
  "typhoid_oral",
]);

interface ScheduledVaccineInput {
  vaccineId: string;
  level: "required" | "strongly_recommended" | "recommended" | "consider";
  reason: string;
}

export interface SchedulingResult {
  recommendations: VaccineRecommendation[];
  conflicts: string[];
}

export function scheduleVaccines(
  candidates: ScheduledVaccineInput[],
  patient: PatientData,
  blockedVaccineIds: Set<string>
): SchedulingResult {
  const today = new Date();
  const departureDate = toDate(patient.departureDate);
  const daysUntilTravel = differenceInDays(departureDate, today);
  const recommendations: VaccineRecommendation[] = [];
  const conflicts: string[] = [];

  // Track when live vaccines are scheduled to resolve conflicts
  let firstLiveVaccineDate: Date | null = null;

  for (const candidate of candidates) {
    if (blockedVaccineIds.has(candidate.vaccineId)) {
      continue;
    }

    const vaccine = getVaccineById(candidate.vaccineId);
    if (!vaccine) continue;

    // Determine schedule variant
    let doses = getDoses(vaccine, patient, daysUntilTravel);
    let scheduleVariant: "standard" | "accelerated" | undefined;

    if (vaccine.schedule.standard && vaccine.schedule.accelerated) {
      // Use accelerated if < 6 months until travel for Hep B
      if (daysUntilTravel < 180) {
        doses = vaccine.schedule.accelerated.doses;
        scheduleVariant = "accelerated";
      } else {
        doses = vaccine.schedule.standard.doses;
        scheduleVariant = "standard";
      }
    }

    // Handle live vaccine scheduling
    let startDate = today;
    if (LIVE_VACCINE_IDS.has(vaccine.id)) {
      if (firstLiveVaccineDate === null) {
        firstLiveVaccineDate = today;
      } else {
        // Check if it's the same day (OK) or needs ≥ 28 days gap
        const gapFromFirst = differenceInDays(today, firstLiveVaccineDate);
        if (gapFromFirst < LIVE_VACCINE_MIN_GAP_DAYS) {
          // Schedule after the gap
          startDate = addDays(firstLiveVaccineDate, LIVE_VACCINE_MIN_GAP_DAYS);
          conflicts.push(
            `${vaccine.displayNameNo}: Utsatt ${LIVE_VACCINE_MIN_GAP_DAYS} dager fra første levende vaksine pga. live-vaksine-regel.`
          );
        }
      }
    }

    const datedDoses: DatedDose[] = doses.map((dose) => {
      const targetDate = addDays(startDate, dose.dayOffset);
      const daysBeforeTravel = differenceInDays(departureDate, targetDate);

      // Feasibility check
      const minDays = vaccine.schedule.minDaysBeforeTravel ?? 0;
      const feasible = daysBeforeTravel >= minDays;

      return {
        doseNumber: dose.doseNumber,
        label: dose.label,
        targetDate: formatDate(targetDate),
        daysBeforeTravel,
        feasible,
        note: dose.isBooster ? "Boosterdose" : undefined,
      };
    });

    // Gulfeber certificate validity
    let certificateValidFrom: string | undefined;
    if (vaccine.id === "yellow_fever" && vaccine.schedule.certificateValidFromDays !== undefined) {
      const certDate = addDays(startDate, vaccine.schedule.certificateValidFromDays);
      certificateValidFrom = formatDate(certDate);
    }

    const allFeasible = datedDoses.every((d) => d.feasible);

    recommendations.push({
      vaccineId: vaccine.id,
      displayNameNo: vaccine.displayNameNo,
      level: candidate.level,
      reason: candidate.reason,
      datedDoses,
      scheduleVariant,
      certificateValidFrom,
      feasible: allFeasible,
      contraindications: [],
    });
  }

  return { recommendations, conflicts };
}

function getDoses(
  vaccine: Vaccine,
  _patient: PatientData,
  _daysUntilTravel: number
) {
  if (vaccine.schedule.doses) {
    return vaccine.schedule.doses;
  }
  if (vaccine.schedule.standard) {
    return vaccine.schedule.standard.doses;
  }
  return [];
}

export function scheduleMalariaProphylaxis(
  prophylaxisId: string,
  patient: PatientData,
  reason: string
): MalariaRecommendation | null {
  const prophylaxis = getMalariaProphylaxisById(prophylaxisId);
  if (!prophylaxis) return null;

  const departureDate = toDate(patient.departureDate);
  const returnDate = toDate(patient.returnDate);

  const startDate = addDays(
    departureDate,
    -prophylaxis.schedule.startDaysBeforeTravel
  );
  const stopDate = addDays(
    returnDate,
    prophylaxis.schedule.stopDaysAfterReturn
  );

  return {
    prophylaxisId,
    displayNameNo: prophylaxis.displayNameNo,
    startDate: formatDate(startDate),
    stopDate: formatDate(stopDate),
    reason,
  };
}
