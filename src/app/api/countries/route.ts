import { NextResponse } from "next/server.js";

import countriesData from '@/data/countries.json';;

export async function GET() {
  try {
    const data = countriesData.map((c) => ({
      code: c.alpha2Code,                 // or alpha3Code if preferred
      name: c.name,
      dial: c.callingCodes?.[0] ?? "",
      flagUrl: c.flags?.svg || c.flags?.png || "",
    }));
    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load file" },
      { status: 500 }
    );
  }
}
