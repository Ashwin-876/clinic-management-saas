import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtpSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyOtpCode } from '@/lib/otp';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`verify_otp_${ip}`, { limit: 10, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = verifyOtpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clinicIdentifier, mobileNumber, otpCode } = parseResult.data;
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
        accountStatus: true,
      },
    });

    if (!clinic || clinic.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Clinic not found or inactive.' },
        { status: 404 }
      );
    }

    // Verify OTP code
    const verifyResult = await verifyOtpCode(clinic.clinicId, normalizedMobile, otpCode);

    if (!verifyResult.success) {
      logAuditEvent({
        clinicId: clinic.clinicId,
        action: 'PATIENT_OTP_FAILED',
        entity: 'OtpVerification',
        details: {
          mobileNumber: normalizedMobile,
          reason: verifyResult.message,
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { error: verifyResult.message },
        { status: 400 }
      );
    }

    // Retrieve patient record within this clinic tenant
    const patient = await prisma.patient.findUnique({
      where: {
        clinicId_mobileNumber: {
          clinicId: clinic.clinicId,
          mobileNumber: normalizedMobile,
        },
      },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 3,
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found.' },
        { status: 404 }
      );
    }

    logAuditEvent({
      clinicId: clinic.clinicId,
      action: 'PATIENT_OTP_VERIFIED',
      entity: 'Patient',
      details: {
        patientId: patient.patientId,
        mobileNumber: normalizedMobile,
      },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully.',
      verificationToken: verifyResult.verificationToken,
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        fullName: patient.fullName,
        mobileNumber: patient.mobileNumber,
        age: patient.age,
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString().split('T')[0] : null,
        gender: patient.gender,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        totalVisits: patient.totalVisits,
        lastVisitAt: patient.lastVisitAt,
        previousVisits: patient.visits,
      },
    });
  } catch (error) {
    console.error('Error verifying patient OTP:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during OTP verification.' },
      { status: 500 }
    );
  }
}

