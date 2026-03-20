import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createConsultation, updateConsultationResult } from "@/lib/audit/firestore-logger";
import { runRecommendationEngine } from "@/lib/engines/recommendation-engine";
import { generateAdvisoryNote } from "@/lib/gemini/fallback-advisor";
import type { PatientData } from "@/lib/types";
import { randomUUID } from "crypto";

const patientDataSchema = z.object({
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  isPregnant: z.boolean(),
  isImmunocompromised: z.boolean(),
  allergies: z.array(z.enum(["egg", "gelatin", "latex", "neomycin", "yeast", "other"])),
  isHivPositive: z.boolean().optional(),
  cd4Count: z.number().optional(),
  destinations: z.array(
    z.object({
      countryCode: z.string().length(2),
      countryName: z.string(),
      isLayover: z.boolean(),
    })
  ).min(1),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accommodationType: z.enum(["hotel", "local"]),
  localContact: z.enum(["minimal", "extensive"]),
  previousVaccinations: z.array(
    z.object({
      vaccineId: z.string(),
      lastDoseYear: z.number().optional(),
      completed: z.boolean().optional(),
    })
  ),
  nurseId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = patientDataSchema.parse(body);

    const id = randomUUID();
    const patientData = validatedData as PatientData;

    await createConsultation(id, patientData, patientData.nurseId);

    const result = runRecommendationEngine(id, patientData, {});
    await updateConsultationResult(id, result);

    // Generate AI advisory note in background – does not block the response
    if (result.requiresDoctorReview && process.env.GEMINI_API_KEY) {
      generateAdvisoryNote(result)
        .then((note) => updateConsultationResult(id, { ...result, aiAdvisoryNote: note }))
        .catch((err) => console.warn("AI advisory note generation failed:", err));
    }

    return NextResponse.json({ id, result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
