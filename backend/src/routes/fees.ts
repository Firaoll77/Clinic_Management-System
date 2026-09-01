import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { FeeService, FeeType } from '../lib/feeService';

const router = Router();

// Middleware to authenticate all routes
router.use(authenticate);

/**
 * GET /api/fees/configurations
 * Get all fee configurations
 * Roles: ADMIN, RECEPTIONIST
 */
router.get('/configurations', authenticate, async (req: Request, res: Response) => {
  try {
    const configurations = await FeeService.getAllFeeConfigurations();
    res.json({ configurations });
  } catch (error) {
    console.error('Error fetching fee configurations:', error);
    res.status(500).json({ error: 'Failed to fetch fee configurations' });
  }
});

/**
 * POST /api/fees/configurations
 * Create or update fee configuration
 * Roles: ADMIN
 */
router.post('/configurations', authenticate, async (req: Request, res: Response) => {
  try {
    const { feeType, name, amount, description } = req.body;
    const userId = req.user?.userId;

    if (!feeType || !name || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: feeType, name, amount' });
    }

    const configuration = await FeeService.upsertFeeConfiguration(
      feeType as FeeType,
      name,
      amount,
      description
    );

    res.json({ configuration });
  } catch (error) {
    console.error('Error upserting fee configuration:', error);
    res.status(500).json({ error: 'Failed to upsert fee configuration' });
  }
});

/**
 * GET /api/fees/encounter/:encounterId
 * Get all fees for an encounter
 * Roles: ADMIN, RECEPTIONIST, ACCOUNTANT
 */
router.get('/encounter/:encounterId', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    const id = Array.isArray(encounterId) ? encounterId[0] : encounterId;
    const fees = await FeeService.getEncounterFees(id);
    const total = await FeeService.calculateEncounterTotal(id);
    
    res.json({ fees, total });
  } catch (error) {
    console.error('Error fetching encounter fees:', error);
    res.status(500).json({ error: 'Failed to fetch encounter fees' });
  }
});

/**
 * POST /api/fees/encounter/:encounterId/log
 * Log a fee for an encounter
 * Roles: ADMIN, RECEPTIONIST, NURSE, DOCTOR
 */
router.post('/encounter/:encounterId/log', authenticate, async (req: Request, res: Response) => {
  try {
    const { encounterId } = req.params;
    const id = Array.isArray(encounterId) ? encounterId[0] : encounterId;
    const { feeType, customAmount } = req.body;
    const userId = req.user?.userId;

    if (!feeType) {
      return res.status(400).json({ error: 'Missing required field: feeType' });
    }

    const encounterFee = await FeeService.logEncounterFee(
      id,
      feeType as string,
      userId || 'system',
      customAmount
    );

    res.json({ encounterFee });
  } catch (error) {
    console.error('Error logging encounter fee:', error);
    res.status(500).json({ error: 'Failed to log encounter fee' });
  }
});

/**
 * POST /api/fees/initialize
 * Initialize default fee configurations
 * Roles: ADMIN
 */
router.post('/initialize', authenticate, async (req: Request, res: Response) => {
  try {
    await FeeService.initializeDefaultFees();
    res.json({ message: 'Default fee configurations initialized successfully' });
  } catch (error) {
    console.error('Error initializing default fees:', error);
    res.status(500).json({ error: 'Failed to initialize default fees' });
  }
});

export default router;
