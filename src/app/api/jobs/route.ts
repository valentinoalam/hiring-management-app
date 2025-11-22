// app/api/jobs/route.ts (PUBLIC)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformJobData } from "@/types/job.js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const location = searchParams.get("location");
    const employmentType = searchParams.get("employmentType");
    const department = searchParams.get("department");
    const companyId = searchParams.get("companyId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause for active jobs only
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (department) {
      where.department = { contains: department, mode: "insensitive" };
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true,
              description: true,
            },
          },
          _count: {
            select: { candidates: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Transform the data
    const transformedJobs = jobs.map(job => transformJobData(job));

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[JOBS_PUBLIC] Error fetching public jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}