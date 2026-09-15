import {
  registerPatientSchema,
  loginSchema,
  registerSchema,
  patientSearchSchema,
} from '../lib/validation';

describe('Validation Functions', () => {
  describe('registerPatientSchema', () => {
    it('should validate valid patient data', () => {
      const validPatient = {
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
        gender: 'MALE',
        phone: '+1234567890',
        email: 'john@example.com',
        nationalId: '1234567890123',
        address: '123 Main St',
        bloodGroup: 'O+',
        emergencyContact: '+1234567890',
      };

      const result = registerPatientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it('should reject patient with missing required fields', () => {
      const invalidPatient = {
        firstName: 'John',
        // Missing lastName, dob, gender, phone, nationalId
      };

      const result = registerPatientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('should reject patient with invalid email', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
        gender: 'MALE',
        phone: '+1234567890',
        email: 'invalid-email',
        nationalId: '1234567890123',
        address: '123 Main St',
        bloodGroup: 'O+',
        emergencyContact: '+1234567890',
      };

      const result = registerPatientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('should reject patient with invalid blood group', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
        gender: 'MALE',
        phone: '+1234567890',
        email: 'john@example.com',
        nationalId: '1234567890123',
        address: '123 Main St',
        bloodGroup: 'INVALID',
        emergencyContact: '+1234567890',
      };

      const result = registerPatientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        username: 'admin',
        password: 'Admin@123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject login with missing username', () => {
      const invalidLogin = {
        password: 'Admin@123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject login with missing password', () => {
      const invalidLogin = {
        username: 'admin',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid user registration', () => {
      const validUser = {
        username: 'newuser',
        password: 'Password@123',
        fullName: 'New User',
        role: 'DOCTOR',
        phone: '+1234567890',
        email: 'newuser@example.com',
      };

      const result = registerSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject user with invalid role', () => {
      const invalidUser = {
        username: 'newuser',
        password: 'Password@123',
        fullName: 'New User',
        role: 'INVALID_ROLE',
        phone: '+1234567890',
      };

      const result = registerSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('patientSearchSchema', () => {
    it('should validate valid search query', () => {
      const validSearch = {
        query: 'John',
        page: 1,
        limit: 10,
      };

      const result = patientSearchSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it('should reject search with missing query', () => {
      const invalidSearch = {
        page: 1,
        limit: 10,
      };

      const result = patientSearchSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it('should reject search with limit exceeding maximum', () => {
      const invalidSearch = {
        query: 'John',
        page: 1,
        limit: 100, // Maximum is 50
      };

      const result = patientSearchSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });
  });
});
