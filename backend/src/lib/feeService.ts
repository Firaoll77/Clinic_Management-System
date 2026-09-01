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

  /**
   * Log a fee for an encounter at a specific milestone
   */
  static async logEncounterFee(
    encounterId: string,
    feeType: string,
    loggedBy: string,
    customAmount?: number
  ) {
    // Get the fee configuration
    const feeConfig = await this.getFeeByType(feeType);
    if (!feeConfig) {
      throw new Error(`Fee configuration not found for type: ${feeType}`);
    }

    // Use custom amount if provided, otherwise use configured amount
    const amount = customAmount !== undefined ? customAmount : (feeConfig as any).amount;

    // Log the fee
    // @ts-ignore - EncounterFee model exists after migration
    const encounterFee = await prisma.encounterFee.create({
      data: {
        encounterId,
        feeType: feeType as any,
        description: (feeConfig as any).name,
        amount,
        loggedBy
      }
    });

    return encounterFee;
  }

  /**
   * Get all fees for an encounter
   */
  static async getEncounterFees(encounterId: string) {
    // @ts-ignore - EncounterFee model exists after migration
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
    const defaultFees = [
      { feeType: FeeType.REGISTRATION, name: 'Registration Fee', amount: 100.00, description: 'Initial patient registration fee' },
      { feeType: FeeType.TRIAGE, name: 'Triage Fee', amount: 50.00, description: 'Initial triage assessment' },
      { feeType: FeeType.NURSE_EXAMINATION, name: 'Nurse Examination Fee', amount: 150.00, description: 'Nurse examination and vitals' },
      { feeType: FeeType.DOCTOR_CONSULTATION, name: 'Doctor Consultation Fee', amount: 300.00, description: 'Doctor consultation' },
      { feeType: FeeType.LAB_TEST, name: 'Lab Test Fee', amount: 0.00, description: 'Lab tests (variable)' },
      { feeType: FeeType.PROCEDURE, name: 'Procedure Fee', amount: 0.00, description: 'Medical procedures (variable)' }
    ];

    for (const fee of defaultFees) {
      await this.upsertFeeConfiguration(
        fee.feeType,
        fee.name,
        fee.amount,
        fee.description
      );
    }
  }
}
