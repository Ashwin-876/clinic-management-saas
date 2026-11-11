import { z } from 'zod';

export const clinicTypes = [
  'General Medical Clinic',
  'Dental Clinic',
  'Multi-specialty Hospital',
  'Poly-clinic',
  'Pediatric Clinic',
  'Diagnostic & Imaging Center',
  'Dermatology & Cosmetology',
  'Orthopedic Center',
  'Eye & Vision Care Clinic',
  'Ayurvedic & Alternative Medicine',
] as const;

export const clinicRegistrationSchema = z
  .object({
    // Clinic Details
    clinicName: z
      .string()
      .trim()
      .min(2, 'Clinic / Hospital Name must be at least 2 characters')
      .max(120, 'Clinic Name cannot exceed 120 characters'),
    clinicType: z
      .string()
      .trim()
      .min(2, 'Clinic Type is required'),
    officialEmail: z
      .string()
      .trim()
      .email('Please enter a valid official email address')
      .toLowerCase(),
    contactNumber: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid clinic contact number'),
    address: z
      .string()
      .trim()
      .min(5, 'Complete Address must be at least 5 characters'),
    city: z
      .string()
      .trim()
      .min(2, 'City is required'),
    state: z
      .string()
      .trim()
      .min(2, 'State is required'),
    pincode: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z\s\-]{3,10}$/, 'Please enter a valid postal / pincode'),

    // Owner / Administrator Details
    ownerName: z
      .string()
      .trim()
      .min(2, 'Owner / Administrator Name must be at least 2 characters')
      .max(80, 'Owner Name cannot exceed 80 characters'),
    ownerEmail: z
      .string()
      .trim()
      .email('Please enter a valid owner email address')
      .toLowerCase(),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid 10-digit mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ClinicRegistrationInput = z.infer<typeof clinicRegistrationSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Department Schemas
export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(60, 'Department name cannot exceed 60 characters'),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export const departmentUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(60, 'Department name cannot exceed 60 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional(),
  isActive: z.boolean().optional(),
});

export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

// Doctor Schemas
export const doctorRegistrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Doctor name must be at least 2 characters')
    .max(80, 'Doctor name cannot exceed 80 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid doctor email address')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid phone number'),
  specialization: z
    .string()
    .trim()
    .min(2, 'Specialization is required')
    .max(80, 'Specialization cannot exceed 80 characters'),
  qualification: z
    .string()
    .trim()
    .min(2, 'Qualification is required (e.g. MBBS, MD)')
    .max(80, 'Qualification cannot exceed 80 characters'),
  experience: z
    .coerce
    .number()
    .min(0, 'Experience in years must be 0 or greater')
    .max(60, 'Experience must be realistic (<= 60 years)'),
  departmentId: z
    .string()
    .min(1, 'Please select a department for the doctor'),
  consultationFee: z
    .coerce
    .number()
    .min(0, 'Consultation fee must be 0 or greater'),
  profileImage: z
    .string()
    .optional()
    .or(z.literal('')),
  accountStatus: z
    .enum(['ACTIVE', 'INACTIVE'])
    .default('ACTIVE'),
  initialPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .default('Doctor@12345'),
});

export type DoctorRegistrationInput = z.infer<typeof doctorRegistrationSchema>;

export const doctorUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Doctor name must be at least 2 characters')
    .max(80, 'Doctor name cannot exceed 80 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid phone number')
    .optional(),
  specialization: z
    .string()
    .trim()
    .min(2, 'Specialization must be at least 2 characters')
    .max(80, 'Specialization cannot exceed 80 characters')
    .optional(),
  qualification: z
    .string()
    .trim()
    .min(2, 'Qualification must be at least 2 characters')
    .max(80, 'Qualification cannot exceed 80 characters')
    .optional(),
  experience: z
    .coerce
    .number()
    .min(0, 'Experience in years must be 0 or greater')
    .max(60, 'Experience must be realistic (<= 60 years)')
    .optional(),
  departmentId: z
    .string()
    .min(1, 'Please select a valid department')
    .optional(),
  consultationFee: z
    .coerce
    .number()
    .min(0, 'Consultation fee must be 0 or greater')
    .optional(),
  profileImage: z
    .string()
    .optional()
    .or(z.literal('')),
  accountStatus: z
    .enum(['ACTIVE', 'INACTIVE'])
    .optional(),
});

export type DoctorUpdateInput = z.infer<typeof doctorUpdateSchema>;

// Patient Schemas (Phase 3)
export const patientRegistrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Patient full name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid 10-digit mobile number'),
  age: z
    .coerce
    .number()
    .int()
    .min(0, 'Age cannot be negative')
    .max(130, 'Please enter a realistic age')
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .nullable(),
  gender: z
    .string()
    .trim()
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase()
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional()
    .nullable(),
  emergencyContact: z
    .string()
    .trim()
    .optional()
    .nullable(),
  consentGiven: z
    .boolean()
    .default(true),
  clinicIdentifier: z
    .string()
    .min(1, 'Clinic identifier is required'),
  registrationChannel: z
    .string()
    .default('QR_CODE'),
  verificationToken: z
    .string()
    .optional(),
});

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;

export const patientUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Patient full name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid mobile number')
    .optional(),
  age: z
    .coerce
    .number()
    .int()
    .min(0, 'Age cannot be negative')
    .max(130, 'Please enter a realistic age')
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .nullable(),
  gender: z
    .string()
    .trim()
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase()
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional()
    .nullable(),
  emergencyContact: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

export const checkMobileSchema = z.object({
  clinicIdentifier: z
    .string()
    .min(1, 'Clinic identifier is required'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid mobile number'),
});

export type CheckMobileInput = z.infer<typeof checkMobileSchema>;

export const verifyOtpSchema = z.object({
  clinicIdentifier: z
    .string()
    .min(1, 'Clinic identifier is required'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid mobile number'),
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

