import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Get all form fields for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {jobId} = await params;

    // Verify the job belongs to the current user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        authorId: session.user.id,
      },
      include: {
        applicationFormFields: {
          include: {
            field: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
      },
      formFields: job.applicationFormFields,
    });
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update form fields for a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {jobId} = await params;
    const { formFields } = await request.json();

    if (!Array.isArray(formFields)) {
      return NextResponse.json(
        { error: 'Form fields must be an array' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the current user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        authorId: session.user.id,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Start a transaction to update form fields
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing form fields for this job
      await tx.appFormField.deleteMany({
        where: { jobId },
      });

      // Create new form fields
      const createdFields = await Promise.all(
        formFields.map(async (field: { fieldId: string; fieldState: string }) => {
          return await tx.appFormField.create({
            data: {
              jobId,
              fieldId: field.fieldId,
              fieldState: field.fieldState, // 'mandatory', 'optional', 'off'
            },
            include: {
              field: true,
            },
          });
        })
      );

      return createdFields;
    });

    return NextResponse.json({
      message: 'Form fields updated successfully',
      formFields: result,
    });
  } catch (error) {
    console.error('Error updating form fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}