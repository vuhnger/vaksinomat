import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: `Consultation ${params.id} is not persisted in this deployment`,
    },
    { status: 410 }
  );
}
