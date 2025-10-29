import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            fullName: true,
            email: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
        applicationFormFields: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { candidates: true },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("[v0] Error fetching job:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    

    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { recruiterId: true },
    })

    if (!job || job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to update this job" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, department, location, salaryMin, salaryMax, salaryCurrency, employmentType, status } = body

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        department,
        location,
        salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null,
        salaryCurrency,
        employmentType,
        status,
      },
      include: {
        author: {
          select: {
            fullName: true,
            email: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("[v0] Error updating job:", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { recruiterId: true },
    })

    if (!job || job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this job" }, { status: 403 })
    }

    await prisma.job.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting job:", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}
