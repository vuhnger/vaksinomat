import type { Vaccine, Country, MalariaProphylaxis } from "@/lib/types";
import vaccinesRaw from "@/data/vaccines.json";
import countriesRaw from "@/data/countries.json";
import malariaRaw from "@/data/malaria-prophylaxis.json";

// Typed loaders for static JSON data

let _vaccines: Vaccine[] | null = null;
let _countries: Country[] | null = null;
let _malaria: MalariaProphylaxis[] | null = null;

export function getVaccines(): Vaccine[] {
  if (!_vaccines) {
    _vaccines = vaccinesRaw as Vaccine[];
  }
  return _vaccines;
}

export function getVaccineById(id: string): Vaccine | undefined {
  return getVaccines().find((v) => v.id === id);
}

export function getCountries(): Country[] {
  if (!_countries) {
    _countries = countriesRaw as Country[];
  }
  return _countries;
}

export function getCountryByCode(code: string): Country | undefined {
  return getCountries().find(
    (c) => c.code === code.toUpperCase()
  );
}

export function getMalariaProphylaxisList(): MalariaProphylaxis[] {
  if (!_malaria) {
    _malaria = malariaRaw as MalariaProphylaxis[];
  }
  return _malaria;
}

export function getMalariaProphylaxisById(
  id: string
): MalariaProphylaxis | undefined {
  return getMalariaProphylaxisList().find((m) => m.id === id);
}

export function searchCountries(query: string): Country[] {
  const q = query.toLowerCase().trim();
  if (!q) return getCountries();
  return getCountries().filter(
    (c) =>
      c.nameNo.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  );
}
