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

// Assign doctor to patient/encounter directly (Receptionist / Nurse / Staff action)
router.post('/doctor/assign', async (req, res) => {
  try {
    const { encounterId, doctorId } = req.body;
    const userId = req.user?.userId;

    if (!encounterId || !doctorId) {
      return res.status(400).json({ error: 'encounterId and doctorId are required' });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true },
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    // Resolve doctor by staffProfile.id or userId
    let doctor = await prisma.staffProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      doctor = await prisma.staffProfile.findUnique({
        where: { userId: doctorId },
        include: { user: true },
      });
    }

    if (!doctor || doctor.user.role !== 'DOCTOR') {
      return res.status(400).json({ error: 'Doctor not found or not active' });
    }

    // Ensure doctor is marked available
    if (!doctor.isAvailable) {
      await prisma.staffProfile.update({
        where: { id: doctor.id },
        data: { isAvailable: true },
      });
    }

    // Create doctor assignment
    const assignment = await prisma.doctorAssignment.create({
      data: {
        encounterId,
        doctorId: doctor.id,
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

    // Update encounter status
    await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        doctorId: doctor.id,
        visitStatus: 'WAITING_FOR_DOCTOR',
      },
    });

    res.json({ assignment });
  } catch (error) {
    console.error('Error assigning doctor:', error);
    res.status(500).json({ error: 'Failed to assign doctor' });
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

    // Find doctor: resolve by staffProfile.id OR userId
    let doctor = await prisma.staffProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      doctor = await prisma.staffProfile.findUnique({
        where: { userId: doctorId },
        include: { user: true },
      });
    }

    if (!doctor || doctor.user.role !== 'DOCTOR' || !doctor.user.isActive) {
      return res.status(400).json({ error: 'Doctor is not available or not found' });
    }

    // Ensure doctor is marked available
    if (!doctor.isAvailable) {
      await prisma.staffProfile.update({
        where: { id: doctor.id },
        data: { isAvailable: true },
      });
    }

    // Update encounter with examination data
    await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        subjective: subjective || undefined,
        objective: objective || undefined,
        doctorId: doctor.id,
        visitStatus: 'WAITING_FOR_DOCTOR',
      },
    });

    // Save vitals if valid numbers provided
    if (vitals && typeof vitals === 'object') {
      const sanitizedVitals: any = {};
      if (typeof vitals.temperatureC === 'number' && !isNaN(vitals.temperatureC)) sanitizedVitals.temperatureC = vitals.temperatureC;
      if (typeof vitals.systolic === 'number' && !isNaN(vitals.systolic)) sanitizedVitals.systolic = vitals.systolic;
      if (typeof vitals.diastolic === 'number' && !isNaN(vitals.diastolic)) sanitizedVitals.diastolic = vitals.diastolic;
      if (typeof vitals.pulse === 'number' && !isNaN(vitals.pulse)) sanitizedVitals.pulse = vitals.pulse;
      if (typeof vitals.respRate === 'number' && !isNaN(vitals.respRate)) sanitizedVitals.respRate = vitals.respRate;
      if (typeof vitals.spo2 === 'number' && !isNaN(vitals.spo2)) sanitizedVitals.spo2 = vitals.spo2;
      if (typeof vitals.weightKg === 'number' && !isNaN(vitals.weightKg)) sanitizedVitals.weightKg = vitals.weightKg;
      if (typeof vitals.heightCm === 'number' && !isNaN(vitals.heightCm)) sanitizedVitals.heightCm = vitals.heightCm;

      if (Object.keys(sanitizedVitals).length > 0) {
        try {
          await prisma.vital.create({
            data: {
              encounterId,
              ...sanitizedVitals,
              recordedBy: userId || 'system',
            },
          });
        } catch (vErr) {
          console.error('Failed to save vitals during route to doctor:', vErr);
        }
      }
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
    if (staffProfile) {
      await prisma.nurseAssignment.updateMany({
        where: {
          encounterId,
          nurseId: staffProfile.id,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Create doctor assignment
    const doctorAssignment = await prisma.doctorAssignment.create({
      data: {
        encounterId,
        doctorId: doctor.id,
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
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let staffProfile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'DOCTOR') {
        staffProfile = await prisma.staffProfile.create({
          data: {
            userId: user.id,
            fullName: user.username,
            specialization: 'General Practice',
            isAvailable: true,
          },
        });
      }
    }

    const doctorIds = [userId];
    if (staffProfile) {
      doctorIds.push(staffProfile.id);
    }

    // 1. Fetch all doctor assignments that are PENDING or ACCEPTED
    const assignments = await prisma.doctorAssignment.findMany({
      where: {
        doctorId: { in: doctorIds },
        status: { in: ['PENDING', 'ACCEPTED'] },
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

    // 2. Also fetch any active encounters assigned directly to this doctor
    // that don't have a doctorAssignment record yet
    const assignedEncounterIds = new Set(assignments.map(a => a.encounterId));

    const directEncounters = await prisma.encounter.findMany({
      where: {
        doctorId: { in: doctorIds },
        visitStatus: { in: ['WAITING_FOR_DOCTOR', 'DOCTOR_CONSULT', 'LAB_READY'] },
        id: { notIn: Array.from(assignedEncounterIds) },
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Synthesize assignments for direct encounters
    const directAssignments = directEncounters.map(encounter => ({
      id: `enc-${encounter.id}`,
      encounterId: encounter.id,
      doctorId: staffProfile ? staffProfile.id : userId,
      assignedBy: 'System',
      assignedAt: encounter.createdAt,
      acceptedAt: encounter.visitStatus === 'DOCTOR_CONSULT' ? encounter.createdAt : null,
      rejectedAt: null,
      rejectionReason: null,
      completedAt: null,
      status: encounter.visitStatus === 'DOCTOR_CONSULT' ? 'ACCEPTED' : 'PENDING',
      createdAt: encounter.createdAt,
      updatedAt: encounter.updatedAt,
      encounter,
    }));

    const allAssignments = [...assignments, ...directAssignments];
    const validAssignments = allAssignments.filter(a => a.encounter && a.encounter.patient);

    res.json({ assignments: validAssignments });
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

    let encounterId: string | null = null;

    if (id.startsWith('enc-')) {
      encounterId = id.replace('enc-', '');
    } else {
      const assignment = await prisma.doctorAssignment.findUnique({
        where: { id },
        include: { encounter: true },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      encounterId = assignment.encounterId;

      if (action === 'accept') {
        await prisma.doctorAssignment.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });
      } else if (action === 'reject') {
        await prisma.doctorAssignment.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionReason,
          },
        });
      }
    }

    if (action === 'accept' && encounterId) {
      // Update encounter status
      await prisma.encounter.update({
        where: { id: encounterId },
        data: {
          visitStatus: 'DOCTOR_CONSULT',
        },
      });

      // Log doctor consultation fee
      try {
        await FeeService.logEncounterFee(
          encounterId,
          FeeType.DOCTOR_CONSULTATION,
          userId || 'system'
        );
      } catch (feeError) {
        console.error('Failed to log doctor consultation fee:', feeError);
      }
    } else if (action === 'reject' && encounterId) {
      // Reset encounter status
      await prisma.encounter.update({
        where: { id: encounterId },
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
