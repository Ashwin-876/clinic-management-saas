import { Prisma, PrismaClient } from '@prisma/client';

export const PATIENT_ID_PREFIX = 'PAT';
export const PATIENT_ID_PADDING = 6;

/**
 * Normalizes clinicId (e.g. "QNX-CLN-000001" -> "CLN000001")
 */
export function sanitizeClinicPart(clinicId: string): string {
  // Strip common prefix QNX- and remove dashes/underscores
  const stripped = clinicId.trim().replace(/^QNX[-_]?/i, '').replace(/[-_]/g, '').toUpperCase();
  if (stripped.startsWith('CLN')) {
    return stripped;
  }
  return `CLN${stripped}`;
}

export function formatPatientId(clinicId: string, sequenceNumber: number): string {
  const clinicPart = sanitizeClinicPart(clinicId);
  const padded = String(sequenceNumber).padStart(PATIENT_ID_PADDING, '0');
  return `${PATIENT_ID_PREFIX}-${clinicPart}-${padded}`;
}

export async function generateNextPatientId(
  tx: Prisma.TransactionClient | PrismaClient,
  clinicId: string
): Promise<string> {
  const seq = await tx.patientSequence.upsert({
    where: { clinicId },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      clinicId,
      lastNumber: 1,
    },
  });

  let assignedNumber = seq.lastNumber;
  let candidateId = formatPatientId(clinicId, assignedNumber);

  // Verification guard: ensure no collision exists in patients table
  let existing = await tx.patient.findUnique({
    where: { patientId: candidateId },
    select: { id: true },
  });

  while (existing) {
    const updated = await tx.patientSequence.update({
      where: { clinicId },
      data: {
        lastNumber: {
          increment: 1,
        },
      },
    });
    assignedNumber = updated.lastNumber;
    candidateId = formatPatientId(clinicId, assignedNumber);

    existing = await tx.patient.findUnique({
      where: { patientId: candidateId },
      select: { id: true },
    });
  }

  return candidateId;
}
