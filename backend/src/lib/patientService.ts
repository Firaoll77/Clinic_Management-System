import { prisma } from './prisma';

/**
 * Patient Service
 * Handles patient registration, MRN generation, and patient management
 */

export class PatientService {
  /**
   * Generate unique MRN (Medical Record Number)
   * Format: MRN-YYYY-XXXXXXXX where XXXXXXXX is a random 8-digit number
   */
  static generateMRN(): string {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `MRN-${year}-${randomPart}`;
  }

  /**
   * Check for duplicate patients based on key identifying information
   */
  static async checkForDuplicates(patientData: {
    firstName: string;
    lastName: string;
    dob: Date;
    phone: string;
    nationalId: string;
  }): Promise<boolean> {
    const duplicates = await prisma.patient.findMany({
      where: {
        OR: [
          {
            AND: [
              { firstName: patientData.firstName },
              { lastName: patientData.lastName },
              { dob: patientData.dob }
            ]
          },
          { phone: patientData.phone },
          { nationalId: patientData.nationalId }
        ]
      }
    });

    return duplicates.length > 0;
  }

  /**
   * Register a new patient with automatic MRN generation
   */
  static async registerPatient(patientData: {
    firstName: string;
    lastName: string;
    dob: Date;
    gender: string;
    phone: string;
    email?: string;
    nationalId: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  }) {
    try {
      // Check for duplicates
      const hasDuplicates = await this.checkForDuplicates(patientData);
      if (hasDuplicates) {
        throw new Error('Patient with similar information already exists');
      }

      // Generate unique MRN
      let mrn: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        mrn = this.generateMRN();
        const existing = await prisma.patient.findUnique({
          where: { mrn }
        });
        if (!existing) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique MRN after multiple attempts');
      }

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          mrn,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dob: patientData.dob,
          gender: patientData.gender,
          phone: patientData.phone,
          email: patientData.email,
          nationalId: patientData.nationalId || '',
          address: patientData.address,
          bloodGroup: patientData.bloodGroup,
          emergencyContact: patientData.emergencyContact,
        }
      });

      return patient;
    } catch (error) {
      console.error('Error registering patient:', error);
      throw error;
    }
  }

  /**
   * Search patients with multiple criteria and archive status
   */
  static async searchPatients(searchTerm: string = '', options?: { status?: 'active' | 'archived' | 'all' }) {
    try {
      const status = options?.status || 'active';
      const where: any = {};

      if (status === 'active') {
        where.isArchived = false;
      } else if (status === 'archived') {
        where.isArchived = true;
      }

      if (searchTerm && searchTerm.trim() !== '') {
        where.OR = [
          { mrn: { contains: searchTerm.trim(), mode: 'insensitive' } },
          { firstName: { contains: searchTerm.trim(), mode: 'insensitive' } },
          { lastName: { contains: searchTerm.trim(), mode: 'insensitive' } },
          { phone: { contains: searchTerm.trim() } },
          { email: { contains: searchTerm.trim(), mode: 'insensitive' } },
          { nationalId: { contains: searchTerm.trim(), mode: 'insensitive' } },
        ];
      }

      const patients = await prisma.patient.findMany({
        where,
        orderBy: {
          lastActivityAt: 'desc',
        },
        take: 50,
      });

      return patients;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * Get patients with filtering and status counts
   */
  static async getPatients(options?: {
    search?: string;
    status?: 'active' | 'archived' | 'all';
    page?: number;
    limit?: number;
  }) {
    try {
      const search = options?.search?.trim() || '';
      const status = options?.status || 'all';
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (status === 'active') {
        where.isArchived = false;
      } else if (status === 'archived') {
        where.isArchived = true;
      }

      if (search) {
        where.OR = [
          { mrn: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { nationalId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [patients, totalMatching, totalAll, activeCount, archivedCount] = await Promise.all([
        prisma.patient.findMany({
          where,
          include: {
            allergies: true,
          },
          orderBy: {
            lastActivityAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.patient.count({ where }),
        prisma.patient.count(),
        prisma.patient.count({ where: { isArchived: false } }),
        prisma.patient.count({ where: { isArchived: true } }),
      ]);

      return {
        patients,
        total: totalMatching,
        totalAll,
        activeCount,
        archivedCount,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  /**
   * Get patient by MRN
   */
  static async getPatientByMRN(mrn: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { mrn },
        include: {
          allergies: true,
          appointments: {
            orderBy: {
              scheduledAt: 'desc'
            },
            take: 5
          },
          encounters: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      });

      return patient;
    } catch (error) {
      console.error('Error getting patient by MRN:', error);
      throw error;
    }
  }

  /**
   * Update patient information
   */
  static async updatePatient(mrn: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  }) {
    try {
      const patient = await prisma.patient.update({
        where: { mrn },
        data: {
          ...updateData,
          lastActivityAt: new Date()
        }
      });

      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Soft delete patient (archive) by ID or MRN
   */
  static async archivePatient(identifier: string) {
    try {
      const patient = await prisma.patient.update({
        where: identifier.startsWith('MRN-') ? { mrn: identifier } : { id: identifier },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      return patient;
    } catch (error) {
      console.error('Error archiving patient:', error);
      throw error;
    }
  }

  /**
   * Restore archived patient by ID or MRN
   */
  static async restorePatient(identifier: string) {
    try {
      const patient = await prisma.patient.update({
        where: identifier.startsWith('MRN-') ? { mrn: identifier } : { id: identifier },
        data: {
          isArchived: false,
          archivedAt: null,
          lastActivityAt: new Date(),
        },
      });

      return patient;
    } catch (error) {
      console.error('Error restoring patient:', error);
      throw error;
    }
  }

  /**
   * Get patient timeline (all activities)
   */
  static async getPatientTimeline(mrn: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { mrn },
        include: {
          appointments: {
            include: {
              encounter: true
            },
            orderBy: {
              scheduledAt: 'desc'
            }
          },
          encounters: {
            include: {
              vitals: true,
              labOrders: {
                include: {
                  results: {
                    include: {
                      labTest: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          invoices: {
            include: {
              items: true,
              payments: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Create a unified timeline
      const timeline: any[] = [];

      // Add appointments
      patient.appointments.forEach(apt => {
        timeline.push({
          type: 'appointment',
          date: apt.scheduledAt,
          data: apt
        });
      });

      // Add encounters
      patient.encounters.forEach(encounter => {
        timeline.push({
          type: 'encounter',
          date: encounter.createdAt,
          data: encounter
        });
      });

      // Add invoices
      patient.invoices.forEach(invoice => {
        timeline.push({
          type: 'invoice',
          date: invoice.createdAt,
          data: invoice
        });
      });

      // Sort by date (most recent first)
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      return timeline;
    } catch (error) {
      console.error('Error getting patient timeline:', error);
      throw error;
    }
  }
}