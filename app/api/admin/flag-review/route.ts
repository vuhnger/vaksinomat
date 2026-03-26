import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function PATCH(_request: NextRequest) {
  return NextResponse.json(
    { error: "Doctor review is unavailable until persistence is enabled" },
    { status: 410 }
  );
}
