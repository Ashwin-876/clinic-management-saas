import { Prisma, PrismaClient } from '@prisma/client';

export const CLINIC_ID_PREFIX = 'QNX-CLN-';
export const CLINIC_ID_PADDING = 6;

/**
 * Formats a numeric sequence into a standardized Clinic ID:
 * e.g. 1 -> QNX-CLN-000001, 25 -> QNX-CLN-000025
 */
export function formatClinicId(sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(CLINIC_ID_PADDING, '0');
  return `${CLINIC_ID_PREFIX}${padded}`;
}

/**
 * Atomically generates the next unique Clinic ID using a dedicated sequence counter
 * inside a database transaction to guarantee no duplicate IDs and sequential allocation.
 */
export async function generateNextClinicId(
  tx: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  const sequenceId = 'clinic_sequence';

  // Atomic update using Prisma upsert with increment
  const seq = await tx.clinicSequence.upsert({
    where: { id: sequenceId },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      id: sequenceId,
      lastNumber: 1,
    },
  });

  let assignedNumber = seq.lastNumber;
  let candidateId = formatClinicId(assignedNumber);

  // Verification guard: ensure no collision exists in clinics table
  let existing = await tx.clinic.findUnique({
    where: { clinicId: candidateId },
    select: { id: true },
  });

  while (existing) {
    const updated = await tx.clinicSequence.update({
      where: { id: sequenceId },
      data: {
        lastNumber: {
          increment: 1,
        },
      },
    });
    assignedNumber = updated.lastNumber;
    candidateId = formatClinicId(assignedNumber);

    existing = await tx.clinic.findUnique({
      where: { clinicId: candidateId },
      select: { id: true },
    });
  }

  return candidateId;
}

