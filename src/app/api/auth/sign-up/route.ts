import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import type { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, fullName } = await request.json()

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["RECRUITER", "APPLICANT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: role as UserRole,
        profile: {
          create: {}
        }
      },
      include: {
        profile: true
      }
    })

    return NextResponse.json(
      {
        message: "Sign up successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role
        },
        profile: user.profile,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
