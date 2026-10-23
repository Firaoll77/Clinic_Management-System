import { prisma } from './prisma';

// Fee type enum values (matching Prisma schema)
export enum FeeType {
  REGISTRATION = 'REGISTRATION',
  TRIAGE = 'TRIAGE',
  NURSE_EXAMINATION = 'NURSE_EXAMINATION',
  DOCTOR_CONSULTATION = 'DOCTOR_CONSULTATION',
  LAB_TEST = 'LAB_TEST',
  PROCEDURE = 'PROCEDURE'
}

export class FeeService {
  /**
   * Get all fee configurations
   */
  static async getAllFeeConfigurations() {
    // @ts-ignore - FeeConfiguration model exists after migration
    return await prisma.feeConfiguration.findMany({
      where: { isActive: true },
      orderBy: { feeType: 'asc' }
    });
  }

  /**
   * Get fee configuration by type
   */
  static async getFeeByType(feeType: string) {
    // @ts-ignore - FeeConfiguration model exists after migration
    return await prisma.feeConfiguration.findUnique({
      where: { feeType: feeType as any }
    });
  }

  /**
   * Create or update fee configuration
   */
  static async upsertFeeConfiguration(feeType: string, name: string, amount: number, description?: string) {
    // @ts-ignore - FeeConfiguration model exists after migration
    return await prisma.feeConfiguration.upsert({
      where: { feeType: feeType as any },
      update: { name, amount, description },
      create: { feeType: feeType as any, name, amount, description }
    });
  }

  static readonly DEFAULT_AMOUNTS: Record<string, { name: string; amount: number; description: string }> = {
    REGISTRATION: { name: 'Registration Fee', amount: 100.00, description: 'Initial patient registration fee' },
    TRIAGE: { name: 'Triage Fee', amount: 50.00, description: 'Initial triage assessment' },
    NURSE_EXAMINATION: { name: 'Nurse Examination Fee', amount: 150.00, description: 'Nurse examination and vitals' },
    DOCTOR_CONSULTATION: { name: 'Doctor Consultation Fee', amount: 300.00, description: 'Doctor consultation' },
    LAB_TEST: { name: 'Lab Test Fee', amount: 500.00, description: 'Laboratory services' },
    PRESCRIPTION: { name: 'Prescription Fee', amount: 50.00, description: 'Prescription and medication review' },
    PROCEDURE: { name: 'Procedure Fee', amount: 200.00, description: 'Clinical procedures' }
  };

  /**
   * Log a fee for an encounter at a specific milestone
   */
  static async logEncounterFee(
    encounterId: string,
    feeType: string,
    loggedBy: string,
    customAmount?: number
  ) {
    let feeConfig = await this.getFeeByType(feeType);
    
    // Auto-create fee configuration if missing
    if (!feeConfig) {
      const defaultInfo = this.DEFAULT_AMOUNTS[feeType] || {
        name: `${feeType} Fee`,
        amount: 100.00,
        description: `${feeType} predetermined service fee`
      };
      try {
        feeConfig = await this.upsertFeeConfiguration(
          feeType,
          defaultInfo.name,
          defaultInfo.amount,
          defaultInfo.description
        );
      } catch (upsertErr) {
        console.warn(`Could not upsert default fee config for ${feeType}:`, upsertErr);
      }
    }

    const defaultFallback = this.DEFAULT_AMOUNTS[feeType]?.amount ?? 100.00;
    const defaultName = this.DEFAULT_AMOUNTS[feeType]?.name ?? `${feeType} Fee`;
    const amount = customAmount !== undefined ? customAmount : ((feeConfig as any)?.amount ?? defaultFallback);
    const description = (feeConfig as any)?.name ?? defaultName;

    // Log the fee
    const encounterFee = await prisma.encounterFee.create({
      data: {
        encounterId,
        feeType: feeType as any,
        description,
        amount,
        loggedBy
      }
    });

    // Automatically sync patient totalExpectedFees so reception dashboard shows accurate total
    try {
      const encounter = await prisma.encounter.findUnique({
        where: { id: encounterId },
        select: { patientId: true }
      });
      if (encounter?.patientId) {
        const allFees = await prisma.encounterFee.findMany({
          where: { encounter: { patientId: encounter.patientId } }
        });
        const total = allFees.reduce((acc: number, f: any) => acc + Number(f.amount), 0);
        await prisma.patient.update({
          where: { id: encounter.patientId },
          data: { totalExpectedFees: total }
        });
      }
    } catch (syncErr) {
      console.error('Failed to sync patient totalExpectedFees:', syncErr);
    }

    return encounterFee;
  }

  /**
   * Get all fees for an encounter
   */
  static async getEncounterFees(encounterId: string) {
    return await prisma.encounterFee.findMany({
      where: { encounterId },
      orderBy: { loggedAt: 'asc' }
    });
  }

  /**
   * Calculate total fees for an encounter
   */
  static async calculateEncounterTotal(encounterId: string) {
    const fees = await this.getEncounterFees(encounterId);
    return fees.reduce((total: number, fee: any) => total + Number(fee.amount), 0);
  }

  /**
   * Initialize default fee configurations
   */
  static async initializeDefaultFees() {
    for (const [key, fee] of Object.entries(this.DEFAULT_AMOUNTS)) {
      try {
        await this.upsertFeeConfiguration(
          key,
          fee.name,
          fee.amount,
          fee.description
        );
      } catch (err) {
        console.error(`Failed to initialize default fee ${key}:`, err);
      }
    }
  }
}
