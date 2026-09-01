import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { DoctorAvailabilityService } from '../lib/doctorAvailabilityService';
import { AppointmentWorkflowService } from '../lib/appointmentWorkflowService';

const router = Router();

/**
 * GET /api/appointments/available-slots/:doctorId
 * Get available time slots for a doctor on a specific date
 * This route must come before /:id to avoid parameter conflicts
 */
router.get('/available-slots/:doctorId', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Missing date parameter',
        message: 'Date is required',
      });
    }

    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Please provide a valid date',
      });
    }

    // Use DoctorAvailabilityService for accurate slot calculation
    const availableSlots = await DoctorAvailabilityService.getAvailableSlots(
      Array.isArray(doctorId) ? doctorId[0] : doctorId,
      targetDate
    );

    res.json({
      date: targetDate,
      availableSlots,
      totalSlots: availableSlots.length,
      availableCount: availableSlots.filter(slot => slot.available).length
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      error: 'Failed to fetch available slots',
      message: 'An error occurred while fetching available slots',
    });
  }
});

/**
 * GET /api/appointments
 * Get all appointments with optional filtering
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      date, 
      doctorId, 
      patientId, 
      status 
    } = req.query;

    const where: any = {};

    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (doctorId) {
      where.doctorId = doctorId as string;
    }

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        encounter: {
          select: {
            id: true,
            chiefComplaint: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      error: 'Failed to fetch appointments',
      message: 'An error occurred while fetching appointments',
    });
  }
});

/**
 * GET /api/appointments/:id
 * Get a specific appointment by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: Array.isArray(id) ? id[0] : id },
      include: {
        patient: true,
        encounter: {
          include: {
            vitals: true,
            labOrders: {
              include: {
                results: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found',
        message: 'The requested appointment does not exist',
      });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      error: 'Failed to fetch appointment',
      message: 'An error occurred while fetching the appointment',
    });
  }
});

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, scheduledAt, durationMin, reason } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'patientId, doctorId, and scheduledAt are required',
      });
    }

    // Check for conflicts
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        scheduledAt: new Date(scheduledAt),
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        error: 'Time slot conflict',
        message: 'The doctor already has an appointment at this time',
      });
    }

    // Get patient to update last activity
    await prisma.patient.update({
      where: { id: patientId },
      data: { lastActivityAt: new Date() },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt),
        durationMin: durationMin || 30,
        reason,
        createdBy: req.user?.userId,
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
      },
    });

    // Create notification for the doctor
    await prisma.notification.create({
      data: {
        userId: doctorId,
        type: 'APPOINTMENT_SCHEDULED',
        title: 'New Appointment Scheduled',
        message: `New appointment with ${appointment.patient.firstName} ${appointment.patient.lastName} on ${new Date(scheduledAt).toLocaleString()}`,
        data: JSON.stringify({ appointmentId: appointment.id }),
      },
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      error: 'Failed to create appointment',
      message: 'An error occurred while creating the appointment',
    });
  }
});

/**
 * PATCH /api/appointments/:id
 * Update an appointment
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt, durationMin, reason, cancelledReason } = req.body;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: Array.isArray(id) ? id[0] : id },
    });

    if (!existingAppointment) {
      return res.status(404).json({
        error: 'Appointment not found',
        message: 'The requested appointment does not exist',
      });
    }

    // Check for conflicts if changing time
    if (scheduledAt && scheduledAt !== existingAppointment.scheduledAt.toISOString()) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId: existingAppointment.doctorId,
          scheduledAt: new Date(scheduledAt),
          status: {
            not: 'CANCELLED',
          },
          NOT: {
            id: Array.isArray(id) ? id[0] : id,
          },
        },
      });

      if (conflict) {
        return res.status(409).json({
          error: 'Time slot conflict',
          message: 'The doctor already has an appointment at this time',
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: Array.isArray(id) ? id[0] : id },
      data: {
        ...(status && { status }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(durationMin && { durationMin }),
        ...(reason !== undefined && { reason }),
        ...(cancelledReason !== undefined && { cancelledReason }),
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
      },
    });

    // Create notification for status changes
    if (status && status !== existingAppointment.status) {
      // Get patient info for notification
      const patient = await prisma.patient.findUnique({
        where: { id: existingAppointment.patientId },
        select: { firstName: true, lastName: true },
      });
      
      await prisma.notification.create({
        data: {
          userId: existingAppointment.doctorId,
          type: 'APPOINTMENT_STATUS_CHANGE',
          title: 'Appointment Status Changed',
          message: `Appointment with ${patient?.firstName} ${patient?.lastName} status changed to ${status}`,
          data: JSON.stringify({ appointmentId: appointment.id, oldStatus: existingAppointment.status, newStatus: status }),
        },
      });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      error: 'Failed to update appointment',
      message: 'An error occurred while updating the appointment',
    });
  }
});

/**
 * DELETE /api/appointments/:id
 * Cancel/delete an appointment
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancelledReason } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id: Array.isArray(id) ? id[0] : id },
      data: {
        status: 'CANCELLED',
        cancelledReason,
      },
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      error: 'Failed to cancel appointment',
      message: 'An error occurred while cancelling the appointment',
    });
  }
});

/**
 * PATCH /api/appointments/:id/status
 * Transition appointment status
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Missing status',
        message: 'Status is required',
      });
    }

    const result = await AppointmentWorkflowService.transitionStatus(
      Array.isArray(id) ? id[0] : id,
      status,
      req.user!.userId
    );

    res.json({
      message: 'Appointment status updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Transition status error:', error);
    res.status(500).json({
      error: 'Failed to transition status',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * PATCH /api/appointments/:id/reschedule
 * Reschedule appointment
 */
router.patch('/:id/reschedule', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt, reason } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        error: 'Missing scheduledAt',
        message: 'New scheduledAt time is required',
      });
    }

    const appointment = await AppointmentWorkflowService.rescheduleAppointment(
      Array.isArray(id) ? id[0] : id,
      new Date(scheduledAt),
      reason || '',
      req.user!.userId
    );

    res.json({
      message: 'Appointment rescheduled successfully',
      appointment,
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      error: 'Failed to reschedule appointment',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * POST /api/appointments/:id/cancel
 * Cancel appointment
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await AppointmentWorkflowService.cancelAppointment(
      Array.isArray(id) ? id[0] : id,
      reason || '',
      req.user!.userId
    );

    res.json({
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      error: 'Failed to cancel appointment',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * GET /api/appointments/:id/history
 * Get appointment history
 */
router.get('/:id/history', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await AppointmentWorkflowService.getAppointmentHistory(
      Array.isArray(id) ? id[0] : id
    );

    res.json(history);
  } catch (error) {
    console.error('Get appointment history error:', error);
    res.status(500).json({
      error: 'Failed to fetch appointment history',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * POST /api/appointments/:id/reminder
 * Create appointment reminder
 */
router.post('/:id/reminder', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reminderMinutes } = req.body;

    const reminder = await AppointmentWorkflowService.createReminder(
      Array.isArray(id) ? id[0] : id,
      reminderMinutes || 30
    );

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder,
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({
      error: 'Failed to create reminder',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * GET /api/appointments/doctor/:doctorId/upcoming
 * Get upcoming appointments for a doctor
 */
router.get('/doctor/:doctorId/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { days } = req.query;

    const appointments = await AppointmentWorkflowService.getUpcomingAppointments(
      Array.isArray(doctorId) ? doctorId[0] : doctorId,
      days ? parseInt(days as string) : 7
    );

    res.json({
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      error: 'Failed to fetch upcoming appointments',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

export default router;