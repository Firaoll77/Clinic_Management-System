import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'LAB_TECH']),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  specialization: z.string().optional(),
  licenseNo: z.string().optional(),
  departmentId: z.string().optional(),
});

// User login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Token refresh schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User update schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'LAB_TECH']).optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  specialization: z.string().optional(),
  licenseNo: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Patient registration schema
export const registerPatientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dob: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date of birth'),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address').optional(),
  nationalId: z.string().min(5, 'National ID must be at least 5 characters'),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  emergencyContact: z.string().optional(),
  allergies: z.array(z.object({
    substance: z.string(),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    notes: z.string().optional(),
  })).optional(),
});

// Patient update schema
export const updatePatientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  emergencyContact: z.string().optional(),
});

// Emergency access request schema
export const emergencyAccessSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().min(1).max(24).optional(), // Duration in hours, max 24
});

// Patient search schema
export const patientSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type EmergencyAccessInput = z.infer<typeof emergencyAccessSchema>;
export type PatientSearchInput = z.infer<typeof patientSearchSchema>;
