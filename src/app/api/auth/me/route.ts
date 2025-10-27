import { NextResponse } from "next/server"
import getServerSession, { type Session } from "next-auth"
import { authOptions } from "../[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as unknown as Session

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user with profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role
        },
        profile: user.profile,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
