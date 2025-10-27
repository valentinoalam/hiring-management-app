import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Fetch role-specific profile
    let roleProfile = null
    if (profile.role === "recruiter") {
      roleProfile = await prisma.recruiterProfile.findUnique({
        where: { id: user.id },
      })
    } else {
      roleProfile = await prisma.jobSeekerProfile.findUnique({
        where: { id: user.id },
      })
    }

    return NextResponse.json(
      {
        user,
        profile,
        roleProfile,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
