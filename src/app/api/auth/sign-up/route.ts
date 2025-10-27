import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, fullName } = await request.json()

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["recruiter", "job_seeker"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
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

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-up-success`,
        data: { role },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create profile in database
    const profile = await prisma.profile.create({
      data: {
        id: authData.user.id,
        email,
        role: role as "recruiter" | "job_seeker",
      },
    })

    // Create role-specific profile
    if (role === "recruiter") {
      await prisma.recruiterProfile.create({
        data: {
          id: authData.user.id,
          full_name: fullName || null,
        },
      })
    } else {
      await prisma.jobSeekerProfile.create({
        data: {
          id: authData.user.id,
          full_name: fullName || null,
        },
      })
    }

    return NextResponse.json(
      {
        message: "Sign up successful. Please check your email to confirm.",
        user: authData.user,
        profile,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
