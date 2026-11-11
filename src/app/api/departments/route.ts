import { NextRequest, NextResponse } from 'next/server';
import { getSession, isClinicAdmin } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { departmentSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const tenantDb = getTenantDb(session.clinicId);
    const departments = await tenantDb.getDepartments();

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error('[API /api/departments GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve clinic departments.' },
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
        { error: 'Forbidden: Only clinic administrators can create departments.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = departmentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const tenantDb = getTenantDb(session.clinicId);

    // Check for duplicate department name within this clinic
    const existing = await tenantDb.getDepartments();
    const isDuplicate = existing.some(
      (d) => d.name.toLowerCase() === parseResult.data.name.toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: `Department "${parseResult.data.name}" already exists in this clinic.` },
        { status: 409 }
      );
    }

    const department = await tenantDb.createDepartment(parseResult.data);

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      details: { departmentId: department.id, departmentName: department.name },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Department created successfully',
        department,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/departments POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create department.' },
      { status: 500 }
    );
  }
}

