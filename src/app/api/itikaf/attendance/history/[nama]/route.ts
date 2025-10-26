import { type NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getItikafNight } from "@/lib/attendance-utils"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""

async function readAttendanceSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle["Histori Absensi"]
  return sheet
}

export async function GET(request: NextRequest, { params }: { params: { nama?: string } }) {

  // Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    if (!params) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    const { nama } = await params
    const currentNight = await getItikafNight()
    // Ensure the user can only view their own attendance
    if (session.user.name !== nama) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sheet = await readAttendanceSheet()
    const rows = await sheet.getRows()
    const userRow = rows.find((row) => row.get("Nama Lengkap") === nama);

    if (!userRow) {
      console.log("User not found");
      return null; // Handle case where user is not found
    }
    // Filter rows for the specific user
    const attendanceRecord = {
      "Nama Lengkap": nama,
      ...Object.fromEntries(
        Array.from({ length: currentNight }, (_, i) => {
          const key = `Malam ke ${i + 1}`;
          return [key, userRow.get(key) ? userRow.get(key) || " " : " "]; // Handle missing values
        })
      ),
    };

    return NextResponse.json(attendanceRecord)
  } catch (error) {
    console.error("Error fetching attendance history:", error)
    return NextResponse.json({ error: "Error fetching attendance history" }, { status: 500 })
  }
}

