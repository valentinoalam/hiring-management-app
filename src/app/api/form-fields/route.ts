import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const formFields = await prisma.applicationFormField.findMany({
      where: { jobId },
      orderBy: { displayOrder: "asc" },
    })

    return NextResponse.json(formFields)
  } catch (error) {
    console.error("[v0] Error fetching form fields:", error)
    return NextResponse.json({ error: "Failed to fetch form fields" }, { status: 500 })
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
    const { jobId, fieldName, fieldType, fieldState, displayOrder } = body

    if (!jobId || !fieldName) {
      return NextResponse.json({ error: "Job ID and field name are required" }, { status: 400 })
    }

    // Verify recruiter owns the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { recruiterId: true },
    })

    if (!job || job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to add fields to this job" }, { status: 403 })
    }

    const formField = await prisma.applicationFormField.create({
      data: {
        jobId,
        fieldName,
        fieldType: fieldType || "text",
        fieldState: fieldState || "optional",
        displayOrder: displayOrder || 0,
      },
    })

    return NextResponse.json(formField, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating form field:", error)
    return NextResponse.json({ error: "Failed to create form field" }, { status: 500 })
  }
}
