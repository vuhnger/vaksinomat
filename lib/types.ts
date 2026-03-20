// Core domain types for Vaksinomat

export type AllergyType =
  | "egg"
  | "gelatin"
  | "latex"
  | "neomycin"
  | "yeast"
  | "other";

export type AccommodationType = "hotel" | "local";
export type LocalContactType = "minimal" | "extensive";
export type MalariaRisk = "none" | "low" | "rural_only" | "moderate" | "high";
export type YellowFeverRequirement =
  | "none"
  | "required_if_from_endemic_country"
  | "required"
  | "recommended";

export interface PreviousVaccination {
  vaccineId: string;
  lastDoseYear?: number;
  completed?: boolean;
}

export interface Destination {
  countryCode: string;
  countryName: string;
  isLayover: boolean;
}

export interface PatientData {
  birthYear: number;
  isPregnant: boolean;
  isImmunocompromised: boolean;
  allergies: AllergyType[];
  isHivPositive?: boolean;
  cd4Count?: number;
  destinations: Destination[];
  departureDate: string; // ISO date string
  returnDate: string; // ISO date string
  accommodationType: AccommodationType;
  localContact: LocalContactType;
  previousVaccinations: PreviousVaccination[];
  nurseId?: string;
}

export interface VaccineDose {
  doseNumber: number;
  label: string;
  dayOffset: number;
  isBooster?: boolean;
}

export interface VaccineScheduleVariant {
  doses: VaccineDose[];
  minDaysBeforeTravel: number;
  notes?: string;
}

export interface VaccineSchedule {
  doses?: VaccineDose[];
  standard?: VaccineScheduleVariant;
  accelerated?: VaccineScheduleVariant;
  minDaysBeforeTravel: number;
  certificateValidFromDays?: number;
  notes?: string;
}

export interface Vaccine {
  id: string;
  displayNameNo: string;
  isLive: boolean;
  schedule: VaccineSchedule;
  contraindications: string[];
  fhiUrl: string;
  lastReviewedDate: string;
}

export interface MalariaProphylaxisSchedule {
  startDaysBeforeTravel: number;
  stopDaysAfterReturn: number;
  notes: string;
}

export interface MalariaProphylaxis {
  id: string;
  displayNameNo: string;
  type: "prophylaxis";
  schedule: MalariaProphylaxisSchedule;
  contraindications: string[];
  fhiUrl: string;
}

export interface Country {
  code: string;
  nameNo: string;
  riskProfiles: string[];
  malariaRisk: MalariaRisk;
  malariaZones?: string;
  yellowFeverRequirement: YellowFeverRequirement;
  yellowFeverRecommended: boolean;
  fhiPageUrl: string;
  lastScrapedDate: string;
  dataVersion: string;
}

export interface DatedDose {
  doseNumber: number;
  label: string;
  targetDate: string; // ISO date string
  daysBeforeTravel: number;
  feasible: boolean;
  note?: string;
}

export type RecommendationLevel =
  | "required"
  | "strongly_recommended"
  | "recommended"
  | "consider"
  | "not_recommended";

export interface VaccineRecommendation {
  vaccineId: string;
  displayNameNo: string;
  level: RecommendationLevel;
  reason: string;
  datedDoses: DatedDose[];
  scheduleVariant?: "standard" | "accelerated";
  certificateValidFrom?: string; // ISO date string
  feasible: boolean;
  contraindications: ContraindIndicationResult[];
}

export interface ContraindIndicationResult {
  condition: string;
  severity: "absolute" | "relative";
  affectedVaccineIds: string[];
  description: string;
}

export interface MalariaRecommendation {
  prophylaxisId: string;
  displayNameNo: string;
  startDate: string; // ISO date string
  stopDate: string; // ISO date string
  reason: string;
}

export type InternkontrollFlag =
  | "pregnant_live_vaccine"
  | "immunocompromised_live_vaccine"
  | "egg_allergy_yellow_fever"
  | "hiv_low_cd4"
  | "absolute_contraindication";

export interface RecommendationResult {
  consultationId: string;
  patientData: PatientData;
  recommendations: VaccineRecommendation[];
  malariaRecommendation?: MalariaRecommendation;
  contraindications: ContraindIndicationResult[];
  internkontrollFlags: InternkontrollFlag[];
  requiresDoctorReview: boolean;
  dynamicQuestions: DynamicQuestion[];
  generatedAt: string; // ISO datetime string
  aiAdvisoryNote?: string;
}

export interface DynamicQuestion {
  id: string;
  triggeredByVaccineId: string;
  question: string;
  type: "boolean" | "number" | "select";
  options?: string[];
  answer?: string | boolean | number;
}

// Consultation (Firestore document)
export type ConsultationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export interface Consultation {
  id: string;
  patientData: PatientData;
  result?: RecommendationResult;
  status: ConsultationStatus;
  requiresDoctorReview: boolean;
  nurseId?: string;
  doctorId?: string;
  doctorNote?: string;
  createdAt: string;
  updatedAt: string;
}
