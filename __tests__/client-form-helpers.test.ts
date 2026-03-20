import { getRelevantAllergyTypes } from "@/lib/data/client-candidates";
import { getVaccineDisplayName, getVaccineHistoryConfig } from "@/lib/data/client-vaccines";

describe("client form helpers", () => {
  test("shows only allergies relevant to outstanding vaccines", () => {
    const allergies = getRelevantAllergyTypes(["mmr", "yellow_fever"], [
      { vaccineId: "mmr", completed: true },
    ]);

    expect(allergies).toEqual(["egg", "gelatin", "latex", "other"]);
  });

  test("treats completed hep_ab as covering hep_a and hep_b allergies", () => {
    const allergies = getRelevantAllergyTypes(["hep_a", "hep_b"], [
      { vaccineId: "hep_ab", completed: true },
    ]);

    expect(allergies).toEqual([]);
  });

  test("derives display names and history dose rules for vaccine UI", () => {
    expect(getVaccineDisplayName("yellow_fever")).toBe("Gulfeber");
    expect(getVaccineHistoryConfig("hep_b")).toEqual({
      maxSelectableDoses: 4,
      completionDoses: 3,
    });
    expect(getVaccineHistoryConfig("cholera")).toEqual({
      maxSelectableDoses: 2,
      completionDoses: 2,
    });
  });
});
