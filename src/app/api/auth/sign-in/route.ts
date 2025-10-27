import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

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

    // Sign in with Supabase Auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
    }

    // Fetch user profile
    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Fetch role-specific profile
    let roleProfile = null
    if (profile.role === "recruiter") {
      roleProfile = await prisma.recruiterProfile.findUnique({
        where: { id: data.user.id },
      })
    } else {
      roleProfile = await prisma.jobSeekerProfile.findUnique({
        where: { id: data.user.id },
      })
    }

    return NextResponse.json(
      {
        user: data.user,
        profile,
        roleProfile,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
