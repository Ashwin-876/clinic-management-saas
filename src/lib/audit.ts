import { prisma } from './prisma';

export interface AuditLogParams {
  clinicId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent({
  clinicId = null,
  userId = null,
  action,
  entity,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  try {
    const detailsString =
      typeof details === 'object' && details !== null
        ? JSON.stringify(details)
        : details || null;

    await prisma.auditLog.create({
      data: {
        clinicId,
        userId,
        action,
        entity,
        details: detailsString,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Audit log write failure must not break main transaction but should be logged to stderr
    console.error('[AuditLog] Failed to record audit log:', error);
  }
}

