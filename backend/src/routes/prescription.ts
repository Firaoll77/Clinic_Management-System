import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * POST /api/prescription
 * Create prescription (Doctor only)
 */
router.post('/', authenticate, authorize('DOCTOR'), async (req: Request, res: Response) => {
  try {
    const { encounterId, medications, instructions } = req.body;
    const userId = (req as any).user.id;

    if (!encounterId || !medications) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'encounterId and medications are required',
      });
    }

    // Check if encounter exists and belongs to doctor
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true }
    });

    if (!encounter) {
      return res.status(404).json({
        error: 'Encounter not found',
        message: 'The specified encounter does not exist',
      });
    }

    // Create or update prescription
    const prescription = await prisma.prescription.upsert({
      where: { encounterId },
      create: {
        encounterId,
        doctorId: userId,
        medications,
        instructions
      },
      update: {
        medications,
        instructions
      }
    });

    // Add prescription fee to encounter fees
    const prescriptionFee = await prisma.feeConfiguration.findUnique({
      where: { feeType: 'PRESCRIPTION' }
    });

    if (prescriptionFee && prescriptionFee.isActive) {
      await prisma.encounterFee.create({
        data: {
          encounterId,
          feeType: 'PRESCRIPTION',
          description: 'Prescription fee',
          amount: prescriptionFee.amount,
          loggedBy: userId
        }
      });

      // Update patient's total expected fees
      await prisma.patient.update({
        where: { id: encounter.patientId },
        data: {
          totalExpectedFees: {
            increment: prescriptionFee.amount
          }
        }
      });
    }

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      error: 'Failed to create prescription',
      message: 'An error occurred while creating prescription',
    });
  }
});

/**
 * GET /api/prescription/:encounterId
 * Get prescription by encounter ID
 */
router.get('/:encounterId', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { encounterId },
      include: {
        encounter: {
          include: {
            patient: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        error: 'Prescription not found',
        message: 'No prescription found for this encounter',
      });
    }

    res.json({ prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      error: 'Failed to get prescription',
      message: 'An error occurred while fetching prescription',
    });
  }
});

/**
 * POST /api/prescription/:encounterId/print
 * Mark prescription as printed (Receptionist only)
 */
router.post('/:encounterId/print', authenticate, authorize('RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    const userId = (req as any).user.id;

    const prescription = await prisma.prescription.update({
      where: { encounterId },
      data: {
        printedAt: new Date(),
        printedBy: userId
      }
    });

    res.json({
      message: 'Prescription marked as printed',
      prescription
    });
  } catch (error) {
    console.error('Print prescription error:', error);
    res.status(500).json({
      error: 'Failed to mark prescription as printed',
      message: 'An error occurred while marking prescription as printed',
    });
  }
});

/**
 * PATCH /api/prescription/:id
 * Update prescription (for marking as printed)
 */
router.patch('/:id', authenticate, authorize('RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { printedAt, printedBy } = req.body;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        printedAt: printedAt ? new Date(printedAt) : new Date(),
        printedBy: printedBy
      }
    });

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      error: 'Failed to update prescription',
      message: 'An error occurred while updating prescription',
    });
  }
});

export default router;