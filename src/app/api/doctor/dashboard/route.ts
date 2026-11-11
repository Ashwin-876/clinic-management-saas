import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    if (session.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Forbidden: This portal is reserved for authenticated doctors.' },
        { status: 403 }
      );
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        userId: session.userId,
        clinicId: session.clinicId,
      },
      include: {
        department: true,
        clinic: {
          select: {
            id: true,
            clinicId: true,
            name: true,
            clinicType: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            accountStatus: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        doctor,
        clinic: doctor.clinic,
        department: doctor.department,
      },
    });
  } catch (error) {
    console.error('[API /api/doctor/dashboard GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve doctor dashboard data.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Forbidden: Only doctors can update their doctor profile.' },
        { status: 403 }
      );
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        userId: session.userId,
        clinicId: session.clinicId,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found.' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        phone: body.phone?.trim() || undefined,
        qualification: body.qualification?.trim() || undefined,
        consultationFee:
          body.consultationFee !== undefined ? Number(body.consultationFee) : undefined,
        profileImage: body.profileImage !== undefined ? body.profileImage : undefined,
      },
      include: {
        department: true,
      },
    });

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DOCTOR_SELF_PROFILE_UPDATED',
      entity: 'Doctor',
      details: { doctorId: updated.doctorId },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      doctor: updated,
    });
  } catch (error) {
    console.error('[API /api/doctor/dashboard PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor profile.' },
      { status: 500 }
    );
  }
}

