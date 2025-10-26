/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { getGoogleClient } from "@/lib/gClient"
const onlineformId = "17odpB81bf4J7gCYSaG3N0Pn_6WsYelqeFbz4uMtY16w"

function flattenObject(obj: any, parentKey = "", sep = ".") {
  const flattened: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const propName = parentKey ? `${key}` : key

      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], propName, sep))
      } else {
        flattened[propName] = obj[key]
      }
    }
  }

  return flattened
}

function calculateAge(year: number, month: number, day: number) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getUTCMonth() + 1 // Months are zero-based in JavaScript
  const currentDay = currentDate.getUTCDate()

  const age = currentYear - year
  if (currentMonth > month) {
    return age
  } else if (currentMonth === month && currentDay >= day) {
    return age
  } else {
    return age - 1
  }
}

async function readMySheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(onlineformId, client)

  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0] // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  const sheet2 = doc.sheetsByIndex[1]
  return { sheet, sheet2 }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const {
      nama,
      jenisKelamin,
      tanggalLahir,
      noHP,
      denganKeluarga,
      alamatKTP,
      equalKTP,
      alamatDom,
      anggota: keluarga,
      kontakDarurat,
      rencana_itikaf,
    } = payload

    const dateOfBirth = new Date(tanggalLahir)
    const birthYear = dateOfBirth.getFullYear()
    const birthMoon = dateOfBirth.getMonth()
    const birthDate = dateOfBirth.getDate()
    const usia = calculateAge(birthYear, birthMoon, birthDate)

    const KTPaddress =
      alamatKTP.komplek === "Lainnya"
        ? alamatKTP.komplek_lainnya +
          " " +
          alamatKTP.jalan +
          ", " +
          alamatKTP.kelurahan +
          ", " +
          alamatKTP.kecamatan +
          ", " +
          alamatKTP.kabupaten +
          ", " +
          alamatKTP.propinsi +
          " " +
          alamatKTP.kodepos
        : alamatKTP.komplek + " " + alamatKTP.jalan + " Jakasampurna, Bekasi Barat, Kota Bekasi, Jawa Barat 17145"

    const plan = Object.keys(rencana_itikaf).reduce((acc: Record<string, string>, key) => {
      const newKey = "h-" + rencana_itikaf[key]
      acc[newKey] = "✔"
      return acc
    }, {})

    const { nama: namakontakDarurat, phone1: nokontakDarurat } = kontakDarurat

    const newRow = {
      nama,
      "jenis-kelamin": jenisKelamin,
      "tanggal-lahir": tanggalLahir,
      usia,
      "no-hp_pribadi": noHP.startsWith("0") ? noHP : "0" + noHP,
      alamat_ktp: KTPaddress,
      alamat_domisili: equalKTP === true ? "sama dengan ktp" : alamatDom,
      bersama: denganKeluarga === true ? "bersama" : "sendiri",
      "nama_kontak-darurat": namakontakDarurat,
      "no_kontak-darurat": nokontakDarurat,
      plan,
    }

    const { sheet, sheet2 } = await readMySheet()
    await sheet.addRow(flattenObject(newRow))
    const addedRow = await sheet.addRow(flattenObject(newRow))
    const rowIndex = addedRow.rowNumber - 6 // Adjust based on your header row
    if (denganKeluarga && keluarga) {
      await Promise.all(
        keluarga.map(async (element: any) => {
          element.pendaftar = newRow.nama
          try {
            await sheet2.addRow(element)
          } catch (error) {
            console.error("Error adding keluarga element:", error)
          }
        }),
      )
    }
    // Create user object for JWT and session
    const user = {
      id: rowIndex.toString(),
      name: nama,
      sex: jenisKelamin,
      wa: noHP
      // email: `${nama.replace(/\s+/g, "").toLowerCase()}@example.com`, // Required by NextAuth
    }

    return NextResponse.json(
      {
        message: "Data received successfully",
        user,
        success: true,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    console.error("Error processing data:", error)
    return NextResponse.json({ error: "Error processing registration" }, { status: 500 })
  }
}

