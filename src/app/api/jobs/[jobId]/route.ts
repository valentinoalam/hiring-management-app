// app/api/jobs/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId: id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
        applicationFormFields: {
          where: {
            fieldState: { in: ["mandatory", "optional"] } // Only include enabled fields
          },
          include: {
            field: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
    })


    if (!job) {
      return NextResponse.json(
        { error: "Job not found or no longer available" }, 
        { status: 404 }
      );
    }
    // Transform the response to make it easier for the frontend
    const {applicationFormFields,...jobData} = job
    const formFields = applicationFormFields.map(appField => ({
      id: appField.field.id,
      key: appField.field.key,
      label: appField.field.label,
      fieldType: appField.field.fieldType,
      fieldState: appField.fieldState, // "mandatory" or "optional"
      options: appField.field.options, // For select fields
      sortOrder: appField.sortOrder,
    }));
    const response = {
      jobData,
      formFields,
    };
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error fetching job:", error)
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId:id } = await params
    

    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or no longer available" }, 
        { status: 404 }
      );
    }

    if (job.authorId !== user.id) {
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
        salaryMin: Number.parseFloat(salaryMin),
        salaryMax: salaryMax ? Number.parseFloat(salaryMax) : salaryMin,
        salaryCurrency,
        employmentType,
        status,
      },
      include: {
        author: {
          select: {
            name: true,
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId:id } = await params
    
    const session = await auth()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!job || job.authorId !== user.id) {
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
