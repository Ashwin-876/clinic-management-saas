import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a secure, unguessable slug for a clinic's public registration QR link
 */
export function generateClinicQrSlug(clinicId: string): string {
  const hash = crypto.randomBytes(8).toString('hex');
  const safeClinic = clinicId.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  return `c_${safeClinic}_${hash}`;
}

/**
 * Builds the full public registration URL for scanning
 */
export function getPatientRegistrationUrl(slugOrClinicId: string, baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cleanHost = host.replace(/\/$/, '');
  return `${cleanHost}/register-patient/${encodeURIComponent(slugOrClinicId)}`;
}

/**
 * Generates high-resolution QR code data URL (PNG base64)
 */
export async function generateQrCodeDataUrl(
  url: string,
  options: QrCodeOptions = {}
): Promise<string> {
  return await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: options.width || 400,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#0f172a', // Tailwind slate-900
      light: options.color?.light || '#ffffff',
    },
  });
}

