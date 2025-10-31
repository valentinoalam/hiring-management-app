import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { auth } from "@/auth" 
import { transformJobData } from "@/types/job"

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
    const companyId = searchParams.get("companyId")

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

    if (companyId) {
      // Filter berdasarkan companyId jika diberikan
      where.companyId = companyId
    }

    
    // 4. Akses Data: Gunakan Prisma
    const jobs = await prisma.job.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            description: true,
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform the data before sending response
    const transformedJobs = jobs.map(job => transformJobData(job));

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error("[v0] Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// --- FUNGSI POST ---
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) { // Pastikan user ada dan memiliki ID
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      department, 
      location, 
      salaryMin, 
      salaryMax, 
      salaryCurrency, 
      employmentType, 
      status,
      companyId 
    } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify that the company exists and user has access to it
    const company = await prisma.company.findFirst({
      where: {
        id: companyId
      }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        department,
        location,
        salaryMin: Number.parseFloat(salaryMin),
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : salaryMin,
        salaryCurrency: salaryCurrency || "USD",
        employmentType,
        status: status || "draft",
        slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        // Gunakan ID pengguna dari Auth.js/Next.js Auth
        authorId: user.id,
        recruiterId: user.id,
        companyId: companyId,
        sections: {},
        numberOfCandidates: 1,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            description: true,
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
    })

    // Transform the created job data
    const transformedJob = transformJobData(job);

    return NextResponse.json(transformedJob, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating job:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

// --- FUNGSI PUT (Update Job) ---
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      title, 
      description, 
      department, 
      location, 
      salaryMin, 
      salaryMax, 
      salaryCurrency, 
      employmentType, 
      status,
      companyId 
    } = body

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if job exists and user owns it
    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        recruiterId: user.id
      }
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 })
    }

    // If companyId is being updated, verify the new company
    if (companyId && companyId !== existingJob.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
        }
      })

      if (!company) {
        return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(location !== undefined && { location }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null }),
        ...(salaryCurrency && { salaryCurrency }),
        ...(employmentType !== undefined && { employmentType }),
        ...(status && { status }),
        ...(companyId && { companyId }),
        ...(title && { 
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            description: true,
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
    })

    // Transform the updated job data
    const transformedJob = transformJobData(updatedJob);

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error("[v0] Error updating job:", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}