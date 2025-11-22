import "server-only";
import { NextRequest, NextResponse } from "next/server.js";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Verify job ownership
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        authorId: user.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Get application statistics
    const applications = await prisma.application.findMany({
      where: { jobId },
      select: { status: true },
    });

    // Calculate stats
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent applications (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentApplications = await prisma.application.count({
      where: {
        jobId,
        appliedAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Get applications by source
    const applicationsBySource = await prisma.application.groupBy({
      by: ['source'],
      where: { jobId },
      _count: true,
    });

    const analytics = {
      totalApplications: applications.length,
      statusBreakdown: statusCounts,
      recentApplications,
      applicationsBySource: applicationsBySource.reduce((acc, item) => {
        acc[item.source || 'unknown'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      // Add more metrics as needed
      averageResponseTime: null, // Could calculate based on status updates
      conversionRate: null, // Applications to interviews/hires
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[ANALYTICS] Error fetching job analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}