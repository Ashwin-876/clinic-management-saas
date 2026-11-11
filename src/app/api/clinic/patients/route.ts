import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { patientRegistrationSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const tenantDb = getTenantDb(session.clinicId);
    const result = await tenantDb.getPatients({
      search,
      page,
      limit,
    });

    const metrics = await tenantDb.getPatientMetrics();

    return NextResponse.json({
      success: true,
      ...result,
      metrics: {
        totalPatients: metrics.totalPatients,
        newPatients: metrics.newPatients,
        returningPatients: metrics.returningPatients,
      },
    });
  } catch (error) {
    console.error('[API /api/clinic/patients GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patients.' },
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

    const body = await req.json();
    // Default clinicIdentifier to current clinic
    const payload = {
      ...body,
      clinicIdentifier: session.clinicId,
      registrationChannel: body.registrationChannel || 'RECEPTION_DESK',
    };

    const parseResult = patientRegistrationSchema.safeParse(payload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const tenantDb = getTenantDb(session.clinicId);

    let dobDate: Date | null = null;
    if (data.dateOfBirth) {
      dobDate = new Date(data.dateOfBirth);
    }

    const patient = await tenantDb.createPatient({
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      age: data.age,
      dateOfBirth: dobDate,
      gender: data.gender,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContact,
      consentGiven: data.consentGiven,
      registrationChannel: 'RECEPTION_DESK',
    });

    logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'PATIENT_CREATED_BY_STAFF',
      entity: 'Patient',
      details: {
        patientId: patient.patientId,
        fullName: patient.fullName,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Patient registered successfully.',
        patient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/clinic/patients POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register patient.' },
      { status: 400 }
    );
  }
}

