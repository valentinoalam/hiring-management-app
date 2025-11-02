// app/api/jobs/[id]/applications/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const { appId: id } = await params

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        applicant: {
          include: {
            userInfo: true
          }
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("[v0] Error fetching application:", error)
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 })
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

    const body = await request.json()
    const { status } = body

    // Verify recruiter owns the job
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: { recruiterId: true },
        },
      },
    })

    if (!application || application.job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to update this application" }, { status: 403 })
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        job: true,
        applicant: {
          include: {
            userInfo: true
          }
        },
      },
    })

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error("[v0] Error updating application:", error)
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 })
  }
}
