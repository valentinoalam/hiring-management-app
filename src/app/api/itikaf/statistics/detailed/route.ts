import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"

const masterSheetId = process.env.ITIKAF_DATASHEET || ""
const onlineformId = "17odpB81bf4J7gCYSaG3N0Pn_6WsYelqeFbz4uMtY16w"
const absensiSheetId = "1Q2_8cZgv36rxchiHtd4NW9qju5lFftz3_UbVsdUM4xI"

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
  const familySheet = doc.sheetsByIndex[1] // Family members
  return { sheet, familySheet }
}

async function readAttendanceSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(absensiSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0]
  return sheet
}

export async function GET() {
  try {
    // Get data from all sheets
    const masterSheet = await readMasterSheet()
    const masterRows = await masterSheet.getRows()

    const { sheet: formSheet, familySheet } = await readOnlineFormSheet()
    const formRows = await formSheet.getRows()
    const familyRows = await familySheet.getRows()

    const attendanceSheet = await readAttendanceSheet()
    const attendanceRows = await attendanceSheet.getRows()

    // Initialize detailed statistics object
    const statistics = {
      participants: {
        total: 0,
        registered: 0,
        withFamily: 0,
        familyMembers: 0,
        gender: {
          male: 0,
          female: 0,
          unknown: 0,
        },
        location: {
          local: {
            persada: 0,
            pengairan: 0,
            total: 0,
          },
          other: 0,
        },
      },
      attendance: {
        total: attendanceRows.length,
        present: 0,
        absent: 0,
        byNight: {} as Record<string, { present: number; absent: number; total: number }>,
      },
    }

    // Process master sheet data for gender statistics
    masterRows.forEach((row) => {
      if (row.get("Nama Lengkap")) {
        statistics.participants.total++

        // Count by gender
        const gender = row.get("Jenis Kelamin")?.toLowerCase()
        if (gender === "laki-laki") {
          statistics.participants.gender.male++
        } else if (gender === "perempuan") {
          statistics.participants.gender.female++
        } else {
          statistics.participants.gender.unknown++
        }
      }
    })

    // Process online form data for location and family statistics
    formRows.forEach((row) => {
      // Check if the row has a name (valid entry)
      if (row.get("nama")) {
        statistics.participants.registered++

        // Check if with family
        const withFamily = row.get("bersama") === "bersama"
        if (withFamily) {
          statistics.participants.withFamily++
        }

        // Get the alamat_ktp field
        const alamatKtp = row.get("alamat_ktp") || ""

        // Check location
        if (alamatKtp.includes("Persada") || alamatKtp.includes("persada")) {
          statistics.participants.location.local.persada++
          statistics.participants.location.local.total++
        } else if (alamatKtp.includes("Pengairan") || alamatKtp.includes("pengairan")) {
          statistics.participants.location.local.pengairan++
          statistics.participants.location.local.total++
        } else {
          statistics.participants.location.other++
        }
      }
    })

    // Count family members
    statistics.participants.familyMembers = familyRows.length

    // Process attendance data
    attendanceRows.forEach((row) => {
      // Get all column headers
      const headers = Object.keys(row._worksheet)

      // Filter for night columns (Malam ke X)
      const nightColumns = headers.filter((header) => header.startsWith("Malam ke"))

      // Initialize night statistics if not already done
      nightColumns.forEach((night) => {
        if (!statistics.attendance.byNight[night]) {
          statistics.attendance.byNight[night] = {
            present: 0,
            absent: 0,
            total: 0,
          }
        }
      })

      // Count attendance for each night
      nightColumns.forEach((night) => {
        const attendance = row.get(night)
        statistics.attendance.byNight[night].total++

        if (attendance === "✓") {
          statistics.attendance.byNight[night].present++
        } else if (attendance === "✕") {
          statistics.attendance.byNight[night].absent++
        }
      })
    })

    // Calculate total present/absent across all nights
    Object.values(statistics.attendance.byNight).forEach((nightStats) => {
      statistics.attendance.present += nightStats.present
      statistics.attendance.absent += nightStats.absent
    })

    return NextResponse.json(statistics)
  } catch (error) {
    console.error("Error fetching detailed statistics:", error)
    return NextResponse.json({ error: "Failed to fetch detailed statistics" }, { status: 500 })
  }
}

