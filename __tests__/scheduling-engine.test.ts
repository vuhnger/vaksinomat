import { scheduleVaccines, scheduleMalariaProphylaxis } from "@/lib/engines/scheduling-engine";
import type { PatientData } from "@/lib/types";

// Mock data loader
jest.mock("@/lib/data/loader", () => ({
  getVaccineById: (id: string) => {
    const vaccines: Record<string, unknown> = {
      yellow_fever: {
        id: "yellow_fever",
        displayNameNo: "Gulfeber",
        isLive: true,
        schedule: {
          doses: [{ doseNumber: 1, label: "Dose 1", dayOffset: 0 }],
          minDaysBeforeTravel: 10,
          certificateValidFromDays: 10,
        },
        contraindications: ["pregnant", "immunocompromised", "egg_allergy"],
      },
      hep_a: {
        id: "hep_a",
        displayNameNo: "Hepatitt A",
        isLive: false,
        schedule: {
          doses: [
            { doseNumber: 1, label: "Dose 1", dayOffset: 0 },
            { doseNumber: 2, label: "Booster", dayOffset: 180, isBooster: true },
          ],
          minDaysBeforeTravel: 0,
        },
        contraindications: [],
      },
      rabies: {
        id: "rabies",
        displayNameNo: "Rabies",
        isLive: false,
        schedule: {
          doses: [
            { doseNumber: 1, label: "Dose 1", dayOffset: 0 },
            { doseNumber: 2, label: "Dose 2", dayOffset: 7 },
            { doseNumber: 3, label: "Dose 3", dayOffset: 21 },
          ],
          minDaysBeforeTravel: 1,
        },
        contraindications: [],
      },
      mmr: {
        id: "mmr",
        displayNameNo: "MMR",
        isLive: true,
        schedule: {
          doses: [{ doseNumber: 1, label: "Dose 1", dayOffset: 0 }],
          minDaysBeforeTravel: 0,
        },
        contraindications: ["pregnant"],
      },
      varicella: {
        id: "varicella",
        displayNameNo: "Varicella",
        isLive: true,
        schedule: {
          doses: [
            { doseNumber: 1, label: "Dose 1", dayOffset: 0 },
            { doseNumber: 2, label: "Dose 2", dayOffset: 42 },
          ],
          minDaysBeforeTravel: 0,
        },
        contraindications: ["pregnant"],
      },
    };
    return vaccines[id];
  },
  getMalariaProphylaxisById: (id: string) => {
    const prophylaxis: Record<string, unknown> = {
      malarone: {
        id: "malarone",
        displayNameNo: "Malarone",
        type: "prophylaxis",
        schedule: {
          startDaysBeforeTravel: 2,
          stopDaysAfterReturn: 7,
        },
        contraindications: [],
      },
    };
    return prophylaxis[id];
  },
}));

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    birthYear: 1985,
    isPregnant: false,
    isImmunocompromised: false,
    allergies: [],
    destinations: [{ countryCode: "TH", countryName: "Thailand", isLayover: false }],
    departureDate: "2025-06-01",
    returnDate: "2025-06-15",
    accommodationType: "hotel",
    localContact: "minimal",
    previousVaccinations: [],
    ...overrides,
  };
}

describe("scheduleVaccines", () => {
  test("Gulfeber sertifikat gyldig fra dag 10", () => {
    const patient = makePatient({ departureDate: "2025-06-01" });
    const { recommendations } = scheduleVaccines(
      [{ vaccineId: "yellow_fever", level: "required", reason: "test" }],
      patient,
      new Set()
    );

    expect(recommendations).toHaveLength(1);
    const rec = recommendations[0];
    expect(rec.certificateValidFrom).toBeDefined();

    // Certificate should be 10 days after today
    const today = new Date();
    const certDate = new Date(rec.certificateValidFrom!);
    const diff = Math.round((certDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(10);
  });

  test("Rabies 3-dosesplan: dag 0, 7, 21", () => {
    const patient = makePatient({ departureDate: "2025-09-01" });
    const { recommendations } = scheduleVaccines(
      [{ vaccineId: "rabies", level: "recommended", reason: "test" }],
      patient,
      new Set()
    );

    expect(recommendations).toHaveLength(1);
    const doses = recommendations[0].datedDoses;
    expect(doses).toHaveLength(3);

    const today = new Date();
    const dose1 = new Date(doses[0].targetDate);
    const dose2 = new Date(doses[1].targetDate);
    const dose3 = new Date(doses[2].targetDate);

    const gap1to2 = Math.round((dose2.getTime() - dose1.getTime()) / (1000 * 60 * 60 * 24));
    const gap1to3 = Math.round((dose3.getTime() - dose1.getTime()) / (1000 * 60 * 60 * 24));

    expect(gap1to2).toBe(7);
    expect(gap1to3).toBe(21);
  });

  test("Live-vaksine konflikt: MMR og Varicella utsettes 28 dager", () => {
    const patient = makePatient({ departureDate: "2025-12-01" });
    const { recommendations, } = scheduleVaccines(
      [
        { vaccineId: "mmr", level: "recommended", reason: "test" },
        { vaccineId: "varicella", level: "recommended", reason: "test" },
      ],
      patient,
      new Set()
    );

    expect(recommendations).toHaveLength(2);
    const mmrDate = new Date(recommendations[0].datedDoses[0].targetDate);
    const varicellaDate = new Date(recommendations[1].datedDoses[0].targetDate);

    // Either same day or >= 28 days apart
    const diff = Math.abs(
      Math.round((varicellaDate.getTime() - mmrDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    expect(diff === 0 || diff >= 28).toBe(true);
  });

  test("Blokkerte vaksiner inkluderes ikke i resultater", () => {
    const patient = makePatient();
    const { recommendations } = scheduleVaccines(
      [{ vaccineId: "yellow_fever", level: "required", reason: "test" }],
      patient,
      new Set(["yellow_fever"])
    );

    expect(recommendations).toHaveLength(0);
  });

  test("Hep A dose 1 er alltid feasible (minDaysBeforeTravel = 0)", () => {
    // Even with departure tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const patient = makePatient({ departureDate: tomorrow.toISOString().split("T")[0] });

    const { recommendations } = scheduleVaccines(
      [{ vaccineId: "hep_a", level: "strongly_recommended", reason: "test" }],
      patient,
      new Set()
    );

    expect(recommendations[0].datedDoses[0].feasible).toBe(true);
  });
});

describe("scheduleMalariaProphylaxis", () => {
  test("Malarone: start 2 dager før, slutt 7 dager etter retur", () => {
    const patient = makePatient({
      departureDate: "2025-06-01",
      returnDate: "2025-06-15",
    });

    const rec = scheduleMalariaProphylaxis("malarone", patient, "test");
    expect(rec).not.toBeNull();

    const start = new Date(rec!.startDate);
    const stop = new Date(rec!.stopDate);
    const departure = new Date("2025-06-01");
    const returnDate = new Date("2025-06-15");

    const startDiff = Math.round(
      (departure.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const stopDiff = Math.round(
      (stop.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(startDiff).toBe(2);
    expect(stopDiff).toBe(7);
  });
});
