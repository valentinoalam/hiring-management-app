import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""
const onlineformId = "17odpB81bf4J7gCYSaG3N0Pn_6WsYelqeFbz4uMtY16w"

async function readMasterSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle["Master Data"]
  await sheet.loadHeaderRow(5)
  return sheet
}

async function readOnlineFormSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(onlineformId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0] // Main form responses
  return sheet
}

export async function GET() {
  try {
    // Get data from master sheet
    const masterSheet = await readMasterSheet()
    const masterRows = await masterSheet.getRows()

    // Get data from online form sheet
    const formSheet = await readOnlineFormSheet()
    const formRows = await formSheet.getRows()

    // Create CSV data
    let csvContent = "Name,Gender,Phone,Address,Registration Type\n"

    // Process master sheet data
    masterRows.forEach((row) => {
      if (row.get("Nama Lengkap")) {
        const name = row.get("Nama Lengkap") || ""
        const gender = row.get("Jenis Kelamin") || ""

        // Find matching form data
        const formData = formRows.find((formRow) => formRow.get("nama") === name)
        const phone = formData ? formData.get("no-hp_pribadi") || "" : ""
        const address = formData ? formData.get("alamat_ktp") || "" : ""

        // Determine registration type
        let regType = "Unknown"
        if (address) {
          if (address.includes("Persada") || address.includes("persada")) {
            regType = "Local - Persada"
          } else if (address.includes("Pengairan") || address.includes("pengairan")) {
            regType = "Local - Pengairan"
          } else {
            regType = "Other Location"
          }
        }

        // Escape CSV fields
        const escapeCsv = (field: string) => {
          if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return `"${field.replace(/"/g, '""')}"`
          }
          return field
        }

        csvContent += `${escapeCsv(name)},${escapeCsv(gender)},${escapeCsv(phone)},${escapeCsv(address)},${escapeCsv(regType)}\n`
      }
    })

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=participant_statistics.csv",
      },
    })
  } catch (error) {
    console.error("Error exporting statistics:", error)
    return NextResponse.json({ error: "Failed to export statistics" }, { status: 500 })
  }
}

