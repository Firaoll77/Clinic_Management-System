import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { LabService } from '../lib/labService';

const router = Router();

/**
 * POST /api/lab/tests
 * Create lab test (Admin only)
 */
router.post('/tests', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, code, category, description, sampleType, normalRange, unit, price } = req.body;

    if (!name || !code || !category || !sampleType || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, code, category, sampleType, and price are required',
      });
    }

    const labTest = await LabService.createLabTest({
      name,
      code,
      category,
      description,
      sampleType,
      normalRange,
      unit,
      price
    });

    res.status(201).json({
      message: 'Lab test created successfully',
      labTest,
    });
  } catch (error) {
    console.error('Create lab test error:', error);
    res.status(500).json({
      error: 'Failed to create lab test',
      message: 'An error occurred while creating lab test',
    });
  }
});

/**
 * GET /api/lab/tests
 * Get all lab tests
 */
router.get('/tests', authenticate, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const labTests = await LabService.getLabTests(category as string);

    res.json({
      labTests,
      total: labTests.length,
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({
      error: 'Failed to fetch lab tests',
      message: 'An error occurred while fetching lab tests',
    });
  }
});

/**
 * PATCH /api/lab/tests/:id
 * Update lab test (Admin only)
 */
router.patch('/tests/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labTestId = Array.isArray(id) ? id[0] : id;

    const labTest = await LabService.updateLabTest(labTestId, req.body);

    res.json({
      message: 'Lab test updated successfully',
      labTest,
    });
  } catch (error) {
    console.error('Update lab test error:', error);
    res.status(500).json({
      error: 'Failed to update lab test',
      message: 'An error occurred while updating lab test',
    });
  }
});

/**
 * DELETE /api/lab/tests/:id
 * Delete lab test (Admin only)
 */
router.delete('/tests/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labTestId = Array.isArray(id) ? id[0] : id;

    await LabService.deleteLabTest(labTestId);

    res.json({
      message: 'Lab test deleted successfully',
    });
  } catch (error) {
    console.error('Delete lab test error:', error);
    res.status(500).json({
      error: 'Failed to delete lab test',
      message: 'An error occurred while deleting lab test',
    });
  }
});

/**
 * POST /api/lab/orders
 * Create lab order
 */
router.post('/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['DOCTOR', 'NURSE', 'ADMIN'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to create lab orders',
      });
    }

    const { encounterId, patientId, doctorId, priority, notes, testIds } = req.body;

    if (!encounterId || !patientId || !doctorId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'encounterId, patientId, and doctorId are required',
      });
    }

    const labOrder = await LabService.createLabOrder({
      encounterId,
      patientId,
      doctorId,
      priority: priority || 'ROUTINE',
      notes
    });

    // Auto-add lab fees to encounter
    if (testIds && Array.isArray(testIds)) {
      for (const testId of testIds) {
        const labTest = await prisma.labTest.findUnique({
          where: { id: testId }
        });
        if (labTest) {
          await prisma.encounterFee.create({
            data: {
              encounterId,
              feeType: 'LAB_TEST',
              description: `Lab Test: ${labTest.name}`,
              amount: labTest.price,
              loggedBy: req.user!.userId
            }
          });
        }
      }
    } else {
      // Default lab fee if no specific tests
      await prisma.encounterFee.create({
        data: {
          encounterId,
          feeType: 'LAB_TEST',
          description: 'Laboratory Services',
          amount: 500, // Default lab fee
          loggedBy: req.user!.userId
        }
      });
    }

    // Update encounter status to LAB_PENDING
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { visitStatus: 'LAB_PENDING' }
    });

    res.status(201).json({
      message: 'Lab order created successfully',
      labOrder,
    });
  } catch (error) {
    console.error('Create lab order error:', error);
    res.status(500).json({
      error: 'Failed to create lab order',
      message: 'An error occurred while creating lab order',
    });
  }
});

/**
 * POST /api/lab/results
 * Create lab result entry
 */
router.post('/results', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['LAB_TECH', 'LABORATORIST', 'ADMIN', 'DOCTOR'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to enter lab results',
      });
    }

    const { labOrderId, labTestId, value, unit, referenceRange, flag, notes } = req.body;

    if (!labOrderId || !value) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'labOrderId and value are required',
      });
    }

    let targetLabTestId = labTestId;
    if (!targetLabTestId) {
      // Find or create default test
      let defaultTest = await prisma.labTest.findFirst();
      if (!defaultTest) {
        defaultTest = await prisma.labTest.create({
          data: {
            code: 'GEN_LAB',
            name: 'General Lab Test',
            department: 'Laboratory',
            price: 0
          }
        });
      }
      targetLabTestId = defaultTest.id;
    }

    const labResult = await prisma.labResult.create({
      data: {
        labOrderId,
        labTestId: targetLabTestId,
        value: String(value),
        unit: unit || null,
        referenceRange: referenceRange || null,
        flag: flag || 'N',
        enteredBy: req.user!.userId
      },
      include: {
        labTest: true
      }
    });

    res.status(201).json({
      message: 'Lab result entered successfully',
      labResult,
    });
  } catch (error) {
    console.error('Enter lab result error:', error);
    res.status(500).json({
      error: 'Failed to enter lab result',
      message: 'An error occurred while entering lab result',
    });
  }
});

/**
 * POST /api/lab/orders/:id/results
 * Enter lab results (order-specific alias)
 */
router.post('/orders/:id/results', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['LAB_TECH', 'LABORATORIST', 'ADMIN', 'DOCTOR'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to enter lab results',
      });
    }

    const { id } = req.params;
    const labOrderId = Array.isArray(id) ? id[0] : id;

    const { labTestId, value, result, unit, referenceRange, flag, isAbnormal, notes } = req.body;
    const resultValue = value || result;

    if (!resultValue) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'value/result is required',
      });
    }

    let targetLabTestId = labTestId;
    if (!targetLabTestId) {
      let defaultTest = await prisma.labTest.findFirst();
      if (!defaultTest) {
        defaultTest = await prisma.labTest.create({
          data: {
            code: 'GEN_LAB',
            name: 'General Lab Test',
            department: 'Laboratory',
            price: 0
          }
        });
      }
      targetLabTestId = defaultTest.id;
    }

    const labResult = await prisma.labResult.create({
      data: {
        labOrderId,
        labTestId: targetLabTestId,
        value: String(resultValue),
        unit: unit || null,
        referenceRange: referenceRange || null,
        flag: flag || (isAbnormal ? 'H' : 'N'),
        enteredBy: req.user!.userId
      },
      include: {
        labTest: true
      }
    });

    // Get lab order to update encounter status
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: { encounter: true }
    });

    if (labOrder && labOrder.encounter) {
      // Update encounter status to LAB_READY
      await prisma.encounter.update({
        where: { id: labOrder.encounterId },
        data: { visitStatus: 'LAB_READY' }
      });
    }

    res.status(201).json({
      message: 'Lab result entered successfully',
      labResult,
    });
  } catch (error) {
    console.error('Enter lab result error:', error);
    res.status(500).json({
      error: 'Failed to enter lab result',
      message: 'An error occurred while entering lab result',
    });
  }
});

/**
 * GET /api/lab/results/:labOrderId
 * Get results for a lab order
 */
router.get('/results/:labOrderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { labOrderId } = req.params;
    const labOrderIdValue = Array.isArray(labOrderId) ? labOrderId[0] : labOrderId;

    const results = await prisma.labResult.findMany({
      where: { labOrderId: labOrderIdValue },
      include: {
        labTest: true
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('Get lab results error:', error);
    res.status(500).json({
      error: 'Failed to fetch lab results',
      message: 'An error occurred while fetching lab results',
    });
  }
});

/**
 * PUT /api/lab/results/:id
 * Update lab result
 */
router.put('/results/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resultId = Array.isArray(id) ? id[0] : id;
    const { value, unit, referenceRange, flag } = req.body;

    const labResult = await prisma.labResult.update({
      where: { id: resultId },
      data: {
        ...(value !== undefined && { value: String(value) }),
        ...(unit !== undefined && { unit }),
        ...(referenceRange !== undefined && { referenceRange }),
        ...(flag !== undefined && { flag })
      },
      include: {
        labTest: true
      }
    });

    res.json({
      message: 'Lab result updated successfully',
      labResult
    });
  } catch (error) {
    console.error('Update lab result error:', error);
    res.status(500).json({
      error: 'Failed to update lab result',
      message: 'An error occurred while updating lab result',
    });
  }
});

/**
 * POST /api/lab/orders/:id/complete
 * Mark lab order as completed
 */
router.post('/orders/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labOrderId = Array.isArray(id) ? id[0] : id;

    const labOrder = await prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: { encounter: true }
    });

    // Also update any pending lab assignments for this order to COMPLETED
    await prisma.labAssignment.updateMany({
      where: {
        labOrderId,
        status: 'ACCEPTED'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Update encounter status to BILLING when lab is completed
    if (labOrder.encounter) {
      await prisma.encounter.update({
        where: { id: labOrder.encounterId },
        data: { visitStatus: 'BILLING' }
      });
    }

    res.json({
      message: 'Lab order completed successfully',
      labOrder
    });
  } catch (error) {
    console.error('Complete lab order error:', error);
    res.status(500).json({
      error: 'Failed to complete lab order',
      message: 'An error occurred while completing lab order',
    });
  }
});

/**
 * GET /api/lab/orders/:id
 * Get lab order with results
 */
router.get('/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labOrderId = Array.isArray(id) ? id[0] : id;

    const labOrder = await LabService.getLabOrder(labOrderId);

    if (!labOrder) {
      return res.status(404).json({
        error: 'Lab order not found',
        message: 'The requested lab order does not exist',
      });
    }

    res.json({ labOrder });
  } catch (error) {
    console.error('Get lab order error:', error);
    res.status(500).json({
      error: 'Failed to fetch lab order',
      message: 'An error occurred while fetching lab order',
    });
  }
});

/**
 * GET /api/lab/patient/:patientId
 * Get patient lab history
 */
router.get('/patient/:patientId', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patientIdValue = Array.isArray(patientId) ? patientId[0] : patientId;
    const { limit } = req.query;

    const labOrders = await LabService.getPatientLabHistory(
      patientIdValue,
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      labOrders,
      total: labOrders.length,
    });
  } catch (error) {
    console.error('Get patient lab history error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient lab history',
      message: 'An error occurred while fetching patient lab history',
    });
  }
});

/**
 * GET /api/lab/orders/pending
 * Get pending lab orders
 */
router.get('/orders/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const labOrders = await LabService.getPendingLabOrders();

    res.json({
      labOrders,
      total: labOrders.length,
    });
  } catch (error) {
    console.error('Get pending lab orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending lab orders',
      message: 'An error occurred while fetching pending lab orders',
    });
  }
});

export default router;