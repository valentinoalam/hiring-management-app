import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  try {
    
    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const role = searchParams.get("role") // "recruiter" or "job_seeker"

    const where: Record<string, unknown> = {}

    if (role === "recruiter" && jobId) {
      where.job = {
        id: jobId,
        recruiterId: user.id,
      }
    } else if (role === "job_seeker") {
      where.applicantId = user.id
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            author: {
              select: {
                fullName: true,
                profile: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        applicant: {
          include: {
            userInfo: true
          }
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
    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: user.id,
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
        applicantId: user.id,
        status: "PENDING",
        formResponse: {},
      },
      include: {
        job: true,
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating application:", error)
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 })
  }
}
