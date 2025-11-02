// app/api/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get companies where user is owner or member
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        _count: {
          select: {
            jobs: {
              where: { status: "active" }
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[COMPANIES] Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}