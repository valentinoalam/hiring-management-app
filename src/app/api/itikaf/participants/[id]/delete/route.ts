import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""

async function readMasterSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle["Master Data"]
  await sheet.loadHeaderRow(5)
  return sheet
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const sheet = await readMasterSheet()
    const rows = await sheet.getRows()

    // Find the row with the matching ID
    const rowIndex = Number.parseInt(id, 10)
    if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    // Delete the row
    await rows[rowIndex].delete()

    return NextResponse.json({ message: "Participant deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error deleting participant" }, { status: 500 })
  }
}

