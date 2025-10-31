// app/api/recruiter/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { AppFormField, Prisma, JobStatus } from '@prisma/client';
import { FormField } from '@/types/job';

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Verify the user is a recruiter
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'RECRUITER') {
      return NextResponse.json(
        { error: 'Forbidden - Recruiter access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.JobWhereInput = {
      recruiterId: session.user.id,
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status as JobStatus;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get jobs with related data
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          // Include applications count for quick stats
          _count: {
            select: {
              candidates: true,
            },
          },
          // Include company info if available
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          // Include application form fields configuration
          applicationFormFields: {
            include: {
              field: {
                select: {
                  id: true,
                  key: true,
                  label: true,
                  fieldType: true,
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Transform the data to include applications count
    const jobsWithStats = jobs.map(job => ({
      ...job,
      applicationsCount: job._count.candidates,
      // Remove the _count field from response
      _count: undefined,
    }));

    return NextResponse.json({
      jobs: jobsWithStats,
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
    console.error('Error fetching recruiter jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Verify the user is a recruiter
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'RECRUITER') {
      return NextResponse.json(
        { error: 'Forbidden - Recruiter access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'employmentType', 'description', 'numberOfCandidates'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate slug from title
    const slug = generateSlug(body.title);

    // Check if slug already exists
    const existingJob = await prisma.job.findUnique({
      where: { slug },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: 'A job with this title already exists' },
        { status: 409 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        department: body.department,
        location: body.location,
        remotePolicy: body.remotePolicy || 'onsite',
        salaryMin: body.salaryMin ? new Prisma.Decimal(body.salaryMin) : null,
        salaryMax: body.salaryMax ? new Prisma.Decimal(body.salaryMax) : null,
        salaryCurrency: body.salaryCurrency || 'IDR',
        salaryDisplay: body.salaryDisplay,
        employmentType: body.employmentType,
        experienceLevel: body.experienceLevel,
        educationLevel: body.educationLevel,
        numberOfCandidates: body.numberOfCandidates,
        sections: body.sections,
        settings: body.settings,
        requirements: body.requirements,
        // Relations
        recruiterId: session.user.id,
        authorId: session.user.id,
        companyId: body.companyId,
        // Application form fields
        applicationFormFields: body.applicationFormFields ? {
          create: body.applicationFormFields
            .filter((field: FormField) => field.fieldState !== 'off')
            .map((field: AppFormField) => ({
              fieldId: field.fieldId,
              fieldState: field.fieldState,
              sortOrder: field.sortOrder || 0,
            }))
        } : undefined,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        applicationFormFields: {
          include: {
            field: {
              select: {
                id: true,
                key: true,
                label: true,
                fieldType: true,
              },
            },
          },
        },
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    // Transform response
    const jobWithStats = {
      ...job,
      applicationsCount: job._count.candidates,
      _count: undefined,
    };

    return NextResponse.json(jobWithStats, { status: 201 });

  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A job with this title already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}