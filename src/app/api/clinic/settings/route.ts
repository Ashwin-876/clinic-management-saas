import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantDb = getTenantDb(session.clinicId);
  const settings = await tenantDb.getSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const tenantDb = getTenantDb(session.clinicId);

    const updated = await tenantDb.updateSettings({
      timezone: body.timezone,
      currency: body.currency,
      slotDuration: body.slotDuration ? Number(body.slotDuration) : undefined,
      emailNotifications:
        typeof body.emailNotifications === 'boolean' ? body.emailNotifications : undefined,
      smsNotifications:
        typeof body.smsNotifications === 'boolean' ? body.smsNotifications : undefined,
      themeMode: body.themeMode,
    });

    await logAuditEvent({
      clinicId: session.clinicId,
      userId: session.userId,
      action: 'CLINIC_SETTINGS_UPDATED',
      entity: 'ClinicSettings',
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[API /api/clinic/settings] Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

