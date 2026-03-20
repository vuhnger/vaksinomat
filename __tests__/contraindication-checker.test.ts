import { checkContraindications } from "@/lib/engines/contraindication-checker";
import type { PatientData } from "@/lib/types";

jest.mock("@/lib/data/loader", () => ({
  getVaccineById: (id: string) => {
    const vaccines: Record<string, unknown> = {
      yellow_fever: {
        id: "yellow_fever",
        isLive: true,
        contraindications: ["pregnant", "immunocompromised", "egg_allergy"],
      },
      mmr: {
        id: "mmr",
        isLive: true,
        contraindications: ["pregnant", "immunocompromised"],
      },
      hep_a: {
        id: "hep_a",
        isLive: false,
        contraindications: [],
      },
    };
    return vaccines[id];
  },
}));

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    birthYear: 1985,
    isPregnant: false,
    isImmunocompromised: false,
    allergies: [],
    destinations: [],
    departureDate: "2025-06-01",
    returnDate: "2025-06-15",
    accommodationType: "hotel",
    localContact: "minimal",
    previousVaccinations: [],
    ...overrides,
  };
}

describe("checkContraindications", () => {
  test("Gravid pasient med Gulfeber-destinasjon: requiresDoctorReview = true", () => {
    const patient = makePatient({ isPregnant: true });
    const { requiresDoctorReview, internkontrollFlags, blockedVaccineIds } =
      checkContraindications(["yellow_fever", "hep_a"], patient);

    expect(requiresDoctorReview).toBe(true);
    expect(internkontrollFlags).toContain("pregnant_live_vaccine");
    expect(blockedVaccineIds.has("yellow_fever")).toBe(true);
    expect(blockedVaccineIds.has("hep_a")).toBe(false);
  });

  test("Immunsupprimert pasient: levende vaksiner blokkeres", () => {
    const patient = makePatient({ isImmunocompromised: true });
    const { blockedVaccineIds, internkontrollFlags } = checkContraindications(
      ["yellow_fever", "mmr", "hep_a"],
      patient
    );

    expect(blockedVaccineIds.has("yellow_fever")).toBe(true);
    expect(blockedVaccineIds.has("mmr")).toBe(true);
    expect(blockedVaccineIds.has("hep_a")).toBe(false);
    expect(internkontrollFlags).toContain("immunocompromised_live_vaccine");
  });

  test("Eggehviteallergi: Gulfeber blokkeres", () => {
    const patient = makePatient({ allergies: ["egg"] });
    const { blockedVaccineIds } = checkContraindications(["yellow_fever"], patient);
    expect(blockedVaccineIds.has("yellow_fever")).toBe(true);
  });

  test("Frisk pasient uten allergier: ingen KI", () => {
    const patient = makePatient();
    const { requiresDoctorReview, blockedVaccineIds, internkontrollFlags } =
      checkContraindications(["yellow_fever", "hep_a", "mmr"], patient);

    expect(requiresDoctorReview).toBe(false);
    expect(blockedVaccineIds.size).toBe(0);
    expect(internkontrollFlags).toHaveLength(0);
  });
});
