// app/api/info-fields/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

    // Get global info fields (system fields) and user's custom fields
    const infoFields = await prisma.infoField.findMany({
      where: {
        OR: [
          { authorId: session.user.id }, // User's custom fields
        ],
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json(infoFields);
  } catch (error) {
    console.error('Error fetching info fields:', error);
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

    // Validate required fields
    if (!body.key || !body.label) {
      return NextResponse.json(
        { error: 'Key and label are required' },
        { status: 400 }
      );
    }

    const infoField = await prisma.infoField.create({
      data: {
        key: body.key,
        label: body.label,
        fieldType: body.fieldType || 'text',
        displayOrder: body.displayOrder || 0,
        options: body.options ? JSON.stringify(body.options) : null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(infoField, { status: 201 });
  } catch (error) {
    console.error('Error creating info field:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Info field with this key already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}