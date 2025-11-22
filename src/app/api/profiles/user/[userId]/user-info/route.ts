import "server-only";
import { NextRequest, NextResponse } from 'next/server.js';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user's profile first
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const userInfo = await prisma.otherUserInfo.findMany({
      where: {
        profileId: profile.id,
      },
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
    });
    console.log('userInfo', userInfo);
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
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

    const body = await request.json();
    const { fieldId, infoFieldAnswer } = body;

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if record already exists
    const existingUserInfo = await prisma.otherUserInfo.findUnique({
      where: {
        fieldId_profileId: {
          fieldId,
          profileId: profile.id,
        },
      },
    });

    let userInfo;
    if (existingUserInfo) {
      // Update existing
      userInfo = await prisma.otherUserInfo.update({
        where: { id: existingUserInfo.id },
        data: { infoFieldAnswer },
        include: {
          field: true,
        },
      });
    } else {
      // Create new
      userInfo = await prisma.otherUserInfo.create({
        data: {
          profileId: profile.id,
          fieldId,
          infoFieldAnswer,
        },
        include: {
          field: true,
        },
      });
    }

    return NextResponse.json(userInfo, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}