import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant';
import { generateQrCodeDataUrl, getPatientRegistrationUrl } from '@/lib/qr';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantDb = getTenantDb(session.clinicId);
    const qrSlug = await tenantDb.getOrCreateQrSlug();

    // Determine base URL from incoming request header or environment
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Generate secure public registration URL using the unguessable slug
    const registrationUrl = getPatientRegistrationUrl(qrSlug, baseUrl);

    // Generate QR Code data URL (PNG)
    const qrCodeDataUrl = await generateQrCodeDataUrl(registrationUrl, {
      width: 480,
      margin: 2,
    });

    const clinic = await prisma.clinic.findUnique({
      where: { clinicId: session.clinicId },
      select: {
        name: true,
        clinicId: true,
        clinicType: true,
        phone: true,
        address: true,
        city: true,
      },
    });

    return NextResponse.json({
      success: true,
      clinicId: session.clinicId,
      clinicName: clinic?.name || 'Clinic',
      qrSlug,
      registrationUrl,
      qrCodeDataUrl,
      clinic,
    });
  } catch (error) {
    console.error('[API /api/clinic/qr GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate clinic QR code.' },
      { status: 500 }
    );
  }
}

