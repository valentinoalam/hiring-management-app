// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { formResponse, profileUpdates, userInfoUpdates } = body;

    // Get user's profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user already applied to this job
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: params.jobId,
          applicantId: userProfile.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 409 }
      );
    }

    // Start a transaction to handle all operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update profile
      const updatedProfile = await tx.profile.update({
        where: { id: userProfile.id },
        data: profileUpdates,
      });

      // 2. Update or create user info records
      for (const userInfoUpdate of userInfoUpdates) {
        if (userInfoUpdate.id) {
          // Update existing record
          await tx.otherUserInfo.update({
            where: { id: userInfoUpdate.id },
            data: { infoFieldAnswer: userInfoUpdate.infoFieldAnswer },
          });
        } else {
          // Create new record
          await tx.otherUserInfo.create({
            data: {
              profileId: userProfile.id,
              fieldId: userInfoUpdate.fieldId,
              infoFieldAnswer: userInfoUpdate.infoFieldAnswer,
            },
          });
        }
      }

      // 3. Create application
      const application = await tx.application.create({
        data: {
          jobId: params.jobId,
          applicantId: userProfile.id,
          formResponse: formResponse,
          coverLetter: formResponse.cover_letter || null,
          status: 'PENDING',
          source: 'direct',
        },
        include: {
          job: {
            select: {
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // 4. Increment applications count on job
      await tx.job.update({
        where: { id: params.jobId },
        data: {
          applicationsCount: {
            increment: 1,
          },
        },
      });

      return {
        application,
        profile: updatedProfile,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting job application:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}