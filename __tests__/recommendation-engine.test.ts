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
});
