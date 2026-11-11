import { NextRequest, NextResponse } from 'next/server';
import { getSession, isClinicAdmin } from '@/lib/auth';
import { getTenantDb, TenantAccessViolationError } from '@/lib/tenant';
import { departmentUpdateSchema } from '@/lib/validations';
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
    const department = await tenantDb.getDepartmentById(id);

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found in this clinic.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error('[API /api/departments/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve department.' },
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

    if (!isClinicAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can update departments.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parseResult = departmentUpdateSchema.safeParse(body);
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
    const updated = await tenantDb.updateDepartment(id, parseResult.data);

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DEPARTMENT_UPDATED',
      entity: 'Department',
      details: { departmentId: id, updatedFields: Object.keys(parseResult.data) },
    });

    return NextResponse.json({
      success: true,
      message: 'Department updated successfully',
      department: updated,
    });
  } catch (error: any) {
    if (error instanceof TenantAccessViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[API /api/departments/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update department.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: 'Forbidden: Only administrators can delete departments.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantDb = getTenantDb(session.clinicId);

    // Safe delete with assigned doctor check
    await tenantDb.deleteDepartment(id);

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'DEPARTMENT_DELETED',
      entity: 'Department',
      details: { departmentId: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error: any) {
    if (error instanceof TenantAccessViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[API /api/departments/[id] DELETE] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete department.' },
      { status: 400 }
    );
  }
}

