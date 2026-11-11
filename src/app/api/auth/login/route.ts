import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { comparePassword, signToken, setSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Rate limiting (max 10 login attempts per minute per IP)
    const rateCheck = checkRateLimit(`login_${ip}`, { limit: 10, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please wait a moment before trying again.',
          retryAfterMs: rateCheck.resetMs,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid email or password format.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // 3. Find user with clinic and optional doctor profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clinic: true,
        doctorProfile: {
          select: {
            id: true,
            doctorId: true,
            accountStatus: true,
          },
        },
      },
    });

    if (!user) {
      // Record failed attempt in audit
      await logAuditEvent({
        action: 'LOGIN_FAILED_UNKNOWN_USER',
        entity: 'Auth',
        details: { attemptedEmail: email },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'This user account has been deactivated. Please contact your clinic administrator.' },
        { status: 403 }
      );
    }

    if (user.role === 'DOCTOR' && user.doctorProfile?.accountStatus === 'INACTIVE') {
      return NextResponse.json(
        { error: 'This doctor profile is currently marked as INACTIVE. Please contact clinic administration.' },
        { status: 403 }
      );
    }

    // 4. Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        clinicId: user.clinicId,
        userId: user.id,
        action: 'LOGIN_FAILED_BAD_PASSWORD',
        entity: 'Auth',
        details: { email: user.email },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 5. Check clinic status
    if (user.clinic.accountStatus === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This clinic account is currently suspended. Please contact platform support.' },
        { status: 403 }
      );
    }

    // 6. Generate Session Token
    const sessionPayload = {
      userId: user.id,
      clinicId: user.clinic.clinicId,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicName: user.clinic.name,
      doctorId: user.doctorProfile?.id,
    };

    const token = signToken(sessionPayload);
    await setSessionCookie(token);

    // 7. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Record audit log
    await logAuditEvent({
      clinicId: user.clinic.clinicId,
      userId: user.id,
      action: user.role === 'DOCTOR' ? 'DOCTOR_LOGIN_SUCCESS' : 'ADMIN_LOGIN_SUCCESS',
      entity: 'Auth',
      details: {
        clinicId: user.clinic.clinicId,
        email: user.email,
        role: user.role,
        doctorId: user.doctorProfile?.doctorId,
      },
      ipAddress: ip,
      userAgent,
    });

    const redirectTo = user.role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinic.clinicId,
        clinicName: user.clinic.name,
        doctorId: user.doctorProfile?.id,
      },
    });
  } catch (error) {
    console.error('[API /api/auth/login] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred during authentication.' },
      { status: 500 }
    );
  }
}
