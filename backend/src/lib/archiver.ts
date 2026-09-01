import { prisma } from './prisma';
import { createFieldChangeAuditLog } from './audit';
import { createPatientArchivedNotification } from './notifications';

/**
 * Archive patients who haven't had activity in 7 days
 * This should be run weekly (e.g., via cron job)
 */
export async function archiveInactivePatients() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find patients with no activity in the last 7 days
    const inactivePatients = await prisma.patient.findMany({
      where: {
        isArchived: false,
        lastActivityAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    if (inactivePatients.length === 0) {
      console.log('No inactive patients to archive');
      return { archived: 0, patients: [] };
    }

    // Archive each patient
    const archivedPatients = [];
    for (const patient of inactivePatients) {
      const archived = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      // Create audit log (system action - no user)
      await createFieldChangeAuditLog(
        'SYSTEM',
        'SYSTEM',
        'PATIENT',
        patient.id,
        'isArchived',
        false,
        true
      );

      // Create notification
      await createPatientArchivedNotification(
        patient.id,
        `${patient.firstName} ${patient.lastName}`,
        'SYSTEM'
      );

      archivedPatients.push(archived);
    }

    console.log(`Archived ${archivedPatients.length} inactive patients`);

    return {
      archived: archivedPatients.length,
      patients: archivedPatients,
    };
  } catch (error) {
    console.error('Error archiving inactive patients:', error);
    throw error;
  }
}

/**
 * Manual archive endpoint handler
 */
export async function manualArchivePatient(patientId: string, archivedBy: string, archivedByRole: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    if (patient.isArchived) {
      throw new Error('Patient is already archived');
    }

    const archived = await prisma.patient.update({
      where: { id: patientId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    // Create audit log
    await createFieldChangeAuditLog(
      archivedBy,
      archivedByRole,
      'PATIENT',
      patientId,
      'isArchived',
      false,
      true
    );

    // Create notification
    await createPatientArchivedNotification(
      patientId,
      `${patient.firstName} ${patient.lastName}`,
      archivedByRole
    );

    return archived;
  } catch (error) {
    console.error('Error manually archiving patient:', error);
    throw error;
  }
}

/**
 * Reactivate an archived patient (Admin only)
 */
export async function reactivatePatient(patientId: string, reactivatedBy: string, reactivatedByRole: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    if (!patient.isArchived) {
      throw new Error('Patient is not archived');
    }

    const reactivated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        isArchived: false,
        archivedAt: null,
        lastActivityAt: new Date(),
      },
    });

    // Create audit log
    await createFieldChangeAuditLog(
      reactivatedBy,
      reactivatedByRole,
      'PATIENT',
      patientId,
      'isArchived',
      true,
      false
    );

    return reactivated;
  } catch (error) {
    console.error('Error reactivating patient:', error);
    throw error;
  }
}
