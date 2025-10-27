import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const isActive = searchParams.get("isActive") === "true"

    const where: any = {}

    if (isActive) {
      where.status = "active"
    } else {
      where.recruiterId = user.id
    }

    if (status) {
      where.status = status
    }

    const jobs = await prisma.job.findMany({
      where,
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
        _count: {
          select: { applications: true },
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

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { title, description, department, location, salaryMin, salaryMax, employmentType, status } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        department,
        location,
        salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null,
        employmentType,
        status: status || "draft",
        recruiterId: user.id,
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

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating job:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}
