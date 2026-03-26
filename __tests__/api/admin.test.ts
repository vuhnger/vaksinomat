/**
 * Integrasjonstester for /api/admin/flag-review
 * Krever at dev-serveren kjører: npm run dev
 */

export {};

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
  test("returnerer 410 når review forsøkes", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: "test-consultation",
        action: "approve",
        doctorId: "test-doctor-1",
        doctorNote: "Ser greit ut, bekreftet av test",
      }),
    });

    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("unavailable");
  });

  test("returnerer 410 også for reject", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: "test-consultation",
        action: "reject",
        doctorId: "test-doctor-2",
        doctorNote: "Avvist av test",
      }),
    });

    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("unavailable");
  });

  test("returnerer 410 ved ugyldig action siden endpointet er deaktivert", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: "test-consultation",
        action: "ugyldigAction",
        doctorId: "test-doctor",
      }),
    });

    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("unavailable");
  });

  test("returnerer 410 ved manglende doctorId siden endpointet er deaktivert", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/flag-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: "test-consultation",
        action: "approve",
      }),
    });

    expect(res.status).toBe(410);
  });
});
