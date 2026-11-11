import { NextRequest, NextResponse } from 'next/server';
import { getSession, isClinicAdmin, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';
import { Role } from '@prisma/client';

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  mobileNumber: z.string().trim().min(10, 'Mobile number must be at least 10 digits'),
  role: z.enum(['ADMIN', 'RECEPTIONIST']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffMembers = await prisma.user.findMany({
      where: { clinicId: session.clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      staff: staffMembers,
    });
  } catch (error) {
    console.error('[API /api/clinic/staff GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve staff members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isClinicAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can add staff members.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = staffSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, mobileNumber, role, password } = parseResult.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A user account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        clinicId: session.clinicId,
        name,
        email,
        mobileNumber,
        role: role as Role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'STAFF_MEMBER_CREATED',
      entity: 'User',
      details: {
        newUserId: newUser.id,
        role: newUser.role,
        email: newUser.email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Staff member added with role: ${role}`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/clinic/staff POST] Error:', error);
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 });
  }
}

