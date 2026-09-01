import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { FeeService, FeeType } from '../lib/feeService';

const router = Router();

// Middleware to authenticate all routes
router.use(authenticate);

// Get available doctors
router.get('/doctors/available', async (req, res) => {
  try {
    const currentDay = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    // First get all doctors with isAvailable = true (simplified check)
    const availableDoctors = await prisma.staffProfile.findMany({
      where: {
        user: {
          role: 'DOCTOR',
          isActive: true,
        },
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        doctorAvailability: {
          where: {
            weekday: currentDay,
          },
        },
      },
    });

    res.json({ doctors: availableDoctors });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ error: 'Failed to fetch available doctors' });
  }
});

// Get available lab technicians
router.get('/lab-techs/available', async (req, res) => {
  try {
    const currentDay = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    // First get all lab technicians with isAvailable = true (simplified check)
    const availableLabTechs = await prisma.staffProfile.findMany({
      where: {
        user: {
          role: 'LAB_TECH',
          isActive: true,
        },
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.json({ labTechs: availableLabTechs });
  } catch (error) {
    console.error('Error fetching available lab technicians:', error);
    res.status(500).json({ error: 'Failed to fetch available lab technicians' });
  }
});

// Get available nurses
router.get('/nurses/available', async (req, res) => {
  try {
    const currentDay = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    // First get all nurses with isAvailable = true (simplified check)
    const availableNurses = await prisma.staffProfile.findMany({
      where: {
        user: {
          role: 'NURSE',
          isActive: true,
        },
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        nurseAvailability: {
          where: {
            weekday: currentDay,
          },
        },
      },
    });

    res.json({ nurses: availableNurses });
  } catch (error) {
    console.error('Error fetching available nurses:', error);
    res.status(500).json({ error: 'Failed to fetch available nurses' });
  }
});

// Get available doctors
router.get('/doctors/available', async (req, res) => {
  try {
    const currentDay = new Date().getDay();
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    // Simplified check - just check isAvailable = true
    const availableDoctors = await prisma.staffProfile.findMany({
      where: {
        user: {
          role: 'DOCTOR',
          isActive: true,
        },
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        doctorAvailability: {
          where: {
            weekday: currentDay,
          },
        },
      },
    });

    res.json({ doctors: availableDoctors });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ error: 'Failed to fetch available doctors' });
  }
});

// Assign nurse to patient (Receptionist action)
router.post('/nurse/assign', async (req, res) => {
  try {
    const { encounterId, nurseId } = req.body;
    const userId = req.user?.userId;

    console.log('Assigning nurse:', { encounterId, nurseId, userId });

    // Verify encounter exists
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true },
    });

    if (!encounter) {
      console.error('Encounter not found:', encounterId);
      return res.status(404).json({ error: 'Encounter not found' });
    }

    // Check if nurse is available
    const nurse = await prisma.staffProfile.findUnique({
      where: { id: nurseId },
      include: { user: true },
    });

    console.log('Nurse found:', { nurse, isAvailable: nurse?.isAvailable, role: nurse?.user?.role });

    if (!nurse || !nurse.isAvailable || nurse.user.role !== 'NURSE') {
      console.error('Nurse not available:', { nurse, isAvailable: nurse?.isAvailable, role: nurse?.user?.role });
      return res.status(400).json({ error: 'Nurse is not available or not found' });
    }

    // Create nurse assignment
    const assignment = await prisma.nurseAssignment.create({
      data: {
        encounterId,
        nurseId,
        assignedBy: userId || '',
        status: 'PENDING',
      },
      include: {
        encounter: {
          include: {
            patient: true,
          },
        },
      },
    });

    console.log('Assignment created:', assignment);

    // Update encounter status
    await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        nurseId,
        visitStatus: 'NURSE_EXAMINATION',
      },
    });

    // Log triage fee when nurse is assigned
    try {
      await FeeService.logEncounterFee(
        encounterId,
        FeeType.TRIAGE,
        userId || 'system'
      );
    } catch (feeError) {
      console.error('Failed to log triage fee:', feeError);
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Error assigning nurse:', error);
    res.status(500).json({ error: 'Failed to assign nurse' });
  }
});

// Get nurse assignments for current nurse
router.get('/nurse/my-assignments', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const assignments = await prisma.nurseAssignment.findMany({
      where: {
        nurseId: staffProfile.id,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      include: {
        encounter: {
          include: {
            patient: true,
            vitals: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching nurse assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Accept/reject nurse assignment
router.post('/nurse/assignment/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'accept' or 'reject'
    const userId = req.user?.userId;

    const assignment = await prisma.nurseAssignment.findUnique({
      where: { id },
      include: { encounter: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (action === 'accept') {
      await prisma.nurseAssignment.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
    } else if (action === 'reject') {
      await prisma.nurseAssignment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      // Reset encounter status
      await prisma.encounter.update({
        where: { id: assignment.encounterId },
        data: {
          nurseId: null,
          visitStatus: 'TRIAGE',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error responding to assignment:', error);
    res.status(500).json({ error: 'Failed to respond to assignment' });
  }
});

// Accept/reject lab technician assignment
router.post('/lab-tech/assignment/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'accept' or 'reject'
    const userId = req.user?.userId;

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: { labOrder: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (action === 'accept') {
      await prisma.labAssignment.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
    } else if (action === 'reject') {
      await prisma.labAssignment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      // Reset lab order status
      await prisma.labOrder.update({
        where: { id: (assignment as any).labOrderId },
        data: {
          status: 'ORDERED',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error responding to lab assignment:', error);
    res.status(500).json({ error: 'Failed to respond to assignment' });
  }
});

// Assign lab technician to lab order (Doctor action)
router.post('/lab-tech/assign', async (req, res) => {
  try {
    const { labOrderId, labTechId } = req.body;
    const userId = req.user?.userId;

    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    });

    if (!labOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    const labTech = await prisma.staffProfile.findUnique({
      where: { id: labTechId },
      include: { user: true },
    });

    if (!labTech || !labTech.isAvailable || labTech.user.role !== 'LAB_TECH') {
      return res.status(400).json({ error: 'Lab technician is not available or not found' });
    }

    const assignment = await prisma.labAssignment.create({
      data: {
        labOrderId,
        labTechId,
        assignedBy: userId || '',
        status: 'PENDING',
      },
      include: {
        labOrder: {
          include: {
            encounter: {
              include: {
                patient: true,
              },
            },
          },
        },
      },
    });

    res.json({ assignment });
  } catch (error) {
    console.error('Error assigning lab technician:', error);
    res.status(500).json({ error: 'Failed to assign lab technician' });
  }
});

// Get lab assignments for current lab technician
router.get('/lab-tech/my-assignments', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const assignments = await prisma.labAssignment.findMany({
      where: {
        labTechId: staffProfile.id,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      include: {
        labOrder: {
          include: {
            encounter: {
              include: {
                patient: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching lab assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});


// Complete nurse examination and assign to doctor
router.post('/nurse/examination/complete', async (req, res) => {
  try {
    const { encounterId, doctorId, subjective, objective, vitals } = req.body;
    const userId = req.user?.userId;

    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    // Check if doctor is available
    const doctor = await prisma.staffProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor || !doctor.isAvailable || doctor.user.role !== 'DOCTOR') {
      return res.status(400).json({ error: 'Doctor is not available or not found' });
    }

    // Update encounter with examination data
    await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        subjective,
        objective,
        doctorId,
        visitStatus: 'WAITING_FOR_DOCTOR',
      },
    });

    // Save vitals if provided
    if (vitals) {
      await prisma.vital.create({
        data: {
          encounterId,
          ...vitals,
          recordedBy: userId,
        },
      });
    }

    // Log nurse examination fee
    try {
      await FeeService.logEncounterFee(
        encounterId,
        FeeType.NURSE_EXAMINATION,
        userId || 'system'
      );
    } catch (feeError) {
      console.error('Failed to log nurse examination fee:', feeError);
    }

    // Complete nurse assignment
    await prisma.nurseAssignment.updateMany({
      where: {
        encounterId,
        nurseId: staffProfile.id,
        status: 'ACCEPTED',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Create doctor assignment
    const doctorAssignment = await prisma.doctorAssignment.create({
      data: {
        encounterId,
        doctorId,
        assignedBy: userId || '',
      },
    });

    res.json({ doctorAssignment });
  } catch (error) {
    console.error('Error completing examination:', error);
    res.status(500).json({ error: 'Failed to complete examination' });
  }
});

// Get doctor assignments for current doctor
router.get('/doctor/my-assignments', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const assignments = await prisma.doctorAssignment.findMany({
      where: {
        doctorId: staffProfile.id,
        status: 'PENDING',
      },
      include: {
        encounter: {
          include: {
            patient: true,
            vitals: true,
            nurseAssignments: {
              include: {
                encounter: {
                  include: {
                    patient: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching doctor assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Accept/reject doctor assignment
router.post('/doctor/assignment/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'accept' or 'reject'
    const userId = req.user?.userId;

    const assignment = await prisma.doctorAssignment.findUnique({
      where: { id },
      include: { encounter: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (action === 'accept') {
      await prisma.doctorAssignment.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Update encounter status
      await prisma.encounter.update({
        where: { id: assignment.encounterId },
        data: {
          visitStatus: 'DOCTOR_CONSULT',
        },
      });

      // Log doctor consultation fee
      try {
        await FeeService.logEncounterFee(
          assignment.encounterId,
          FeeType.DOCTOR_CONSULTATION,
          userId || 'system'
        );
      } catch (feeError) {
        console.error('Failed to log doctor consultation fee:', feeError);
      }
    } else if (action === 'reject') {
      await prisma.doctorAssignment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      // Reset encounter status
      await prisma.encounter.update({
        where: { id: assignment.encounterId },
        data: {
          doctorId: null,
          visitStatus: 'WAITING_FOR_DOCTOR',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error responding to assignment:', error);
    res.status(500).json({ error: 'Failed to respond to assignment' });
  }
});

// Toggle staff availability
router.post('/staff/toggle-availability', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { isAvailable } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const staffProfile = await prisma.staffProfile.update({
      where: { userId },
      data: { isAvailable },
    });

    res.json({ staffProfile });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
});

export default router;
