import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/settings - Get current settings
export async function GET() {
  try {
    // Try to get existing settings
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          localQuota: 100,
          freeQuota: 100,
          womanRatio: "40%",
          registrationOpenDate: new Date(2024, 2, 15), // Fixed month (March)
          registrationClosedDate: new Date(2024, 2, 20), // Fixed month (March)
          itikafStartDate: new Date(),
          attendanceOpenTime: "08:00",
          attendanceCloseTime: "22:00",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      itikafStartDate,
      attendanceOpenTime,
      attendanceCloseTime,
      localQuota,
      freeQuota,
      womanRatio,
      registrationClosedDate,
      registrationOpenDate,
    } = body;

    // Validate required fields
    if (
      !itikafStartDate ||
      !attendanceOpenTime ||
      !attendanceCloseTime ||
      !registrationOpenDate ||
      !registrationClosedDate
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(attendanceOpenTime) || !timeRegex.test(attendanceCloseTime)) {
      return NextResponse.json(
        { error: "Time must be in HH:MM format" },
        { status: 400 }
      );
    }

    // Check if settings exist
    let existingSettings = await prisma.settings.findFirst();

    if (existingSettings) {
      // Update settings
      existingSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          itikafStartDate: new Date(itikafStartDate),
          attendanceOpenTime,
          attendanceCloseTime,
          localQuota: localQuota ?? existingSettings.localQuota,
          freeQuota: freeQuota ?? existingSettings.freeQuota,
          womanRatio: womanRatio ?? existingSettings.womanRatio,
          registrationOpenDate: new Date(registrationOpenDate),
          registrationClosedDate: new Date(registrationClosedDate),
        },
      });
    } else {
      // Create new settings
      existingSettings = await prisma.settings.create({
        data: {
          localQuota,
          freeQuota,
          womanRatio,
          registrationOpenDate: new Date(registrationOpenDate),
          registrationClosedDate: new Date(registrationClosedDate),
          itikafStartDate: new Date(itikafStartDate),
          attendanceOpenTime,
          attendanceCloseTime,
        },
      });
    }

    return NextResponse.json(existingSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
