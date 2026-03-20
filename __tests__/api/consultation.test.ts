/**
 * Integrasjonstester for /api/consultation
 * Krever at dev-serveren kjører: npm run dev
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const validPayload = {
  birthYear: 1985,
  isPregnant: false,
  isImmunocompromised: false,
  allergies: [],
  destinations: [{ countryCode: "TH", countryName: "Thailand", isLayover: false }],
  departureDate: "2027-06-01",
  returnDate: "2027-06-15",
  accommodationType: "hotel",
  localContact: "minimal",
  previousVaccinations: [],
  nurseId: "test-nurse",
};

describe("POST /api/consultation", () => {
  test("oppretter konsultasjon med gyldig payload → 201", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(typeof body.id).toBe("string");
    expect(body.id.length).toBeGreaterThan(0);
    expect(body.result).toBeDefined();
    expect(Array.isArray(body.result.recommendations)).toBe(true);
    expect(typeof body.result.requiresDoctorReview).toBe("boolean");
    expect(typeof body.result.generatedAt).toBe("string");
  });

  test("Thailand (hotell, minimal kontakt) anbefaler Hep A", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    expect(res.status).toBe(201);
    const { result } = await res.json();
    const vaccineIds = result.recommendations.map((r: { vaccineId: string }) => r.vaccineId);
    expect(vaccineIds).toContain("hep_a");
  });

  test("frisk Thailand-pasient: requiresDoctorReview = false", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    expect(res.status).toBe(201);
    const { result } = await res.json();
    expect(result.requiresDoctorReview).toBe(false);
  });

  test("gravid pasient med Gulfeber-destinasjon (Brasil): requiresDoctorReview = true", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        isPregnant: true,
        destinations: [{ countryCode: "BR", countryName: "Brasil", isLayover: false }],
      }),
    });

    expect(res.status).toBe(201);
    const { result } = await res.json();
    expect(result.requiresDoctorReview).toBe(true);
    expect(result.internkontrollFlags.length).toBeGreaterThan(0);
  });

  test("returnerer 400 ved tom destinations-liste", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, destinations: [] }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation error");
  });

  test("returnerer 400 ved ugyldig allergi-verdi", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, allergies: ["peanut"] }),
    });

    expect(res.status).toBe(400);
  });

  test("returnerer 400 ved manglende påkrevde felt", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthYear: 1985 }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/consultation/:id", () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });
    const body = await res.json();
    createdId = body.id;
  });

  test("henter lagret konsultasjon → 200", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation/${createdId}`);
    expect(res.status).toBe(200);

    const consultation = await res.json();
    expect(consultation.id).toBe(createdId);
    expect(consultation.patientData).toBeDefined();
    expect(consultation.result).toBeDefined();
    expect(["approved", "pending_review"]).toContain(consultation.status);
    expect(consultation.createdAt).toBeDefined();
  });

  test("returnerer 404 for ukjent id", async () => {
    const res = await fetch(`${BASE_URL}/api/consultation/finnes-ikke-abc-xyz-000`);
    expect(res.status).toBe(404);
  });
});
