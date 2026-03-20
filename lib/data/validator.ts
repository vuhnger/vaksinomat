import { z } from "zod";

// Vaccine schedule dose schema
const vaccineDoseSchema = z.object({
  doseNumber: z.number().int().positive(),
  label: z.string(),
  dayOffset: z.number().int().min(0),
  isBooster: z.boolean().optional(),
});

const scheduleVariantSchema = z.object({
  doses: z.array(vaccineDoseSchema),
  minDaysBeforeTravel: z.number().int().min(0),
  notes: z.string().optional(),
});

const vaccineScheduleSchema = z.object({
  doses: z.array(vaccineDoseSchema).optional(),
  standard: scheduleVariantSchema.optional(),
  accelerated: scheduleVariantSchema.optional(),
  minDaysBeforeTravel: z.number().int().min(0),
  certificateValidFromDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const vaccineSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  displayNameNo: z.string().min(2),
  isLive: z.boolean(),
  schedule: vaccineScheduleSchema,
  contraindications: z.array(z.string()),
  fhiUrl: z.string().url(),
  lastReviewedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const countrySchema = z.object({
  code: z.string().length(2).regex(/^[A-Z]{2}$/),
  nameNo: z.string().min(2),
  riskProfiles: z.array(z.string()),
  malariaRisk: z.enum(["none", "low", "rural_only", "moderate", "high"]),
  malariaZones: z.string().nullable().optional(),
  yellowFeverRequirement: z.enum([
    "none",
    "required_if_from_endemic_country",
    "required",
    "recommended",
  ]),
  yellowFeverRecommended: z.boolean(),
  fhiPageUrl: z.string().url(),
  lastScrapedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export const vaccinesArraySchema = z.array(vaccineSchema);
export const countriesArraySchema = z.array(countrySchema);

export type VaccineSchemaType = z.infer<typeof vaccineSchema>;
export type CountrySchemaType = z.infer<typeof countrySchema>;

export function validateVaccines(data: unknown): VaccineSchemaType[] {
  return vaccinesArraySchema.parse(data);
}

export function validateCountries(data: unknown): CountrySchemaType[] {
  return countriesArraySchema.parse(data);
}
