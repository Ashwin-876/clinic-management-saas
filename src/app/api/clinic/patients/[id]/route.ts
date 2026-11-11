import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { patientUpdateSchema } from '@/lib/validations';
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
    const patient = await tenantDb.getPatientById(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error('[API /api/clinic/patients/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patient details.' },
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
    const body = await req.json();

    const parseResult = patientUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const tenantDb = getTenantDb(session.clinicId);

    let dobDate: Date | null | undefined = undefined;
    if (data.dateOfBirth !== undefined) {
      dobDate = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    const updated = await tenantDb.updatePatient(id, {
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      age: data.age,
      dateOfBirth: dobDate,
      gender: data.gender,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContact,
    });

    logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'PATIENT_UPDATED',
      entity: 'Patient',
      details: {
        patientId: updated.patientId,
        id: updated.id,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Patient profile updated successfully.',
      patient: updated,
    });
  } catch (error: any) {
    console.error('[API /api/clinic/patients/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update patient details.' },
      { status: 400 }
    );
  }
}

