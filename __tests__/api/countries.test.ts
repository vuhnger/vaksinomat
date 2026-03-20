/**
 * Integrasjonstester for /api/countries
 * Krever at dev-serveren kjører: npm run dev
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("GET /api/countries", () => {
  test("returnerer liste med land → 200", async () => {
    const res = await fetch(`${BASE_URL}/api/countries`);
    expect(res.status).toBe(200);

    const countries = await res.json();
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(50);
  });

  test("hvert land har påkrevde felt", async () => {
    const res = await fetch(`${BASE_URL}/api/countries`);
    const countries = await res.json();

    for (const country of countries) {
      expect(typeof country.code).toBe("string");
      expect(country.code).toHaveLength(2);
      expect(typeof country.nameNo).toBe("string");
      expect(country).toHaveProperty("malariaRisk");
      expect(country).toHaveProperty("yellowFeverRequirement");
    }
  });

  test("søk på 'thai' returnerer Thailand", async () => {
    const res = await fetch(`${BASE_URL}/api/countries?q=thai`);
    expect(res.status).toBe(200);

    const countries = await res.json();
    expect(Array.isArray(countries)).toBe(true);
    const names = countries.map((c: { nameNo: string }) => c.nameNo.toLowerCase());
    expect(names.some((n: string) => n.includes("thai"))).toBe(true);
  });

  test("søk på 'belg' returnerer Belgia", async () => {
    const res = await fetch(`${BASE_URL}/api/countries?q=belg`);
    expect(res.status).toBe(200);

    const countries = await res.json();
    const found = countries.some((c: { nameNo: string }) =>
      c.nameNo.toLowerCase().includes("belg")
    );
    expect(found).toBe(true);
  });

  test("søk uten treff returnerer tom liste", async () => {
    const res = await fetch(`${BASE_URL}/api/countries?q=xyzikkeeksisterer999`);
    expect(res.status).toBe(200);

    const countries = await res.json();
    expect(countries).toHaveLength(0);
  });
});
