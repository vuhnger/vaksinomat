import { NextRequest, NextResponse } from "next/server";
import { searchCountries, getCountries } from "@/lib/data/loader";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  const countries = query ? searchCountries(query) : getCountries();

  // Return only essential fields for the dropdown
  const result = countries.map((c) => ({
    code: c.code,
    nameNo: c.nameNo,
    malariaRisk: c.malariaRisk,
    yellowFeverRequirement: c.yellowFeverRequirement,
  }));

  return NextResponse.json(result);
}
