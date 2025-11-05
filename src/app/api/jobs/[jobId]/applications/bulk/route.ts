// app/api/jobs/[id]/applications/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const body = await request.json();

    const { applicationIds, status, note } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || !status) {
      return NextResponse.json(
        { error: "Application IDs and status are required" },
        { status: 400 }
      );
    }

    // Verify job ownership and that applications belong to this job
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

    // Verify all applications belong to this job
    const applicationsCount = await prisma.application.count({
      where: {
        id: { in: applicationIds },
        jobId,
      },
    });

    if (applicationsCount !== applicationIds.length) {
      return NextResponse.json(
        { error: "Some applications not found or access denied" },
        { status: 403 }
      );
    }

    // Bulk update applications
    const updatedApplications = await prisma.$transaction(
      applicationIds.map(applicationId =>
        prisma.application.update({
          where: { id: applicationId },
          data: {
            status,
            ...(note && {
              notes: {
                create: {
                  content: note,
                  authorId: user.id,
                  isInternal: true,
                },
              },
            }),
            statusUpdatedAt: new Date(),
          },
          include: {
            applicant: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      updated: updatedApplications.length,
      applications: updatedApplications,
    });
  } catch (error) {
    console.error("[BULK_UPDATE] Error bulk updating applications:", error);
    return NextResponse.json(
      { error: "Failed to update applications" },
      { status: 500 }
    );
  }
}