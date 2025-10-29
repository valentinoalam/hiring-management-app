// route.ts (Menggunakan Auth.js/Next.js Auth dan Prisma)

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Asumsi: Import fungsi 'auth' yang disediakan oleh Next.js Auth (Auth.js)
import { auth } from "@/auth" // Ganti dengan path yang benar ke konfigurasi Auth Anda

// --- FUNGSI GET ---
export async function GET(request: NextRequest) {
  try {
    // 1. Cek apakah pengguna dikenali
    const session = await auth()
    const user = session?.user

    // 2. Query Parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const isActive = searchParams.get("isActive") === "true"

    // 3. Bangun Objek 'where' Prisma
    const where: Record<string, unknown> = {}

    if (isActive) {
      where.status = "active" // Jika "isActive", hanya tampilkan yang berstatus 'active'
    } else if (user && user.id) {
      // Jika bukan "isActive" (mungkin untuk rekruter melihat lowongan mereka), filter berdasarkan ID pengguna
      where.recruiterId = user.id
    }

    if (status) {
      // Menimpa status jika parameter 'status' spesifik diberikan
      where.status = status
    }

    // 4. Akses Data: Gunakan Prisma
    const jobs = await prisma.job.findMany({
      where,
      include: {
        author: {
          select: {
            email: true,
            fullName: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error("[v0] Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// --- FUNGSI POST ---
export async function POST(request: NextRequest) {
  try {
    // 1. Otorisasi: Gunakan Auth.js/Next.js Auth untuk mendapatkan sesi pengguna
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) { // Pastikan user ada dan memiliki ID
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Validasi Input
    const body = await request.json()
    const { title, description, department, location, salaryMin, salaryMax, salaryCurrency, employmentType, status } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // 3. Akses Data: Gunakan Prisma untuk membuat data
    const job = await prisma.job.create({
      data: {
        title,
        description,
        department,
        location,
        salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null,
        salaryCurrency,
        employmentType,
        status: status || "draft",
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        // Gunakan ID pengguna dari Auth.js/Next.js Auth
        authorId: user.id,
        recruiterId: user.id,
      },
      include: {
        author: {
          select: {
            email: true,
            fullName: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating job:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}