import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConsultation, updateConsultationResult } from "@/lib/audit/firestore-logger";
import { runRecommendationEngine } from "@/lib/engines/recommendation-engine";
import { generateAdvisoryNote } from "@/lib/gemini/fallback-advisor";

const dynamicAnswersSchema = z.record(z.unknown()).optional();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const dynamicAnswers = dynamicAnswersSchema.parse(body.dynamicAnswers ?? {});

    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    const result = runRecommendationEngine(
      params.id,
      consultation.patientData,
      dynamicAnswers ?? {}
    );

    await updateConsultationResult(params.id, result);

    // Generate AI advisory note in background – does not block the response
    if (result.requiresDoctorReview && process.env.GEMINI_API_KEY) {
      generateAdvisoryNote(result)
        .then((note) => updateConsultationResult(params.id, { ...result, aiAdvisoryNote: note }))
        .catch((err) => console.warn("AI advisory note generation failed:", err));
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to run recommendation engine:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
