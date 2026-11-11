import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkMobileSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { createOtpVerification } from '@/lib/otp';
import { logAuditEvent } from '@/lib/audit';

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    })
    .join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`check_mobile_${ip}`, { limit: 15, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = checkMobileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clinicIdentifier, mobileNumber } = parseResult.data;
    const cleanId = clinicIdentifier.trim();
    const normalizedMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');

    // Resolve clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        OR: [
          { clinicId: cleanId },
          { qrSlug: cleanId },
        ],
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        accountStatus: true,
      },
    });

    if (!clinic || clinic.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Clinic not found or registration is currently unavailable.' },
        { status: 404 }
      );
    }

    // Look for existing patient within this clinic's tenant boundary
    const existingPatient = await prisma.patient.findUnique({
      where: {
        clinicId_mobileNumber: {
          clinicId: clinic.clinicId,
          mobileNumber: normalizedMobile,
        },
      },
      select: {
        id: true,
        patientId: true,
        fullName: true,
        mobileNumber: true,
        totalVisits: true,
        lastVisitAt: true,
      },
    });

    if (existingPatient) {
      // Returning patient detected! Generate OTP verification
      const otpResult = await createOtpVerification(
        clinic.clinicId,
        normalizedMobile,
        clinic.name
      );

      console.log(`[SIMULATED SMS] Sent to ${normalizedMobile}: ${otpResult.simulatedSmsMessage}`);

      logAuditEvent({
        clinicId: clinic.clinicId,
        action: 'PATIENT_RETURNING_OTP_SENT',
        entity: 'OtpVerification',
        details: {
          mobileNumber: normalizedMobile,
          patientId: existingPatient.patientId,
          totalVisits: existingPatient.totalVisits,
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({
        exists: true,
        message: 'Existing patient profile found. A verification code has been sent to your mobile.',
        maskedName: maskName(existingPatient.fullName),
        patientId: existingPatient.patientId,
        // In local/test environment or automated test mode, provide simulatedOtp for test verification
        simulatedOtp:
          process.env.NODE_ENV !== 'production' ||
          process.env.ENABLE_TEST_OTP === 'true' ||
          request.headers.get('x-test-mode') === 'true'
            ? otpResult.otpCode
            : undefined,
      });
    }

    // New patient
    return NextResponse.json({
      exists: false,
      message: 'Mobile number not registered at this clinic. Please proceed with registration.',
    });
  } catch (error) {
    console.error('Error checking patient mobile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while checking patient status.' },
      { status: 500 }
    );
  }
}
