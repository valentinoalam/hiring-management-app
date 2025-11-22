import "server-only";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Profile } from '@/types/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const paramsResolved = await params;
  const userId = paramsResolved.userId;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Users can only access their own profile, or admins can access any
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own profile' },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
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

    const formattedProfile: Profile = {
      id: profile.id,
      userId: profile.userId,
      fullname: profile.fullname,
      gender: profile.gender ?? undefined,
      email: profile.email ?? profile.user.email,
      bio: profile.bio ?? undefined,
      phone: profile.phone ?? undefined,
      location: profile.location ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      resumeUrl: profile.resumeUrl ?? undefined,
      portfolioUrl: profile.portfolioUrl ?? undefined,
      companyName: profile.companyName ?? undefined,
      website: profile.website ?? undefined,
      linkedinUrl: profile.linkedinUrl ?? undefined,
      githubUrl: profile.githubUrl ?? undefined,
      otherInfo: profile.userInfo?.map(info => ({
        id: info.id,
        fieldId: info.fieldId,
        infoFieldAnswer: info.infoFieldAnswer,
        field: {
          id: info.field.id,
          key: info.field.key,
          label: info.field.label || '',
          fieldType: info.field.fieldType || undefined,
        },
      })) ?? undefined,
    };

    return NextResponse.json(formattedProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}