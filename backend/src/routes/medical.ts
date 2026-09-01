import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { FeeService } from '../lib/feeService';
import { FeeType } from '../lib/feeService';
import { BillingAutomationService } from '../lib/billingAutomation';
import { VisitRoutingService } from '../lib/visitRouting';

const router = Router();

/**
 * POST /api/medical/patients/encounter
 * Create a new encounter (for receptionist check-in)
 */
router.post('/patients/encounter', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId, nurseId, visitStatus, chiefComplaint, subjective, objective, assessment, plan } = req.body;
    const userId = req.user?.userId;

    console.log('Creating encounter with patientId:', patientId);

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.error('Patient not found with ID:', patientId);
      return res.status(404).json({
        error: 'Patient not found',
        message: `No patient exists with ID: ${patientId}`,
      });
    }

    const encounter = await prisma.encounter.create({
      data: {
        patientId,
        nurseId: nurseId || null,
        visitStatus: visitStatus || 'TRIAGE',
        chiefComplaint,
        subjective,
        objective,
        assessment,
        plan,
        doctorId: null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: userId || '',
        action: 'CHECK_IN',
        entityType: 'ENCOUNTER',
        entityId: encounter.id,
        details: `Patient checked in and sent to ${visitStatus}`,
      },
    });

    // Log initial registration fee
    try {
      await FeeService.logEncounterFee(
        encounter.id,
        FeeType.REGISTRATION,
        userId || 'system'
      );
    } catch (feeError) {
      console.error('Failed to log registration fee:', feeError);
      // Don't fail the encounter creation if fee logging fails
    }

    res.json({ encounter });
  } catch (error) {
    console.error('Create encounter error:', error);
    res.status(500).json({
      error: 'Failed to create encounter',
      message: 'An error occurred while creating encounter',
    });
  }
});

/**
 * PATCH /api/medical/patients/encounter/assign-doctor
 * Assign doctor to encounter and update status
 */
router.patch('/patients/encounter/assign-doctor', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, visitStatus } = req.body;
    const userId = req.user?.userId;

    // Find the most recent encounter for this patient
    const encounter = await prisma.encounter.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    if (!encounter) {
      return res.status(404).json({
        error: 'No active encounter found',
        message: 'No active encounter found for this patient',
      });
    }

    // Update encounter with doctor and new status
    const updatedEncounter = await prisma.encounter.update({
      where: { id: encounter.id },
      data: {
        doctorId,
        visitStatus: visitStatus || 'DOCTOR_CONSULT',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: userId || '',
        action: 'ASSIGN_DOCTOR',
        entityType: 'ENCOUNTER',
        entityId: encounter.id,
        details: `Patient assigned to doctor and moved to ${visitStatus}`,
      },
    });

    res.json({ encounter: updatedEncounter });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({
      error: 'Failed to assign doctor',
      message: 'An error occurred while assigning doctor',
    });
  }
});

/**
 * GET /api/medical/patients/:patientId/encounters
 * Get all encounters for a patient
 */
router.get('/patients/:patientId/encounters', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const encounters = await prisma.encounter.findMany({
      where: { patientId: Array.isArray(patientId) ? patientId[0] : patientId },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                mrn: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        vitals: true,
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
        createdAt: 'desc',
      },
    });

    res.json({ encounters });
  } catch (error) {
    console.error('Get encounters error:', error);
    res.status(500).json({
      error: 'Failed to fetch encounters',
      message: 'An error occurred while fetching encounters',
    });
  }
});

/**
 * GET /api/medical/encounters/:id
 * Get a specific encounter by ID
 */
router.get('/encounters/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const encounter = await prisma.encounter.findUnique({
      where: { id: Array.isArray(id) ? id[0] : id },
      include: {
        patient: true,
        appointment: true,
        vitals: true,
        labOrders: {
          include: {
            results: {
              include: {
                labTest: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!encounter) {
      return res.status(404).json({
        error: 'Encounter not found',
        message: 'The requested encounter does not exist',
      });
    }

    res.json({ encounter });
  } catch (error) {
    console.error('Get encounter error:', error);
    res.status(500).json({
      error: 'Failed to fetch encounter',
      message: 'An error occurred while fetching the encounter',
    });
  }
});

/**
 * POST /api/medical/encounters
 * Create a new encounter
 */
router.post('/encounters', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      appointmentId, 
      patientId, 
      doctorId, 
      chiefComplaint, 
      subjective, 
      objective, 
      assessment, 
      plan, 
      icd10Code,
      labResultInterpretation 
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'patientId and doctorId are required',
      });
    }

    // If appointmentId is provided, link to it and update appointment status
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: Array.isArray(appointmentId) ? appointmentId[0] : appointmentId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    const encounter = await prisma.encounter.create({
      data: {
        appointmentId,
        patientId,
        doctorId,
        chiefComplaint,
        subjective,
        objective,
        assessment,
        plan,
        icd10Code,
        labResultInterpretation,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update patient last activity
    await prisma.patient.update({
      where: { id: patientId },
      data: { lastActivityAt: new Date() },
    });

    res.status(201).json({
      message: 'Encounter created successfully',
      encounter,
    });
  } catch (error) {
    console.error('Create encounter error:', error);
    res.status(500).json({
      error: 'Failed to create encounter',
      message: 'An error occurred while creating the encounter',
    });
  }
});

/**
 * PATCH /api/medical/encounters/:id
 * Update an encounter
 */
router.patch('/encounters/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      chiefComplaint, 
      subjective, 
      objective, 
      assessment, 
      plan, 
      icd10Code,
      labResultInterpretation,
      signedAt,
      signedBy 
    } = req.body;

    const encounter = await prisma.encounter.update({
      where: { id: Array.isArray(id) ? id[0] : id },
      data: {
        ...(chiefComplaint !== undefined && { chiefComplaint }),
        ...(subjective !== undefined && { subjective }),
        ...(objective !== undefined && { objective }),
        ...(assessment !== undefined && { assessment }),
        ...(plan !== undefined && { plan }),
        ...(icd10Code !== undefined && { icd10Code }),
        ...(labResultInterpretation !== undefined && { labResultInterpretation }),
        ...(signedAt && { signedAt: new Date(signedAt) }),
        ...(signedBy && { signedBy }),
      },
    });

    res.json({
      message: 'Encounter updated successfully',
      encounter,
    });
  } catch (error) {
    console.error('Update encounter error:', error);
    res.status(500).json({
      error: 'Failed to update encounter',
      message: 'An error occurred while updating the encounter',
    });
  }
});

/**
 * POST /api/medical/encounters/:encounterId/vitals
 * Add vitals to an encounter
 */
router.post('/encounters/:encounterId/vitals', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    const { 
      temperatureC, 
      systolic, 
      diastolic, 
      pulse, 
      respRate, 
      spo2, 
      weightKg, 
      heightCm 
    } = req.body;

    // Calculate BMI if weight and height are provided
    let bmi = null;
    if (weightKg && heightCm) {
      const heightM = heightCm / 100;
      bmi = weightKg / (heightM * heightM);
    }

    const vital = await prisma.vital.create({
      data: {
        encounterId: Array.isArray(encounterId) ? encounterId[0] : encounterId,
        temperatureC,
        systolic,
        diastolic,
        pulse,
        respRate,
        spo2,
        weightKg,
        heightCm,
        bmi,
        recordedBy: req.user?.userId || '',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user?.userId || '',
        action: 'RECORD_VITALS',
        entityType: 'VITAL',
        entityId: vital.id,
        details: `Vitals recorded for encounter ${encounterId}`,
      },
    });

    res.status(201).json({
      message: 'Vitals recorded successfully',
      vital,
    });
  } catch (error) {
    console.error('Create vitals error:', error);
    res.status(500).json({
      error: 'Failed to record vitals',
      message: 'An error occurred while recording vitals',
    });
  }
});

/**
 * POST /api/medical/encounters/:encounterId/lab-orders
 * Create lab orders for an encounter
 */
router.post('/encounters/:encounterId/lab-orders', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    const { patientId, labTestIds } = req.body;

    if (!labTestIds || !Array.isArray(labTestIds) || labTestIds.length === 0) {
      return res.status(400).json({
        error: 'Missing lab test IDs',
        message: 'At least one lab test ID is required',
      });
    }

    const labOrders = await prisma.labOrder.create({
      data: {
        encounterId: Array.isArray(encounterId) ? encounterId[0] : encounterId,
        patientId: Array.isArray(patientId) ? patientId[0] : patientId,
        orderedBy: req.user?.userId || '',
        results: {
          create: labTestIds.map((labTestId: string) => ({
            labTest: {
              connect: { id: labTestId }
            },
            value: '',
            enteredBy: req.user?.userId || '',
          })),
        },
      },
      include: {
        results: {
          include: {
            labTest: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user?.userId || '',
        action: 'CREATE_LAB_ORDER',
        entityType: 'LAB_ORDER',
        entityId: labOrders.id,
        details: `Lab order created for encounter ${encounterId} with ${labTestIds.length} tests`,
      },
    });

    // AUTOMATED BILLING: Automatically create invoice line items for lab tests
    try {
      await BillingAutomationService.processLabOrderBilling(
        labOrders.id, 
        Array.isArray(encounterId) ? encounterId[0] : encounterId
      );
    } catch (billingError) {
      console.error('Automated billing failed for lab orders:', billingError);
      // Continue with response even if billing fails - log for manual intervention
    }

    res.status(201).json({
      message: 'Lab orders created successfully',
      labOrders,
    });
  } catch (error) {
    console.error('Create lab orders error:', error);
    res.status(500).json({
      error: 'Failed to create lab orders',
      message: 'An error occurred while creating lab orders',
    });
  }
});

/**
 * PATCH /api/medical/lab-results/:id
 * Update lab result
 */
router.patch('/lab-results/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { value, flag, referenceRange } = req.body;

    const labResult = await prisma.labResult.update({
      where: { id: Array.isArray(id) ? id[0] : id },
      data: {
        value,
        flag,
        referenceRange,
        enteredBy: req.user?.userId,
      },
      include: {
        labTest: true,
      },
    });

    // Update lab order status if all results are completed
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labResult.labOrderId },
      include: { results: true },
    });

    const allCompleted = labOrder?.results.every((r) => r.value !== '');
    if (allCompleted) {
      await prisma.labOrder.update({
        where: { id: labResult.labOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // AUTOMATED VISIT ROUTING: Change visit status to LAB_READY when lab results are completed
      try {
        await VisitRoutingService.completeLabOrder(labResult.labOrderId, req.user?.userId || '');
      } catch (routingError) {
        console.error('Automated visit routing failed:', routingError);
        // Continue with response even if routing fails
      }
    }

    res.json({
      message: 'Lab result updated successfully',
      labResult,
    });
  } catch (error) {
    console.error('Update lab result error:', error);
    res.status(500).json({
      error: 'Failed to update lab result',
      message: 'An error occurred while updating the lab result',
    });
  }
});

/**
 * GET /api/medical/lab-tests
 * Get all available lab tests
 */
router.get('/lab-tests', authenticate, async (req: Request, res: Response) => {
  try {
    const labTests = await prisma.labTest.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ labTests });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({
      error: 'Failed to fetch lab tests',
      message: 'An error occurred while fetching lab tests',
    });
  }
});

export default router;