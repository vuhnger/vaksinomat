import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPendingReviews, updateConsultationStatus } from "@/lib/audit/firestore-logger";

export async function GET() {
  try {
    const pending = await getPendingReviews();
    return NextResponse.json(pending);
  } catch (error) {
    console.error("Failed to get pending reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const reviewActionSchema = z.object({
  consultationId: z.string(),
  action: z.enum(["approve", "reject"]),
  doctorId: z.string(),
  doctorNote: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, action, doctorId, doctorNote } =
      reviewActionSchema.parse(body);

    await updateConsultationStatus(
      consultationId,
      action === "approve" ? "approved" : "rejected",
      doctorId,
      doctorNote
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update consultation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
