import { prisma } from './prisma';

/**
 * Encounter Service
 * Handles encounter management, vitals recording, SOAP notes, and diagnosis
 */

export class EncounterService {
  /**
   * Create a new encounter
   */
  static async createEncounter(encounterData: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    visitStatus: string;
    chiefComplaint: string;
  }) {
    try {
      const data: any = {
        patientId: encounterData.patientId,
        doctorId: encounterData.doctorId,
        visitStatus: encounterData.visitStatus as any,
        chiefComplaint: encounterData.chiefComplaint
      };

      if (encounterData.appointmentId) {
        data.appointmentId = encounterData.appointmentId;
      }

      const encounter = await prisma.encounter.create({
        data: data
      });

      // Update patient last activity
      await prisma.patient.update({
        where: { id: encounterData.patientId },
        data: { lastActivityAt: new Date() }
      });

      return encounter;
    } catch (error) {
      console.error('Error creating encounter:', error);
      throw error;
    }
  }

  /**
   * Record patient vitals
   */
  static async recordVitals(encounterId: string, vitalsData: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    notes?: string;
  }) {
    try {
      const vitals = await prisma.vital.create({
        data: {
          encounterId,
          temperatureC: vitalsData.temperature,
          systolic: vitalsData.bloodPressureSystolic,
          diastolic: vitalsData.bloodPressureDiastolic,
          pulse: vitalsData.heartRate,
          respRate: vitalsData.respiratoryRate,
          spo2: vitalsData.oxygenSaturation,
          weightKg: vitalsData.weight,
          heightCm: vitalsData.height,
          bmi: vitalsData.bmi,
          recordedBy: vitalsData.notes || 'system'
        }
      });

      return vitals;
    } catch (error) {
      console.error('Error recording vitals:', error);
      throw error;
    }
  }

  /**
   * Update vitals
   */
  static async updateVitals(vitalsId: string, vitalsData: any) {
    try {
      const vitals = await prisma.vital.update({
        where: { id: vitalsId },
        data: vitalsData
      });

      return vitals;
    } catch (error) {
      console.error('Error updating vitals:', error);
      throw error;
    }
  }

  /**
   * Add SOAP note
   */
  static async addSOAPNote(encounterId: string, soapData: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }) {
    try {
      const encounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          subjective: soapData.subjective,
          objective: soapData.objective,
          assessment: soapData.assessment,
          plan: soapData.plan
        }
      });

      return encounter;
    } catch (error) {
      console.error('Error adding SOAP note:', error);
      throw error;
    }
  }

  /**
   * Add diagnosis (ICD-10 codes)
   */
  static async addDiagnosis(encounterId: string, diagnosisData: {
    code: string;
    description: string;
    isPrimary: boolean;
    notes?: string;
  }) {
    try {
      const encounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          icd10Code: diagnosisData.code
        }
      });

      return encounter;
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      throw error;
    }
  }

  /**
   * Update encounter visit status
   */
  static async updateVisitStatus(encounterId: string, newStatus: string) {
    try {
      const encounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: { visitStatus: newStatus as any }
      });

      return encounter;
    } catch (error) {
      console.error('Error updating visit status:', error);
      throw error;
    }
  }

  /**
   * Get encounter with all details
   */
  static async getEncounter(encounterId: string) {
    try {
      const encounter = await prisma.encounter.findUnique({
        where: { id: encounterId },
        include: {
          patient: {
            include: {
              allergies: true
            }
          },
          vitals: true,
          labOrders: {
            include: {
              results: {
                include: {
                  labTest: true
                }
              }
            }
          },
          appointment: true
        }
      });

      return encounter;
    } catch (error) {
      console.error('Error getting encounter:', error);
      throw error;
    }
  }

  /**
   * Get patient encounter history
   */
  static async getPatientEncounters(patientId: string, limit: number = 20) {
    try {
      const encounters = await prisma.encounter.findMany({
        where: { patientId },
        include: {
          vitals: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return encounters;
    } catch (error) {
      console.error('Error getting patient encounters:', error);
      throw error;
    }
  }

  /**
   * Sign off encounter
   */
  static async signOffEncounter(encounterId: string, doctorId: string) {
    try {
      const encounter = await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: 'COMPLETED',
          signedAt: new Date(),
          signedBy: doctorId
        }
      });

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: encounter.patientId }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: doctorId,
          type: 'ENCOUNTER_SIGNED_OFF',
          title: 'Encounter Signed Off',
          message: `Encounter ${patient ? `with ${patient.firstName} ${patient.lastName}` : ''} has been signed off`,
          data: JSON.stringify({ encounterId: encounter.id })
        }
      });

      return encounter;
    } catch (error) {
      console.error('Error signing off encounter:', error);
      throw error;
    }
  }

  /**
   * Get active encounters for a doctor
   */
  static async getActiveEncounters(doctorId: string) {
    try {
      const encounters = await prisma.encounter.findMany({
        where: {
          doctorId,
          visitStatus: { not: 'COMPLETED' }
        },
        include: {
          patient: true,
          vitals: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return encounters;
    } catch (error) {
      console.error('Error getting active encounters:', error);
      throw error;
    }
  }
}