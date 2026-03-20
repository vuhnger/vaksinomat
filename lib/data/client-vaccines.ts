import vaccinesData from "@/data/vaccines.json";

type VaccineScheduleLike = {
  doses?: Array<unknown>;
  standard?: { doses?: Array<unknown> };
  accelerated?: { doses?: Array<unknown> };
};

type VaccineLike = {
  id: string;
  displayNameNo: string;
  schedule: VaccineScheduleLike;
};

type VaccineHistoryConfig = {
  maxSelectableDoses: number;
  completionDoses: number;
};

const HISTORY_OVERRIDES: Partial<Record<string, VaccineHistoryConfig>> = {
  hep_b: { maxSelectableDoses: 4, completionDoses: 3 },
  hep_ab: { maxSelectableDoses: 4, completionDoses: 3 },
  mmr: { maxSelectableDoses: 2, completionDoses: 2 },
};

const vaccines = vaccinesData as VaccineLike[];

function getDoseCounts(schedule: VaccineScheduleLike): number[] {
  const counts = [
    schedule.doses?.length,
    schedule.standard?.doses?.length,
    schedule.accelerated?.doses?.length,
  ].filter((count): count is number => typeof count === "number" && count > 0);

  return counts.length > 0 ? counts : [1];
}

export function getVaccineDisplayName(vaccineId: string): string | undefined {
  return vaccines.find((v) => v.id === vaccineId)?.displayNameNo;
}

export function getVaccineHistoryConfig(vaccineId: string): VaccineHistoryConfig {
  const override = HISTORY_OVERRIDES[vaccineId];
  if (override) {
    return override;
  }

  const vaccine = vaccines.find((v) => v.id === vaccineId);
  if (!vaccine) {
    return { maxSelectableDoses: 1, completionDoses: 1 };
  }

  const counts = getDoseCounts(vaccine.schedule);

  return {
    maxSelectableDoses: Math.max(...counts),
    completionDoses: Math.min(...counts),
  };
}
