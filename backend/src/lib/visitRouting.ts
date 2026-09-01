import { prisma } from './prisma';
import { VisitStatus } from '@prisma/client';

/**
 * Visit Routing Service
 * Provides room-to-room routing queries based on visit status
 * Controls what each role sees on their dashboards
 */

export class VisitRoutingService {
  /**
   * DOCTOR QUERY: Fetch only patients where visit_status = 'DOCTOR_CONSULT'
   * Returns patients currently in doctor consultation phase
   */
  static async getDoctorConsultationPatients(doctorId?: string) {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: VisitStatus.DOCTOR_CONSULT,
        ...(doctorId && { doctorId: doctorId }) // Filter by specific doctor if provided
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
            phone: true,
            bloodGroup: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            durationMin: true,
            reason: true,
          },
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 1, // Get most recent vitals
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * LAB TECH QUERY: Fetch only patients where visit_status = 'LAB_PENDING'
   * Returns patients whose lab tests have been ordered and are pending processing
   */
  static async getLabPendingPatients() {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: VisitStatus.LAB_PENDING,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
            phone: true,
          },
        },
        labOrders: {
          where: {
            status: { in: ['ORDERED', 'IN_PROGRESS'] }
          },
          include: {
            results: {
              include: {
                labTest: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * STATE CHANGE LOGIC: Lab technician saves results
   * This function executes when the lab technician saves results.
   * It must:
   * 1. Save the numeric data
   * 2. Update the specific lab order status to 'COMPLETED'
   * 3. Change the overall visit_status back to 'LAB_READY' so it triggers an alert on the doctor's screen
   */
  static async completeLabOrder(labOrderId: string, labTechId: string): Promise<void> {
    try {
      // Update all results for this lab order with the technician's ID
      await prisma.labResult.updateMany({
        where: { labOrderId: labOrderId },
        data: {
          enteredBy: labTechId,
          enteredAt: new Date(),
        },
      });

      // Update lab order status to COMPLETED
      await prisma.labOrder.update({
        where: { id: labOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Get the encounter to check if all lab orders are completed
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: labOrderId },
        include: {
          encounter: {
            include: {
              labOrders: true,
            },
          },
        },
      });

      if (!labOrder) {
        throw new Error('Lab order not found');
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: labTechId,
          action: 'COMPLETE_LAB_ORDER',
          entityType: 'LAB_ORDER',
          entityId: labOrderId,
          details: `Lab order completed by technician`,
        },
      });

      // Check if all lab orders for this encounter are completed
      const allLabOrdersCompleted = labOrder.encounter.labOrders.every(
        (order) => order.status === 'COMPLETED'
      );

      // If all lab orders are completed, change visit status to LAB_READY
      if (allLabOrdersCompleted) {
        await prisma.encounter.update({
          where: { id: labOrder.encounterId },
          data: {
            visitStatus: VisitStatus.LAB_READY,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: labTechId,
            action: 'STATUS_CHANGE',
            entityType: 'ENCOUNTER',
            entityId: labOrder.encounterId,
            details: `Visit status changed to LAB_READY - all lab orders completed`,
          },
        });

        console.log(`Visit status changed to LAB_READY for encounter ${labOrder.encounterId}`);
      }
    } catch (error) {
      console.error('Error completing lab order:', error);
      throw error;
    }
  }

  /**
   * NURSE QUERY: Fetch patients in TRIAGE status for vital sign collection
   */
  static async getTriagePatients() {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: VisitStatus.TRIAGE,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            reason: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * STATE CHANGE: Nurse completes triage (vitals collection)
   * Changes visit status from TRIAGE to DOCTOR_CONSULT
   */
  static async completeTriage(encounterId: string, nurseId: string): Promise<void> {
    try {
      // Update encounter status to DOCTOR_CONSULT
      await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: VisitStatus.DOCTOR_CONSULT,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: nurseId,
          action: 'COMPLETE_TRIAGE',
          entityType: 'ENCOUNTER',
          entityId: encounterId,
          details: `Triage completed by nurse - patient sent to doctor consultation`,
        },
      });

      console.log(`Visit status changed to DOCTOR_CONSULT for encounter ${encounterId}`);
    } catch (error) {
      console.error('Error completing triage:', error);
      throw error;
    }
  }

  /**
   * RECEPTIONIST QUERY: Fetch patients in BILLING status
   */
  static async getBillingPatients() {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: VisitStatus.BILLING,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        invoices: {
          where: {
            status: { in: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID'] }
          },
          include: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * DOCTOR QUERY: Fetch patients with LAB_READY status (results ready for review)
   */
  static async getLabReadyPatients(doctorId?: string) {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: VisitStatus.LAB_READY,
        ...(doctorId && { doctorId: doctorId })
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
          },
        },
        labOrders: {
          include: {
            results: {
              include: {
                labTest: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * STATE CHANGE: Doctor reviews lab results and continues consultation
   * Changes visit status from LAB_READY back to DOCTOR_CONSULT or to BILLING
   */
  static async continueAfterLabReview(encounterId: string, nextStatus: 'DOCTOR_CONSULT' | 'BILLING', doctorId?: string): Promise<void> {
    try {
      await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: nextStatus,
        },
      });

      // Log activity
      if (doctorId) {
        await prisma.activityLog.create({
          data: {
            userId: doctorId,
            action: 'LAB_REVIEW_COMPLETE',
            entityType: 'ENCOUNTER',
            entityId: encounterId,
            details: `Doctor reviewed lab results - visit status changed to ${nextStatus}`,
          },
        });
      }

      console.log(`Visit status changed to ${nextStatus} for encounter ${encounterId}`);
    } catch (error) {
      console.error('Error continuing after lab review:', error);
      throw error;
    }
  }

  /**
   * STATE CHANGE: Doctor completes consultation, sends to billing
   * Changes visit status from DOCTOR_CONSULT to BILLING
   */
  static async completeConsultation(encounterId: string, doctorId?: string): Promise<void> {
    try {
      await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: VisitStatus.BILLING,
          signedAt: new Date(),
        },
      });

      // Log activity
      if (doctorId) {
        await prisma.activityLog.create({
          data: {
            userId: doctorId,
            action: 'COMPLETE_CONSULTATION',
            entityType: 'ENCOUNTER',
            entityId: encounterId,
            details: `Consultation completed - patient sent to billing`,
          },
        });
      }

      console.log(`Visit status changed to BILLING for encounter ${encounterId}`);
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }
  }

  /**
   * RECEPTIONIST QUERY: Get all active patients across different statuses
   * For reception dashboard overview
   */
  static async getAllActivePatients() {
    return await prisma.encounter.findMany({
      where: {
        visitStatus: {
          in: [VisitStatus.TRIAGE, VisitStatus.DOCTOR_CONSULT, VisitStatus.LAB_PENDING, VisitStatus.LAB_READY, VisitStatus.BILLING]
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            scheduledAt: true,
            reason: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get patient visit status by encounter ID
   */
  static async getVisitStatus(encounterId: string): Promise<VisitStatus | null> {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      select: { visitStatus: true },
    });
    return encounter?.visitStatus || null;
  }

  /**
   * FINAL STATE CHANGE: Complete visit when payment is received
   * Changes visit status to COMPLETED to clear patient from all active clinic dashboards
   */
  static async completeVisit(encounterId: string, receptionistId?: string): Promise<void> {
    try {
      await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: VisitStatus.COMPLETED,
        },
      });

      // Log activity
      if (receptionistId) {
        await prisma.activityLog.create({
          data: {
            userId: receptionistId,
            action: 'COMPLETE_VISIT',
            entityType: 'ENCOUNTER',
            entityId: encounterId,
            details: `Visit completed - payment received and patient checked out`,
          },
        });
      }

      console.log(`Visit status changed to COMPLETED for encounter ${encounterId}`);
    } catch (error) {
      console.error('Error completing visit:', error);
      throw error;
    }
  }
}