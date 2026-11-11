import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicRegistrationSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { generateNextClinicId } from '@/lib/clinic-id';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Rate limiting (max 10 registration attempts per minute per IP)
    const rateCheck = checkRateLimit(`register_${ip}`, { limit: 10, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'Too many registration requests. Please slow down and try again shortly.',
          retryAfterMs: rateCheck.resetMs,
        },
        { status: 429 }
      );
    }

    // 2. Body parsing and validation
    const body = await req.json();
    const parseResult = clinicRegistrationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 3. Pre-flight email duplication checks
    const existingOfficialClinic = await prisma.clinic.findUnique({
      where: { email: data.officialEmail },
      select: { id: true },
    });

    if (existingOfficialClinic) {
      return NextResponse.json(
        {
          error: 'Official email is already registered to an existing clinic.',
          field: 'officialEmail',
        },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.ownerEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Administrator email is already registered to an existing user account.',
          field: 'ownerEmail',
        },
        { status: 409 }
      );
    }

    // 4. Atomic transaction creating Clinic, User, Settings, and Audit Log
    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      // Generate guaranteed unique, permanent Clinic ID (Format: QNX-CLN-000001)
      const generatedClinicId = await generateNextClinicId(tx);

      // Create Clinic record
      const clinic = await tx.clinic.create({
        data: {
          clinicId: generatedClinicId,
          name: data.clinicName,
          clinicType: data.clinicType,
          email: data.officialEmail,
          phone: data.contactNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          accountStatus: 'ACTIVE',
        },
      });

      // Create Clinic Administrator User (Role: ADMIN)
      const user = await tx.user.create({
        data: {
          clinicId: generatedClinicId,
          name: data.ownerName,
          email: data.ownerEmail,
          mobileNumber: data.mobileNumber,
          passwordHash,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Initialize Clinic Settings
      const settings = await tx.clinicSettings.create({
        data: {
          clinicId: generatedClinicId,
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          slotDuration: 15,
          emailNotifications: true,
          smsNotifications: true,
          themeMode: 'light',
        },
      });

      return {
        clinic,
        user,
        settings,
      };
    });

    // 5. Record Audit Log for successful registration
    await logAuditEvent({
      clinicId: result.clinic.clinicId,
      userId: result.user.id,
      action: 'CLINIC_REGISTERED',
      entity: 'Clinic',
      details: {
        clinicId: result.clinic.clinicId,
        clinicName: result.clinic.name,
        clinicType: result.clinic.clinicType,
        administratorEmail: result.user.email,
      },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Clinic registered successfully with generated unique Clinic ID',
        data: {
          clinicId: result.clinic.clinicId,
          clinicName: result.clinic.name,
          clinicType: result.clinic.clinicType,
          officialEmail: result.clinic.email,
          contactNumber: result.clinic.phone,
          address: `${result.clinic.address}, ${result.clinic.city}, ${result.clinic.state} - ${result.clinic.pincode}`,
          adminName: result.user.name,
          adminEmail: result.user.email,
          registrationDate: result.clinic.createdAt,
          accountStatus: result.clinic.accountStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/auth/register] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while registering the clinic.' },
      { status: 500 }
    );
  }
}

