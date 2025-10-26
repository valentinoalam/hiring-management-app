import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""
// const onlineformId = "17odpB81bf4J7gCYSaG3N0Pn_6WsYelqeFbz4uMtY16w"
// const absensiSheetId = "1Q2_8cZgv36rxchiHtd4NW9qju5lFftz3_UbVsdUM4xI"

async function readMasterSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)

  await doc.loadInfo()
  // console.log('Success! Document title:', doc.title);
  const sheet = doc.sheetsByTitle["Master Data"]
  await sheet.loadHeaderRow(5)
  return sheet
}

export async function GET() {

  try {
    const sheet = await readMasterSheet()
    const rows = await sheet.getRows()

    // Map rows to participant objects
    const participants = rows
    .filter((row) => row.get("Nama Lengkap"))
    .map((row, index) => ({
      id: index,
      name: row.get("Nama Lengkap"),
      sex: row.get("Jenis Kelamin"),
      bod: row.get("Tanggal Lahir"),
      age: row.get("Usia"),
      phone: row.get("No. HP Pribadi"),
      alamat_ktp: row.get("Alamat KTP"),
      alamat_domisili: row.get("Alamat Domisili"),
      bersama: row.get("I'tikaf Bersama"),
      emergency_contact:{
        name: row.get("Nama Kontak Darurat"),
        phone: row.get("Kontak Darurat"),
      }
    }))
    return NextResponse.json(participants, { status: 200 })
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 })
  }
}
