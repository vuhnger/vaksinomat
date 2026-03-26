import type { RecommendationResult } from "@/lib/types";

const CONSULTATION_STORAGE_PREFIX = "consultation-result:";

export function saveConsultationResult(id: string, result: RecommendationResult): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    `${CONSULTATION_STORAGE_PREFIX}${id}`,
    JSON.stringify(result)
  );
}

export function loadConsultationResult(id: string): RecommendationResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`${CONSULTATION_STORAGE_PREFIX}${id}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RecommendationResult;
  } catch {
    return null;
  }
}
