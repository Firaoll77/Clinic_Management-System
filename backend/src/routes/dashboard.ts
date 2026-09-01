import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { VisitRoutingService } from '../lib/visitRouting';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Total patients
    const totalPatients = await prisma.patient.count({
      where: { isArchived: false },
    });

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    // Active doctors
    const activeDoctors = await prisma.user.count({
      where: {
        role: 'DOCTOR',
        isActive: true,
      },
    });

    // Pending tasks (cancelled appointments)
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        status: 'CANCELLED',
        scheduledAt: {
          gte: startOfDay,
        },
      },
    });

    const pendingTasks = cancelledAppointments;

    // Recent patients (last 7 days)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentPatients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: weekAgo,
        },
        isArchived: false,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    // Patient growth (compare with last month)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const patientsLastMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: weekAgo,
        },
      },
    });

    const patientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
    });

    const patientGrowth = patientsLastMonth > 0 
      ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth * 100).toFixed(1)
      : '0';

    // Appointment growth
    const lastMonthAppointments = await prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: lastMonth,
          lt: weekAgo,
        },
      },
    });

    const todayAppointmentsLastMonth = await prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: new Date(new Date(lastMonth).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(lastMonth).setHours(23, 59, 59, 999)),
        },
      },
    });

    const appointmentGrowth = todayAppointmentsLastMonth > 0
      ? ((todayAppointments - todayAppointmentsLastMonth) / todayAppointmentsLastMonth * 100).toFixed(1)
      : '0';

    res.json({
      stats: {
        totalPatients,
        todayAppointments,
        activeDoctors,
        pendingTasks,
        patientGrowth: `${patientGrowth}%`,
        appointmentGrowth: `${appointmentGrowth}%`,
      },
      recentPatients: recentPatients.map((patient) => ({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        status: 'Active',
        time: `${Math.floor((today.getTime() - patient.createdAt.getTime()) / (1000 * 60 * 60))} hours ago`,
      })),
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: 'An error occurred while fetching dashboard statistics',
    });
  }
});

/**
 * GET /api/dashboard/doctor-patients
 * Get patients for doctor dashboard (DOCTOR_CONSULT and LAB_READY status)
 */
router.get('/doctor-patients', authenticate, async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.userId;
    
    // Get patients in DOCTOR_CONSULT status
    const consultationPatients = await VisitRoutingService.getDoctorConsultationPatients(doctorId);
    
    // Get patients with LAB_READY status (results ready for review)
    const labReadyPatients = await VisitRoutingService.getLabReadyPatients(doctorId);

    res.json({
      consultationPatients,
      labReadyPatients,
    });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch doctor patients',
      message: 'An error occurred while fetching doctor patients',
    });
  }
});

/**
 * GET /api/dashboard/lab-patients
 * Get patients for lab technician dashboard (LAB_PENDING status)
 */
router.get('/lab-patients', authenticate, async (req: Request, res: Response) => {
  try {
    const labPatients = await VisitRoutingService.getLabPendingPatients();

    res.json({ labPatients });
  } catch (error) {
    console.error('Get lab patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch lab patients',
      message: 'An error occurred while fetching lab patients',
    });
  }
});

/**
 * GET /api/dashboard/nurse-patients
 * Get patients for nurse dashboard (TRIAGE status)
 */
router.get('/nurse-patients', authenticate, async (req: Request, res: Response) => {
  try {
    const triagePatients = await VisitRoutingService.getTriagePatients();

    res.json({ triagePatients });
  } catch (error) {
    console.error('Get nurse patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch nurse patients',
      message: 'An error occurred while fetching nurse patients',
    });
  }
});

/**
 * GET /api/dashboard/billing-patients
 * Get patients for receptionist dashboard (BILLING status)
 */
router.get('/billing-patients', authenticate, async (req: Request, res: Response) => {
  try {
    const billingPatients = await VisitRoutingService.getBillingPatients();

    res.json({ billingPatients });
  } catch (error) {
    console.error('Get billing patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch billing patients',
      message: 'An error occurred while fetching billing patients',
    });
  }
});

/**
 * GET /api/dashboard/reception-patients
 * Get all active patients for reception dashboard
 */
router.get('/reception-patients', authenticate, async (req: Request, res: Response) => {
  try {
    const activePatients = await VisitRoutingService.getAllActivePatients();

    res.json({ activePatients });
  } catch (error) {
    console.error('Get reception patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch reception patients',
      message: 'An error occurred while fetching reception patients',
    });
  }
});

/**
 * POST /api/dashboard/update-visit-status
 * Update visit status (state change endpoint)
 */
router.post('/update-visit-status', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId, action } = req.body;
    const userId = req.user?.userId;

    switch (action) {
      case 'complete_triage':
        await VisitRoutingService.completeTriage(encounterId, userId || '');
        break;
      case 'complete_consultation':
        await VisitRoutingService.completeConsultation(encounterId);
        break;
      case 'continue_after_lab':
        await VisitRoutingService.continueAfterLabReview(encounterId, req.body.nextStatus || 'DOCTOR_CONSULT');
        break;
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'The specified action is not recognized',
        });
    }

    res.json({
      message: 'Visit status updated successfully',
    });
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({
      error: 'Failed to update visit status',
      message: 'An error occurred while updating visit status',
    });
  }
});

export default router;