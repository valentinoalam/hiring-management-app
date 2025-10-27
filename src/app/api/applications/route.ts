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
    const jobId = searchParams.get("jobId")
    const role = searchParams.get("role") // "recruiter" or "job_seeker"

    const where: any = {}

    if (role === "recruiter" && jobId) {
      where.job = {
        id: jobId,
        recruiterId: user.id,
      }
    } else if (role === "job_seeker") {
      where.jobSeekerId = user.id
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            recruiter: {
              select: {
                recruiterProfile: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        jobSeeker: {
          select: {
            email: true,
            jobSeekerProfile: {
              select: {
                fullName: true,
                phone: true,
                location: true,
              },
            },
          },
        },
        applicationResponses: {
          include: {
            field: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("[v0] Error fetching applications:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
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
    const { jobId, responses } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId: user.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied to this job" }, { status: 400 })
    }

    // Create application with responses
    const application = await prisma.application.create({
      data: {
        jobId,
        jobSeekerId: user.id,
        status: "pending",
        applicationResponses: {
          create: responses.map((response: any) => ({
            fieldId: response.fieldId,
            responseValue: response.responseValue,
          })),
        },
      },
      include: {
        job: true,
        applicationResponses: {
          include: {
            field: true,
          },
        },
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating application:", error)
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 })
  }
}
