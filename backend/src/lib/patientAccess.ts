import { Role } from '@prisma/client';

/**
 * Field-level access control for patient data
 * Each role can only see/edit specific fields based on their responsibilities
 */

export interface PatientFieldAccess {
  canView: string[];
  canEdit: string[];
}

export const PATIENT_FIELD_ACCESS: Record<Role, PatientFieldAccess> = {
  ADMIN: {
    canView: ['*'], // Full access
    canEdit: ['*'], // Full access
  },
  RECEPTIONIST: {
    canView: ['*'], // Full access to patient data for billing purposes
    canEdit: [
      'firstName', 'lastName', 'phone', 'email', 'address',
      'emergencyContact', 'bloodGroup'
    ],
  },
  DOCTOR: {
    canView: ['*'], // Full medical access
    canEdit: [
      // Medical fields only - demographics handled by receptionist
      'bloodGroup', 'emergencyContact'
    ],
  },
  NURSE: {
    canView: [
      'id', 'mrn', 'firstName', 'lastName', 'dob', 'gender',
      'bloodGroup', 'emergencyContact', 'allergies'
    ],
    canEdit: [
      'bloodGroup', 'emergencyContact'
    ],
  },
  LAB_TECH: {
    canView: [
      'id', 'mrn', 'firstName', 'lastName', 'dob', 'gender'
    ],
    canEdit: [], // Lab techs cannot edit patient data
  },
};

/**
 * Filter patient data based on role access
 */
export function filterPatientDataByRole(patientData: any, role: Role): any {
  const access = PATIENT_FIELD_ACCESS[role];

  if (access.canView.includes('*')) {
    return patientData; // Full access
  }

  const filteredData: any = {};
  access.canView.forEach(field => {
    if (field in patientData) {
      filteredData[field] = patientData[field];
    }
  });

  return filteredData;
}

/**
 * Check if role can edit specific field
 */
export function canEditField(role: Role, field: string): boolean {
  const access = PATIENT_FIELD_ACCESS[role];
  return access.canEdit.includes('*') || access.canEdit.includes(field);
}

/**
 * Validate edit request against role permissions
 */
export function validatePatientEdit(role: Role, fields: string[]): { valid: boolean; invalidFields: string[] } {
  const invalidFields = fields.filter(field => !canEditField(role, field));
  return {
    valid: invalidFields.length === 0,
    invalidFields,
  };
}
