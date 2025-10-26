import { NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"
import { isAttendanceAllowed, getItikafNight } from "@/lib/attendance-utils"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""

async function readAttendanceSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle["Histori Absensi"]
  return sheet
}

// Function to calculate the current itikaf night based on start date
async function getCurrentItikafNight() {
  // Add 1 to get the night number (1-indexed)
  const nightNumber =  await getItikafNight()

  // Ensure it's within the 10-night range
  if (nightNumber < 1 || nightNumber > 10) {
    throw new Error(`Current night ${nightNumber} is outside the 10-night itikaf period`)
  }

  return `Malam ke ${nightNumber}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { nama?: string } }
) {
  try {
    if (!params) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    // Check if attendance is allowed at current time
    const allowed = await isAttendanceAllowed()
    if (!allowed) {
      return NextResponse.json({ error: "Daftarulang sedang ditutup" }, { status: 403 })
    }

    const { nama } = await params
    const { check } = await request.json()

    const sheet = await readAttendanceSheet()
    const rows = await sheet.getRows()

    const checkMark = check ? "✔️" : "❌"

    // Get current itikaf day from settings
    const malamIni = await getCurrentItikafNight()

    // Find the row with the same name as the user's login
    const userRow = rows.find((row) => row.get("Nama Lengkap") === nama)

    if (userRow) {
      // Update the attendance status for the found row
      userRow.set(malamIni, checkMark)
      await userRow.save()

      return NextResponse.json({
        success: true,
        date: new Date().toISOString(),
        participant: nama,
        status: check ? 'present' : 'absent',
        updatedField: malamIni
      }, { status: 200 },)
    } else {
      console.log(`User ${nama} not found`)
      return NextResponse.json({ message: `User ${nama} not found` }, { status: 400 })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error updating attendance" }, { status: 500 })
  }
}

