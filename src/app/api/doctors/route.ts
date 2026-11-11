import { NextRequest, NextResponse } from 'next/server';
import { getSession, isClinicAdmin, hashPassword } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { doctorRegistrationSchema } from '@/lib/validations';
import { generateNextDoctorId } from '@/lib/doctor-id';
import { logAuditEvent } from '@/lib/audit';
import { AccountStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId') || undefined;
    const statusParam = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const status =
      statusParam && (statusParam === 'ACTIVE' || statusParam === 'INACTIVE')
        ? (statusParam as AccountStatus)
        : undefined;

    const tenantDb = getTenantDb(session.clinicId);
    const doctors = await tenantDb.getDoctors({
      departmentId,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error('[API /api/doctors GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve doctors.' },
      { status: 500 }
    );
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
        { error: 'Forbidden: Only administrators can register doctors.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = doctorRegistrationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const tenantDb = getTenantDb(session.clinicId);

    // 1. Verify that department belongs to this clinic
    const dept = await tenantDb.getDepartmentById(data.departmentId);
    if (!dept) {
      return NextResponse.json(
        { error: 'Selected department does not exist in this clinic.' },
        { status: 400 }
      );
    }

    // 2. Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user account with this email already exists in the system.' },
        { status: 409 }
      );
    }

    // 3. Create Doctor & Linked Login User inside transaction
    const initialPassword = data.initialPassword || 'Doctor@12345';
    const passwordHash = await hashPassword(initialPassword);

    const result = await prisma.$transaction(async (tx) => {
      // Generate Unique Doctor ID (DOC-000001 format)
      const generatedDoctorId = await generateNextDoctorId(tx);

      // Create User account with role DOCTOR
      const user = await tx.user.create({
        data: {
          clinicId: session.clinicId,
          name: data.fullName,
          email: data.email,
          mobileNumber: data.phone,
          passwordHash,
          role: 'DOCTOR',
          isActive: data.accountStatus === 'ACTIVE',
        },
      });

      // Create Doctor profile
      const doctor = await tx.doctor.create({
        data: {
          doctorId: generatedDoctorId,
          clinicId: session.clinicId,
          userId: user.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          departmentId: data.departmentId,
          consultationFee: data.consultationFee,
          profileImage: data.profileImage || null,
          accountStatus: data.accountStatus,
        },
        include: {
          department: true,
          user: {
            select: { id: true, email: true, isActive: true },
          },
        },
      });

      return { doctor, user };
    });

    // 4. Record audit log
    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DOCTOR_REGISTERED',
      entity: 'Doctor',
      details: {
        doctorId: result.doctor.doctorId,
        fullName: result.doctor.fullName,
        departmentName: result.doctor.department.name,
        email: result.doctor.email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Doctor successfully onboarded and registered',
        doctor: result.doctor,
        credentials: {
          email: result.doctor.email,
          temporaryPassword: initialPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/doctors POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register doctor.' },
      { status: 500 }
    );
  }
}

