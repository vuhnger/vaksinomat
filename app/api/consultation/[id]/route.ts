import { NextRequest, NextResponse } from "next/server";
import { getConsultation } from "@/lib/audit/firestore-logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultation = await getConsultation(params.id);

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(consultation);
  } catch (error) {
    console.error("Failed to get consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
