import { Prisma, PrismaClient } from '@prisma/client';

export const DOCTOR_ID_PREFIX = 'DOC-';
export const DOCTOR_ID_PADDING = 6;

export function formatDoctorId(sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(DOCTOR_ID_PADDING, '0');
  return `${DOCTOR_ID_PREFIX}${padded}`;
}

export async function generateNextDoctorId(
  tx: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  const sequenceId = 'doctor_sequence';

  const seq = await tx.doctorSequence.upsert({
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
  let candidateId = formatDoctorId(assignedNumber);

  // Verification guard: ensure no collision exists in doctors table
  let existing = await tx.doctor.findUnique({
    where: { doctorId: candidateId },
    select: { id: true },
  });

  while (existing) {
    const updated = await tx.doctorSequence.update({
      where: { id: sequenceId },
      data: {
        lastNumber: {
          increment: 1,
        },
      },
    });
    assignedNumber = updated.lastNumber;
    candidateId = formatDoctorId(assignedNumber);

    existing = await tx.doctor.findUnique({
      where: { doctorId: candidateId },
      select: { id: true },
    });
  }

  return candidateId;
}

