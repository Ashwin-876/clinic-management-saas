import { NextRequest, NextResponse } from 'next/server';
import { getSession, isClinicAdmin } from '@/lib/auth';
import { getTenantDb, TenantAccessViolationError } from '@/lib/tenant';
import { doctorUpdateSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantDb = getTenantDb(session.clinicId);
    const doctor = await tenantDb.getDoctorById(id);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found in this clinic.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error('[API /api/doctors/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve doctor profile.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantDb = getTenantDb(session.clinicId);

    // Permission check: Administrator or doctor editing their own profile
    const existing = await tenantDb.getDoctorById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Doctor record not found.' }, { status: 404 });
    }

    const isSelfDoctor = session.role === 'DOCTOR' && session.userId === existing.userId;
    if (!isClinicAdmin(session.role) && !isSelfDoctor) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges to edit this doctor profile.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = doctorUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // If non-admin (doctor self-editing), restrict editing accountStatus
    const updateData = { ...parseResult.data };
    if (!isClinicAdmin(session.role)) {
      delete updateData.accountStatus;
    }

    const updated = await tenantDb.updateDoctor(id, updateData);

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DOCTOR_UPDATED',
      entity: 'Doctor',
      details: {
        doctorId: updated.doctorId,
        updatedFields: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: updated,
    });
  } catch (error: any) {
    if (error instanceof TenantAccessViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[API /api/doctors/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update doctor profile.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isClinicAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can toggle doctor activation status.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const status = body.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';

    const tenantDb = getTenantDb(session.clinicId);
    const updated = await tenantDb.toggleDoctorStatus(id, status);

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DOCTOR_STATUS_TOGGLED',
      entity: 'Doctor',
      details: {
        doctorId: updated.doctorId,
        newStatus: status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Doctor status updated to ${status}`,
      doctor: updated,
    });
  } catch (error: any) {
    if (error instanceof TenantAccessViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[API /api/doctors/[id] PATCH] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update doctor status.' },
      { status: 500 }
    );
  }
}

