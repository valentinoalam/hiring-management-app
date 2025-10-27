import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    const body = await request.json()
    const { fieldName, fieldType, fieldState, displayOrder } = body

    // Verify recruiter owns the job
    const formField = await prisma.applicationFormField.findUnique({
      where: { id },
      include: {
        job: {
          select: { recruiterId: true },
        },
      },
    })

    if (!formField || formField.job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to update this field" }, { status: 403 })
    }

    const updatedField = await prisma.applicationFormField.update({
      where: { id },
      data: {
        fieldName,
        fieldType,
        fieldState,
        displayOrder,
      },
    })

    return NextResponse.json(updatedField)
  } catch (error) {
    console.error("[v0] Error updating form field:", error)
    return NextResponse.json({ error: "Failed to update form field" }, { status: 500 })
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

    // Verify recruiter owns the job
    const formField = await prisma.applicationFormField.findUnique({
      where: { id },
      include: {
        job: {
          select: { recruiterId: true },
        },
      },
    })

    if (!formField || formField.job.recruiterId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this field" }, { status: 403 })
    }

    await prisma.applicationFormField.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting form field:", error)
    return NextResponse.json({ error: "Failed to delete form field" }, { status: 500 })
  }
}
