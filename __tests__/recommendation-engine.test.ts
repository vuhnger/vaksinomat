import { runRecommendationEngine } from "@/lib/engines/recommendation-engine";

describe("recommendation engine", () => {
  test("Frankrike viser grunnvaksiner, men ikke rabies kun pga hoy eksponering", () => {
    const result = runRecommendationEngine("test-id", {
      birthYear: 1990,
      isPregnant: false,
      isImmunocompromised: false,
      allergies: [],
      destinations: [{ countryCode: "FR", countryName: "Frankrike", isLayover: false }],
      departureDate: "2027-06-01",
      returnDate: "2027-06-10",
      accommodationType: "local",
      localContact: "extensive",
      previousVaccinations: [],
    });

    const vaccineIds = result.recommendations.map((rec) => rec.vaccineId);

    expect(vaccineIds).toContain("dtap");
    expect(vaccineIds).toContain("mmr");
    expect(vaccineIds).not.toContain("rabies");
    expect(vaccineIds).not.toContain("hep_b");
  });

  test("hoy eksponering i risikoland inkluderer rabies og hepatitt B", () => {
    const result = runRecommendationEngine("test-id", {
      birthYear: 1990,
      isPregnant: false,
      isImmunocompromised: false,
      allergies: [],
      destinations: [{ countryCode: "NG", countryName: "Nigeria", isLayover: false }],
      departureDate: "2027-06-01",
      returnDate: "2027-06-10",
      accommodationType: "local",
      localContact: "extensive",
      previousVaccinations: [],
    });

    const vaccineIds = result.recommendations.map((rec) => rec.vaccineId);

    expect(vaccineIds).toContain("dtap");
    expect(vaccineIds).toContain("mmr");
    expect(vaccineIds).toContain("rabies");
    expect(vaccineIds).toContain("hep_b");
  });

  test("sorterer anbefalinger etter prioritet", () => {
    const result = runRecommendationEngine("test-id", {
      birthYear: 1990,
      isPregnant: false,
      isImmunocompromised: false,
      allergies: [],
      destinations: [{ countryCode: "TH", countryName: "Thailand", isLayover: false }],
      departureDate: "2027-06-01",
      returnDate: "2027-06-10",
      accommodationType: "hotel",
      localContact: "minimal",
      previousVaccinations: [],
    });

    const levelOrder = {
      required: 0,
      strongly_recommended: 1,
      recommended: 2,
      consider: 3,
      not_recommended: 4,
    } as const;

    const levels = result.recommendations.map((rec) => rec.level);
    expect(levels).toEqual(
      [...levels].sort((a, b) => levelOrder[a] - levelOrder[b])
    );
  });
});
