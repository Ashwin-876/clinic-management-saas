import crypto from 'crypto';
import { prisma } from './prisma';

export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;

export interface OtpGenerationResult {
  otpCode: string;
  expiresAt: Date;
  simulatedSmsMessage: string;
}

export function generateNumericOtp(length = 6): string {
  // Cryptographically secure random 6-digit number
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}

/**
 * Creates and stores an OTP for a given mobile number and clinic.
 * Implements sliding window / invalidate existing unverified OTPs.
 */
export async function createOtpVerification(
  clinicId: string,
  mobileNumber: string,
  clinicName = 'Clinic'
): Promise<OtpGenerationResult> {
  const normalizedMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');
  const otpCode = generateNumericOtp(6);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous unverified OTPs for this mobile + clinic
  await prisma.otpVerification.deleteMany({
    where: {
      clinicId,
      mobileNumber: normalizedMobile,
      verified: false,
    },
  });

  // Create new OTP record
  await prisma.otpVerification.create({
    data: {
      clinicId,
      mobileNumber: normalizedMobile,
      otpCode,
      expiresAt,
      verified: false,
    },
  });

  // Construct WebOTP standard SMS message format
  const simulatedSmsMessage = `${clinicName}: Your verification code is ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.\n\n@localhost #${otpCode}`;

  return {
    otpCode,
    expiresAt,
    simulatedSmsMessage,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  verificationToken?: string;
}

/**
 * Validates an OTP code for a given mobile number and clinic
 */
export async function verifyOtpCode(
  clinicId: string,
  mobileNumber: string,
  otpCode: string
): Promise<VerifyOtpResult> {
  const normalizedMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');
  const cleanCode = otpCode.trim();

  const record = await prisma.otpVerification.findFirst({
    where: {
      clinicId,
      mobileNumber: normalizedMobile,
      verified: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return {
      success: false,
      message: 'No active OTP found. Please request a new code.',
    };
  }

  if (new Date() > record.expiresAt) {
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new code.',
    };
  }

  if (record.otpCode !== cleanCode) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
    return {
      success: false,
      message: `Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
    };
  }

  // Generate secure verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: {
      verified: true,
      token: verificationToken,
    },
  });

  return {
    success: true,
    message: 'Identity verified successfully.',
    verificationToken,
  };
}

/**
 * Confirms that a verification token is valid for a given mobile & clinic
 */
export async function validateVerificationToken(
  clinicId: string,
  mobileNumber: string,
  token: string
): Promise<boolean> {
  const normalizedMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');
  const record = await prisma.otpVerification.findFirst({
    where: {
      clinicId,
      mobileNumber: normalizedMobile,
      token,
      verified: true,
      expiresAt: { gt: new Date() },
    },
  });

  return Boolean(record);
}
