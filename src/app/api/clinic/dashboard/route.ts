import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    // Tenant-isolated database access helper
    const tenantDb = getTenantDb(session.clinicId);

    const [advancedData, settings, users, auditLogs] = await Promise.all([
      tenantDb.getAdvancedDashboardMetrics(),
      tenantDb.getSettings(),
      tenantDb.getUsers(),
      tenantDb.getAuditLogs(10),
    ]);

    const clinic = advancedData.clinic;

    if (!clinic) {
      return NextResponse.json(
        { error: 'Tenant record not found for the active session.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        clinic: {
          id: clinic.id,
          clinicId: clinic.clinicId,
          name: clinic.name,
          clinicType: clinic.clinicType,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          pincode: clinic.pincode,
          accountStatus: clinic.accountStatus,
          createdAt: clinic.createdAt,
          updatedAt: clinic.updatedAt,
        },
        metrics: advancedData.metrics,
        recentDoctors: advancedData.recentDoctors,
        recentPatients: advancedData.recentPatients,
        settings: settings || {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          slotDuration: 15,
          emailNotifications: true,
          smsNotifications: true,
          themeMode: 'light',
        },
        adminUser: {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
        },
        users,
        recentAuditLogs: auditLogs,
      },
    });
  } catch (error) {
    console.error('[API /api/clinic/dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve clinic dashboard data.' },
      { status: 500 }
    );
  }
}
