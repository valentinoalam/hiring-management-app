import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        recruiter: {
          select: {
            email: true,
            recruiterProfile: {
              select: {
                companyName: true,
                fullName: true,
              },
            },
          },
        },
        applicationFormFields: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: { applications: true },
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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const { title, description, department, location, salaryMin, salaryMax, employmentType, status } = body

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        department,
        location,
        salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null,
        employmentType,
        status,
      },
      include: {
        recruiter: {
          select: {
            email: true,
            recruiterProfile: {
              select: {
                companyName: true,
                fullName: true,
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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

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
