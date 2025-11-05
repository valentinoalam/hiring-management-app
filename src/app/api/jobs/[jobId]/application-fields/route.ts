// app/api/jobs/[jobId]/application-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
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

    const applicationFormFields = await prisma.appFormField.findMany({
      where: {
        jobId: params.jobId,
      },
      include: {
        field: {
          select: {
            id: true,
            key: true,
            label: true,
            fieldType: true,
            options: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json(applicationFormFields);
  } catch (error) {
    console.error('Error fetching application form fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}