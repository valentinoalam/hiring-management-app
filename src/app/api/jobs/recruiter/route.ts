// app/api/jobs/recruiter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { AppFormField, Prisma, JobStatus } from '@prisma/client';
import { FormField, transformJobData } from '@/types/job';

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
      select: { role: true, id: true }
    });

    if (user?.role !== 'RECRUITER') {
      return NextResponse.json(
        { error: 'Forbidden - Recruiter access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")
    const isActive = searchParams.get("isActive") === "true"
    const companyId = searchParams.get("companyId")

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.JobWhereInput = {
      authorId: session.user.id,
    };

    if (isActive) {
      where.status = "ACTIVE" // Jika "isActive", hanya tampilkan yang berstatus 'active'
    } else if (user && user.id) {
      where.authorId = user.id
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status as JobStatus;
    }

    if (companyId) {
      where.companyId = companyId
    }

    // if (authorId) {
    //   where.authorId = authorId
    // }

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
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
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

    // Transform the data before sending response
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
    const { 
      title, 
      description, 
      department, 
      location, 
      remotePolicy,
      salaryMin, 
      salaryMax, 
      salaryCurrency, 
      salaryDisplay,
      employmentType, 
      status,
      sections,
      settings,
      requirements,
      experienceLevel,
      educationLevel,
      numberOfCandidates,
      applicationFormFields,
      companyId 
    } = body

    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    // Verify that the company exists and user has access to it
    const company = await prisma.company.findFirst({
      where: {
        id: companyId
      }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
    }

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
        title: title,
        slug,
        description: description,
        department: department,
        location: location,
        remotePolicy: remotePolicy || 'onsite',
        salaryMin: new Prisma.Decimal(salaryMin),
        salaryMax: salaryMax ? new Prisma.Decimal(salaryMax) : salaryMin,
        salaryCurrency: salaryCurrency || 'IDR',
        salaryDisplay: salaryDisplay,
        employmentType: employmentType,
        status: status || "draft",
        experienceLevel: experienceLevel,
        educationLevel: educationLevel,
        numberOfCandidates: numberOfCandidates,
        sections: sections,
        settings: settings,
        requirements: requirements,
        // Relations
        authorId: session.user.id,
        authorId: session.user.id,
        companyId: companyId,
        // Application form fields
        applicationFormFields: applicationFormFields ? {
          create: applicationFormFields
            .filter((field: FormField) => field.fieldState !== 'off')
            .map((field: AppFormField) => ({
              fieldId: field.fieldId,
              fieldState: field.fieldState,
              sortOrder: field.sortOrder || 0,
            }))
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
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

    // Transform the created job data
    const transformedJob = transformJobData(job);

    return NextResponse.json(transformedJob, { status: 201 });

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


// --- FUNGSI PUT (Update Job) ---
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      title, 
      description, 
      department, 
      location, 
      salaryMin, 
      salaryMax, 
      salaryCurrency, 
      employmentType, 
      status,
      companyId 
    } = body

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if job exists and user owns it
    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 })
    }

    // If companyId is being updated, verify the new company
    if (companyId && companyId !== existingJob.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
        }
      })

      if (!company) {
        return NextResponse.json({ error: "Company not found or access denied" }, { status: 404 })
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(location !== undefined && { location }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? Number.parseFloat(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? Number.parseFloat(salaryMax) : null }),
        ...(salaryCurrency && { salaryCurrency }),
        ...(employmentType !== undefined && { employmentType }),
        ...(status && { status }),
        ...(companyId && { companyId }),
        ...(title && { 
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
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
    })

    // Transform the updated job data
    const transformedJob = transformJobData(updatedJob);

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error("[v0] Error updating job:", error)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
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