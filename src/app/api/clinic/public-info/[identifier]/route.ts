import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    const cleanId = decodeURIComponent(identifier).trim();

    const clinic = await prisma.clinic.findFirst({
      where: {
        OR: [
          { clinicId: cleanId },
          { qrSlug: cleanId },
        ],
      },
      select: {
        clinicId: true,
        qrSlug: true,
        name: true,
        clinicType: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        accountStatus: true,
      },
    });

    if (!clinic || clinic.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Clinic not found or registration is currently unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clinic: {
        clinicId: clinic.clinicId,
        qrSlug: clinic.qrSlug,
        name: clinic.name,
        clinicType: clinic.clinicType,
        phone: clinic.phone,
        address: clinic.address,
        city: clinic.city,
        state: clinic.state,
      },
    });
  } catch (error) {
    console.error('Error fetching public clinic info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve clinic information' },
      { status: 500 }
    );
  }
}

