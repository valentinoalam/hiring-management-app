// app/api/profiles/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Users can only access their own profile, or admins can access any
    if (session.user.id !== params.userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own profile' },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: params.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
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
        company: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own profile' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: params.userId },
      data: {
        fullname: body.fullname,
        bio: body.bio,
        phone: body.phone,
        location: body.location,
        avatarUrl: body.avatarUrl,
        resumeUrl: body.resumeUrl,
        portfolioUrl: body.portfolioUrl,
        companyName: body.companyName,
        website: body.website,
        linkedinUrl: body.linkedinUrl,
        githubUrl: body.githubUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
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
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}