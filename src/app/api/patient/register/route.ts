import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { patientRegistrationSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTenantDb } from '@/lib/tenant';
import { validateVerificationToken } from '@/lib/otp';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`patient_register_${ip}`, { limit: 15, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = patientRegistrationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const cleanId = data.clinicIdentifier.trim();
    const normalizedMobile = data.mobileNumber.trim().replace(/[^0-9+]/g, '');

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
        { error: 'Clinic not found or registration is currently disabled.' },
        { status: 404 }
      );
    }

    const tenantDb = getTenantDb(clinic.clinicId);

    // If verification token is provided, this is a verified returning patient check-in
    if (data.verificationToken) {
      const isValidToken = await validateVerificationToken(
        clinic.clinicId,
        normalizedMobile,
        data.verificationToken
      );

      if (!isValidToken) {
        return NextResponse.json(
          { error: 'Verification session has expired or is invalid. Please request a new OTP.' },
          { status: 401 }
        );
      }

      const existingPatient = await tenantDb.getPatientByMobile(normalizedMobile);
      if (!existingPatient) {
        return NextResponse.json(
          { error: 'Patient profile not found for this clinic.' },
          { status: 404 }
        );
      }

      // Optionally update details if provided
      let dobDate: Date | null = null;
      if (data.dateOfBirth) {
        dobDate = new Date(data.dateOfBirth);
      }

      await tenantDb.updatePatient(existingPatient.id, {
        fullName: data.fullName,
        age: data.age,
        dateOfBirth: dobDate,
        gender: data.gender,
        email: data.email,
        address: data.address,
        emergencyContact: data.emergencyContact,
      });

      // Record new visit
      const { patient: updatedPatient, visit } = await tenantDb.recordPatientVisit(
        existingPatient.id,
        {
          channel: data.registrationChannel || 'QR_CODE',
          notes: 'Returning patient QR check-in',
        }
      );

      logAuditEvent({
        clinicId: clinic.clinicId,
        action: 'PATIENT_RETURNING_VISIT_RECORDED',
        entity: 'PatientVisit',
        details: {
          patientId: updatedPatient.patientId,
          totalVisits: updatedPatient.totalVisits,
          visitId: visit.id,
          channel: data.registrationChannel || 'QR_CODE',
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({
        success: true,
        isReturning: true,
        message: `Welcome back, ${updatedPatient.fullName}! Your visit has been recorded.`,
        patient: updatedPatient,
        visit,
      });
    }

    // Check if this mobile number already exists in this clinic tenant
    const existingPatient = await tenantDb.getPatientByMobile(normalizedMobile);
    if (existingPatient) {
      return NextResponse.json(
        {
          error:
            'A patient with this mobile number is already registered at this clinic. Please verify with OTP to complete your check-in.',
          requiresOtp: true,
          mobileNumber: normalizedMobile,
        },
        { status: 409 }
      );
    }

    // New patient registration
    let dobDate: Date | null = null;
    if (data.dateOfBirth) {
      dobDate = new Date(data.dateOfBirth);
    }

    const newPatient = await tenantDb.createPatient({
      fullName: data.fullName,
      mobileNumber: normalizedMobile,
      age: data.age,
      dateOfBirth: dobDate,
      gender: data.gender,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContact,
      consentGiven: data.consentGiven,
      registrationChannel: data.registrationChannel || 'QR_CODE',
    });

    logAuditEvent({
      clinicId: clinic.clinicId,
      action: 'PATIENT_REGISTERED',
      entity: 'Patient',
      details: {
        patientId: newPatient.patientId,
        fullName: newPatient.fullName,
        channel: data.registrationChannel || 'QR_CODE',
      },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        isReturning: false,
        message: 'Patient registered successfully!',
        patient: newPatient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during patient registration:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during patient registration.' },
      { status: 500 }
    );
  }
}

