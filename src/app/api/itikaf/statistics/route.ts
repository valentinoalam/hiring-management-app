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

export async function GET() {
  try {
    // Get data from master sheet
    const masterSheet = await readMasterSheet()
    const masterRows = await masterSheet.getRows()

    // Initialize statistics object
    const statistics = {
      total: 0,
      gender: {
        male: 0,
        female: 0,
      },
      location: {
        local: 0, // Persada and Pengairan
        other: 0, // Lainnya
      },
      registeredLocalMale: 0,
      registeredLocalFemale: 0,
      registeredOutsideMale: 0,
      registeredOutsideFemale: 0
    }

    // Process master sheet data for gender statistics
    masterRows.forEach((row) => {
      if (row.get("Nama Lengkap")) {
        statistics.total++;
    
        // Count by gender
        const gender = row.get("Jenis Kelamin")?.toLowerCase();
        const isMale = gender === "laki-laki";
        const isFemale = gender === "perempuan";
    
        if (isMale) {
          statistics.gender.male++;
        } else if (isFemale) {
          statistics.gender.female++;
        }
    
        // Get the alamat_ktp and alamat_domisili fields
        const alamatKtp = row.get("Alamat KTP") || "";
        const alamatDom = row.get("Alamat Domisili") || "";
    
        // Check if it's local (contains specific keywords)
        const isLocal =
          /persada kemala|pk|gjs|jatiluhur|jakasampurna|pengairan/i.test(
            alamatKtp
          ) ||
          /persada kemala|pk|gjs|jatiluhur|jakasampurna|pengairan/i.test(
            alamatDom
          );
    
        if (isLocal) {
          statistics.location.local++;
          if (isMale) {
            statistics.registeredLocalMale = (statistics.registeredLocalMale || 0) + 1;
          } else if (isFemale) {
            statistics.registeredLocalFemale = (statistics.registeredLocalFemale || 0) + 1;
          }
        } else {
          statistics.location.other++;
          if (isMale) {
            statistics.registeredOutsideMale = (statistics.registeredOutsideMale || 0) + 1;
          } else if (isFemale) {
            statistics.registeredOutsideFemale = (statistics.registeredOutsideFemale || 0) + 1;
          }
        }
      }
    });
    

    return NextResponse.json(statistics)
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}

