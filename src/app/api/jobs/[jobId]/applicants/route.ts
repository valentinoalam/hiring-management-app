// app/api/jobs/[id]/applications/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const [session, resolvedParams] = await Promise.all([
        auth(),    
        params, 
    ]);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { jobId } = resolvedParams;
    const { user } = session;
    const { role } = user;
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        authorId: user.id
      }
    })
    // Verify job ownership
    if (!job) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const sortBy = searchParams.get('sortBy') || 'appliedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {}

    if (role === "RECRUITER" && jobId) {
      where.job = {
        id: jobId,
        authorId: user.id,
      }
    }
    where.applicantId = user.id
    
    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        {
          applicant: {
            user: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          applicant: {
            user: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          coverLetter: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [candidates, totalCount]  = await Promise.all([ 
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
              author: {
                select: {
                  name: true,
                  profile: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
          applicant: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              userInfo: {
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
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Get most recent note
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              notes: true,
            },
          },
          
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);
    console.log('Candidates:', candidates)
    console.log('Total Count:', totalCount)
    return NextResponse.json({
      candidates,
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
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
