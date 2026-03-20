/**
 * Integrasjonstester for /api/admin/flag-review
 * Krever at dev-serveren kjører: npm run dev
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("GET /api/admin/flag-review", () => {
  test("returnerer liste med ventende anmeldelser → 200", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`);
    expect(res.status).toBe(200);

    const reviews = await res.json();
    expect(Array.isArray(reviews)).toBe(true);
  });
});

describe("PATCH /api/admin/flag-review", () => {
  let pendingConsultationId: string;

  beforeAll(async () => {
    // Opprett en konsultasjon som krever legegjennomgang (gravid + Gulfeber-destinasjon)
    const res = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthYear: 1990,
        isPregnant: true,
        isImmunocompromised: false,
        allergies: [],
        destinations: [{ countryCode: "BR", countryName: "Brasil", isLayover: false }],
        departureDate: "2027-08-01",
        returnDate: "2027-08-15",
        accommodationType: "hotel",
        localContact: "minimal",
        previousVaccinations: [],
        nurseId: "test-nurse",
      }),
    });
    const body = await res.json();
    pendingConsultationId = body.id;
  });

  test("godkjenner en pending konsultasjon → 200", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: pendingConsultationId,
        action: "approve",
        doctorId: "test-doctor-1",
        doctorNote: "Ser greit ut, bekreftet av test",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("avviser en konsultasjon → 200", async () => {
    // Opprett en ny pending konsultasjon å avvise
    const createRes = await fetch(`${BASE_URL}/api/consultation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthYear: 1990,
        isPregnant: true,
        isImmunocompromised: false,
        allergies: [],
        destinations: [{ countryCode: "BR", countryName: "Brasil", isLayover: false }],
        departureDate: "2027-09-01",
        returnDate: "2027-09-15",
        accommodationType: "hotel",
        localContact: "minimal",
        previousVaccinations: [],
        nurseId: "test-nurse",
      }),
    });
    const { id } = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: id,
        action: "reject",
        doctorId: "test-doctor-2",
        doctorNote: "Avvist av test",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("returnerer 400 ved ugyldig action", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: pendingConsultationId,
        action: "ugyldigAction",
        doctorId: "test-doctor",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation error");
  });

  test("returnerer 400 ved manglende doctorId", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: pendingConsultationId,
        action: "approve",
      }),
    });

    expect(res.status).toBe(400);
  });
});
