import { NextRequest, NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (session) {
      await logAuditEvent({
        clinicId: session.clinicId,
        userId: session.userId,
        action: 'ADMIN_LOGOUT',
        entity: 'Auth',
        details: { email: session.email },
        ipAddress: ip,
        userAgent,
      });
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[API /api/auth/logout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete logout process.' },
      { status: 500 }
    );
  }
}

