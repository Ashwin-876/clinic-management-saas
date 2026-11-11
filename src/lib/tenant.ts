import { prisma } from './prisma';
import { logAuditEvent } from './audit';
import { AccountStatus } from '@prisma/client';
import { generateNextPatientId } from './patient-id';
import { generateClinicQrSlug } from './qr';

export class TenantAccessViolationError extends Error {
  constructor(message = 'Access Denied: Cross-tenant data access is strictly prohibited.') {
    super(message);
    this.name = 'TenantAccessViolationError';
  }
}

/**
 * Validates that an active user session owns or is authorized for the given clinic ID.
 * Throws TenantAccessViolationError if a mismatch is detected, preventing cross-clinic data leakage.
 */
export function assertTenantMatch(
  sessionClinicId: string,
  targetClinicId: string,
  context?: { userId?: string; ipAddress?: string; resource?: string }
): void {
  if (!sessionClinicId || !targetClinicId || sessionClinicId !== targetClinicId) {
    // Record audit security incident
    logAuditEvent({
      clinicId: sessionClinicId || null,
      userId: context?.userId || null,
      action: 'TENANT_ISOLATION_VIOLATION_BLOCKED',
      entity: context?.resource || 'TenantSecurityGuard',
      details: {
        reason: 'Session clinic_id does not match target clinic_id',
        sessionClinicId,
        targetClinicId,
      },
      ipAddress: context?.ipAddress,
    });

    throw new TenantAccessViolationError(
      `Tenant Isolation Breach Prevented: Session belongs to clinic "${sessionClinicId}", but requested resource for clinic "${targetClinicId}".`
    );
  }
}

/**
 * Provides tenant-isolated database access helpers.
 * Every query MUST explicitly include { clinicId } in where filters.
 */
export function getTenantDb(clinicId: string) {
  if (!clinicId || typeof clinicId !== 'string' || !clinicId.trim()) {
    throw new TenantAccessViolationError('A valid clinic_id is mandatory for tenant queries.');
  }

  return {
    clinicId,

    /**
     * Retrieves the clinic record ensuring clinicId matches
     */
    async getClinic() {
      return prisma.clinic.findUnique({
        where: { clinicId },
        include: {
          settings: true,
          _count: {
            select: { users: true, doctors: true, departments: true },
          },
        },
      });
    },

    /**
     * Advanced Clinic Dashboard Metrics:
     * - Total Doctors
     * - Active Doctors
     * - Inactive Doctors
     * - Total Departments
     * - Recently Added Doctors
     * - Clinic Information
     */
    async getAdvancedDashboardMetrics() {
      const [
        clinic,
        totalDoctors,
        activeDoctors,
        inactiveDoctors,
        totalDepartments,
        recentDoctors,
        totalPatients,
        newPatients,
        returningPatients,
        recentPatients,
      ] = await Promise.all([
        prisma.clinic.findUnique({
          where: { clinicId },
          include: { settings: true },
        }),
        prisma.doctor.count({ where: { clinicId } }),
        prisma.doctor.count({ where: { clinicId, accountStatus: 'ACTIVE' } }),
        prisma.doctor.count({ where: { clinicId, accountStatus: 'INACTIVE' } }),
        prisma.department.count({ where: { clinicId } }),
        prisma.doctor.findMany({
          where: { clinicId },
          include: {
            department: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.patient.count({ where: { clinicId } }),
        prisma.patient.count({ where: { clinicId, totalVisits: 1 } }),
        prisma.patient.count({ where: { clinicId, totalVisits: { gt: 1 } } }),
        prisma.patient.findMany({
          where: { clinicId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        clinic,
        metrics: {
          totalDoctors,
          activeDoctors,
          inactiveDoctors,
          totalDepartments,
          totalPatients,
          newPatients,
          returningPatients,
        },
        recentDoctors,
        recentPatients,
      };
    },

    /**
     * Department Management
     */
    async getDepartments() {
      return prisma.department.findMany({
        where: { clinicId },
        include: {
          _count: {
            select: { doctors: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    },

    async getDepartmentById(id: string) {
      return prisma.department.findFirst({
        where: { id, clinicId },
        include: {
          doctors: {
            select: {
              id: true,
              doctorId: true,
              fullName: true,
              specialization: true,
              accountStatus: true,
            },
          },
        },
      });
    },

    async createDepartment(data: { name: string; description?: string }) {
      return prisma.department.create({
        data: {
          clinicId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          isActive: true,
        },
      });
    },

    async updateDepartment(
      id: string,
      data: { name?: string; description?: string; isActive?: boolean }
    ) {
      // Enforce tenant boundary
      const existing = await prisma.department.findFirst({
        where: { id, clinicId },
      });
      if (!existing) {
        throw new TenantAccessViolationError('Department not found in active clinic tenant.');
      }

      return prisma.department.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          description: data.description !== undefined ? data.description.trim() || null : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
      });
    },

    async deleteDepartment(id: string) {
      // 1. Verify existence in this tenant
      const department = await prisma.department.findFirst({
        where: { id, clinicId },
        include: {
          _count: {
            select: { doctors: true },
          },
        },
      });

      if (!department) {
        throw new TenantAccessViolationError('Department not found in active clinic tenant.');
      }

      // 2. Safety check: prevent deletion if doctors are assigned
      if (department._count.doctors > 0) {
        throw new Error(
          `Cannot delete department "${department.name}" because ${department._count.doctors} doctor(s) are currently assigned to it. Reassign or delete doctors first.`
        );
      }

      return prisma.department.delete({
        where: { id },
      });
    },

    /**
     * Doctor Management
     */
    async getDoctors(filters?: {
      departmentId?: string;
      status?: AccountStatus;
      search?: string;
    }) {
      const where: any = { clinicId };

      if (filters?.departmentId && filters.departmentId !== 'ALL') {
        where.departmentId = filters.departmentId;
      }

      if (filters?.status && filters.status !== ('ALL' as any)) {
        where.accountStatus = filters.status;
      }

      if (filters?.search && filters.search.trim()) {
        const query = filters.search.trim();
        where.OR = [
          { fullName: { contains: query, mode: 'insensitive' } },
          { doctorId: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { specialization: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ];
      }

      return prisma.doctor.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, email: true, isActive: true, lastLoginAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    async getDoctorById(id: string) {
      return prisma.doctor.findFirst({
        where: { id, clinicId },
        include: {
          department: true,
          user: {
            select: { id: true, email: true, isActive: true, lastLoginAt: true, role: true },
          },
        },
      });
    },

    async updateDoctor(
      id: string,
      data: {
        fullName?: string;
        phone?: string;
        specialization?: string;
        qualification?: string;
        experience?: number;
        departmentId?: string;
        consultationFee?: number;
        profileImage?: string;
        accountStatus?: AccountStatus;
      }
    ) {
      const doctor = await prisma.doctor.findFirst({
        where: { id, clinicId },
      });
      if (!doctor) {
        throw new TenantAccessViolationError('Doctor record not found in active clinic tenant.');
      }

      // If departmentId is changing, ensure new department belongs to same clinic
      if (data.departmentId && data.departmentId !== doctor.departmentId) {
        const dept = await prisma.department.findFirst({
          where: { id: data.departmentId, clinicId },
        });
        if (!dept) {
          throw new TenantAccessViolationError('Target department does not belong to active clinic.');
        }
      }

      const updatedDoctor = await prisma.doctor.update({
        where: { id },
        data: {
          fullName: data.fullName?.trim(),
          phone: data.phone?.trim(),
          specialization: data.specialization?.trim(),
          qualification: data.qualification?.trim(),
          experience: data.experience !== undefined ? Number(data.experience) : undefined,
          departmentId: data.departmentId,
          consultationFee:
            data.consultationFee !== undefined ? Number(data.consultationFee) : undefined,
          profileImage: data.profileImage,
          accountStatus: data.accountStatus,
        },
        include: {
          department: true,
          user: true,
        },
      });

      // Synchronize User isActive status if doctor status changed
      if (data.accountStatus && doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: {
            isActive: data.accountStatus === 'ACTIVE',
          },
        });
      }

      return updatedDoctor;
    },

    async toggleDoctorStatus(id: string, status: AccountStatus) {
      return this.updateDoctor(id, { accountStatus: status });
    },

    /**
     * Users & Settings (Phase 1)
     */
    async getUsers() {
      return prisma.user.findMany({
        where: { clinicId },
        select: {
          id: true,
          name: true,
          email: true,
          mobileNumber: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    async getSettings() {
      return prisma.clinicSettings.findUnique({
        where: { clinicId },
      });
    },

    async updateSettings(data: {
      timezone?: string;
      currency?: string;
      slotDuration?: number;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      themeMode?: string;
    }) {
      return prisma.clinicSettings.update({
        where: { clinicId },
        data,
      });
    },

    async getAuditLogs(limit = 20) {
      return prisma.auditLog.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },

    /**
     * Phase 3: Patient Registration & Profile Management
     */
    async getOrCreateQrSlug(): Promise<string> {
      const clinic = await prisma.clinic.findUnique({
        where: { clinicId },
        select: { id: true, qrSlug: true },
      });
      if (clinic?.qrSlug) {
        return clinic.qrSlug;
      }
      const newSlug = generateClinicQrSlug(clinicId);
      await prisma.clinic.update({
        where: { clinicId },
        data: { qrSlug: newSlug },
      });
      return newSlug;
    },

    async getPatients(options?: { search?: string; page?: number; limit?: number }) {
      const page = Math.max(1, options?.page || 1);
      const limit = Math.max(1, Math.min(100, options?.limit || 20));
      const skip = (page - 1) * limit;

      const where: any = { clinicId };

      if (options?.search && options.search.trim()) {
        const search = options.search.trim();
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search } },
          { patientId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          include: {
            visits: {
              orderBy: { visitDate: 'desc' },
              take: 1,
            },
            _count: {
              select: { visits: true },
            },
          },
          orderBy: { lastVisitAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.patient.count({ where }),
      ]);

      return {
        patients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    async getPatientById(idOrPatientId: string) {
      const patient = await prisma.patient.findFirst({
        where: {
          clinicId,
          OR: [{ id: idOrPatientId }, { patientId: idOrPatientId }],
        },
        include: {
          visits: {
            orderBy: { visitDate: 'desc' },
          },
        },
      });

      return patient;
    },

    async getPatientByMobile(mobileNumber: string) {
      const normalizedMobile = mobileNumber.trim().replace(/[^0-9+]/g, '');
      return prisma.patient.findFirst({
        where: {
          clinicId,
          mobileNumber: normalizedMobile,
        },
        include: {
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 5,
          },
        },
      });
    },

    async createPatient(data: {
      fullName: string;
      mobileNumber: string;
      age?: number | null;
      dateOfBirth?: Date | null;
      gender?: string | null;
      email?: string | null;
      address?: string | null;
      emergencyContact?: string | null;
      consentGiven?: boolean;
      registrationChannel?: string;
    }) {
      const normalizedMobile = data.mobileNumber.trim().replace(/[^0-9+]/g, '');

      return prisma.$transaction(async (tx) => {
        // Enforce tenant isolation & check for existing patient
        const existing = await tx.patient.findUnique({
          where: {
            clinicId_mobileNumber: {
              clinicId,
              mobileNumber: normalizedMobile,
            },
          },
        });

        if (existing) {
          throw new Error('A patient with this mobile number is already registered at this clinic.');
        }

        const patientId = await generateNextPatientId(tx, clinicId);

        const newPatient = await tx.patient.create({
          data: {
            patientId,
            clinicId,
            fullName: data.fullName.trim(),
            mobileNumber: normalizedMobile,
            age: data.age !== undefined ? data.age : null,
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender?.trim() || null,
            email: data.email?.trim() || null,
            address: data.address?.trim() || null,
            emergencyContact: data.emergencyContact?.trim() || null,
            consentGiven: data.consentGiven ?? true,
            totalVisits: 1,
            lastVisitAt: new Date(),
          },
        });

        // Record the initial visit
        const initialVisit = await tx.patientVisit.create({
          data: {
            patientId: newPatient.id,
            clinicId,
            registrationChannel: data.registrationChannel || 'QR_CODE',
            visitDate: new Date(),
          },
        });

        return {
          ...newPatient,
          visits: [initialVisit],
        };
      });
    },

    async recordPatientVisit(
      patientId: string,
      options?: { channel?: string; notes?: string }
    ) {
      return prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findFirst({
          where: {
            clinicId,
            OR: [{ id: patientId }, { patientId }],
          },
        });

        if (!patient) {
          throw new TenantAccessViolationError('Patient record not found in active clinic tenant.');
        }

        const visit = await tx.patientVisit.create({
          data: {
            patientId: patient.id,
            clinicId,
            registrationChannel: options?.channel || 'QR_CODE',
            notes: options?.notes || null,
            visitDate: new Date(),
          },
        });

        const updatedPatient = await tx.patient.update({
          where: { id: patient.id },
          data: {
            totalVisits: { increment: 1 },
            lastVisitAt: new Date(),
          },
          include: {
            visits: {
              orderBy: { visitDate: 'desc' },
              take: 5,
            },
          },
        });

        return {
          patient: updatedPatient,
          visit,
        };
      });
    },

    async updatePatient(
      id: string,
      data: {
        fullName?: string;
        mobileNumber?: string;
        age?: number | null;
        dateOfBirth?: Date | null;
        gender?: string | null;
        email?: string | null;
        address?: string | null;
        emergencyContact?: string | null;
      }
    ) {
      const patient = await prisma.patient.findFirst({
        where: { id, clinicId },
      });

      if (!patient) {
        throw new TenantAccessViolationError('Patient record not found in active clinic tenant.');
      }

      const normalizedMobile = data.mobileNumber
        ? data.mobileNumber.trim().replace(/[^0-9+]/g, '')
        : undefined;

      // If mobile number is changing, verify no conflict in same clinic
      if (normalizedMobile && normalizedMobile !== patient.mobileNumber) {
        const conflict = await prisma.patient.findUnique({
          where: {
            clinicId_mobileNumber: {
              clinicId,
              mobileNumber: normalizedMobile,
            },
          },
        });
        if (conflict) {
          throw new Error('Another patient with this mobile number already exists in this clinic.');
        }
      }

      return prisma.patient.update({
        where: { id },
        data: {
          fullName: data.fullName?.trim(),
          mobileNumber: normalizedMobile,
          age: data.age !== undefined ? data.age : undefined,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender?.trim(),
          email: data.email?.trim(),
          address: data.address?.trim(),
          emergencyContact: data.emergencyContact?.trim(),
        },
        include: {
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 5,
          },
        },
      });
    },

    async getPatientMetrics() {
      const [totalPatients, newPatients, returningPatients, recentVisits] = await Promise.all([
        prisma.patient.count({ where: { clinicId } }),
        prisma.patient.count({ where: { clinicId, totalVisits: 1 } }),
        prisma.patient.count({ where: { clinicId, totalVisits: { gt: 1 } } }),
        prisma.patientVisit.findMany({
          where: { clinicId },
          include: {
            patient: {
              select: {
                id: true,
                patientId: true,
                fullName: true,
                mobileNumber: true,
              },
            },
          },
          orderBy: { visitDate: 'desc' },
          take: 10,
        }),
      ]);

      return {
        totalPatients,
        newPatients,
        returningPatients,
        recentVisits,
      };
    },
  };
}
