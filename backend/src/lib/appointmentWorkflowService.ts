import { prisma } from './prisma';

/**
 * Appointment Workflow Service
 * Handles appointment status transitions, rescheduling, and cancellation
 */

export class AppointmentWorkflowService {
  /**
   * Transition appointment status with validation
   */
  static async transitionStatus(appointmentId: string, newStatus: string, userId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          encounter: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'SCHEDULED': ['CHECKED_IN', 'CANCELLED'],
        'CHECKED_IN': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': []
      };

      if (!validTransitions[appointment.status].includes(newStatus)) {
        throw new Error(`Cannot transition from ${appointment.status} to ${newStatus}`);
      }

      // Update appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: newStatus as any }
      });

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: appointment.patientId }
      });

      // Create notification for the transition
      await prisma.notification.create({
        data: {
          userId: appointment.doctorId,
          type: 'APPOINTMENT_STATUS_CHANGE',
          title: `Appointment ${newStatus}`,
          message: `Appointment ${patient ? `with ${patient.firstName} ${patient.lastName}` : ''} is now ${newStatus}`,
          data: JSON.stringify({
            appointmentId: appointment.id,
            oldStatus: appointment.status,
            newStatus: newStatus,
            changedBy: userId
          })
        }
      });

      // Auto-create encounter when checking in
      if (newStatus === 'CHECKED_IN' && !appointment.encounter) {
        const encounter = await prisma.encounter.create({
          data: {
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointmentId: appointment.id,
            visitStatus: 'TRIAGE',
            chiefComplaint: appointment.reason || 'Scheduled appointment'
          }
        });

        return { appointment: updatedAppointment, encounter };
      }

      return { appointment: updatedAppointment };
    } catch (error) {
      console.error('Error transitioning appointment status:', error);
      throw error;
    }
  }

  /**
   * Reschedule appointment with conflict checking
   */
  static async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: Date,
    reason: string,
    userId: string
  ) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if appointment can be rescheduled
      if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
        throw new Error('Cannot reschedule completed or cancelled appointments');
      }

      // Check for conflicts
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          scheduledAt: newScheduledAt,
          status: { not: 'CANCELLED' },
          NOT: { id: appointmentId }
        }
      });

      if (conflictingAppointment) {
        throw new Error('Time slot is already booked');
      }

      // Reschedule appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledAt: newScheduledAt,
          cancelledReason: reason
        }
      });

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: appointment.patientId }
      });

      // Create notifications
      await prisma.notification.create({
        data: {
          userId: appointment.doctorId,
          type: 'APPOINTMENT_RESCHEDULED',
          title: 'Appointment Rescheduled',
          message: `Appointment ${patient ? `with ${patient.firstName} ${patient.lastName}` : ''} has been rescheduled to ${newScheduledAt.toLocaleString()}`,
          data: JSON.stringify({
            appointmentId: appointment.id,
            oldTime: appointment.scheduledAt,
            newTime: newScheduledAt,
            reason
          })
        }
      });

      return updatedAppointment;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment with reason
   */
  static async cancelAppointment(appointmentId: string, reason: string, userId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          encounter: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if appointment can be cancelled
      if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
        throw new Error('Cannot cancel completed or already cancelled appointments');
      }

      // Cancel appointment
      const cancelledAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledReason: reason
        }
      });

      // Cancel associated encounter if exists
      if (appointment.encounter) {
        await prisma.encounter.update({
          where: { id: appointment.encounter.id },
          data: {
            chiefComplaint: 'Cancelled - ' + (appointment.reason || 'No reason')
          }
        });
      }

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: appointment.patientId }
      });

      // Create notifications
      await prisma.notification.create({
        data: {
          userId: appointment.doctorId,
          type: 'APPOINTMENT_CANCELLED',
          title: 'Appointment Cancelled',
          message: `Appointment ${patient ? `with ${patient.firstName} ${patient.lastName}` : ''} has been cancelled`,
          data: JSON.stringify({
            appointmentId: appointment.id,
            reason,
            cancelledBy: userId
          })
        }
      });

      return cancelledAppointment;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointment history with status changes
   */
  static async getAppointmentHistory(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          encounter: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get notifications related to this appointment
      const notifications = await prisma.notification.findMany({
        where: {
          type: { in: ['APPOINTMENT_STATUS_CHANGE', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_CANCELLED'] },
          data: { contains: appointmentId }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        appointment,
        history: notifications.map(n => ({
          type: n.type,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          data: JSON.parse(n.data || '{}')
        }))
      };
    } catch (error) {
      console.error('Error getting appointment history:', error);
      throw error;
    }
  }

  /**
   * Create appointment reminder
   */
  static async createReminder(appointmentId: string, reminderMinutes: number) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const reminderTime = new Date(appointment.scheduledAt.getTime() - reminderMinutes * 60000);

      // Get patient for notification
      const patient = await prisma.patient.findUnique({
        where: { id: appointment.patientId }
      });

      // Create reminder notification
      const reminder = await prisma.notification.create({
        data: {
          userId: appointment.doctorId,
          type: 'APPOINTMENT_REMINDER',
          title: 'Appointment Reminder',
          message: `Reminder: Appointment ${patient ? `with ${patient.firstName} ${patient.lastName}` : ''} at ${appointment.scheduledAt.toLocaleString()}`,
          data: JSON.stringify({
            appointmentId: appointment.id,
            scheduledAt: appointment.scheduledAt,
            reminderMinutes
          })
        }
      });

      return reminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a doctor
   */
  static async getUpcomingAppointments(doctorId: string, days: number = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorId,
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['SCHEDULED', 'CHECKED_IN'] }
        },
        include: {
          patient: true
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      });

      return appointments;
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }
}