import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { EncounterService } from '../lib/encounterService';

const router = Router();

/**
 * POST /api/encounters
 * Create a new encounter
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['DOCTOR', 'NURSE', 'ADMIN'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to create encounters',
      });
    }

    const { patientId, doctorId, appointmentId, visitStatus, chiefComplaint } = req.body;

    if (!patientId || !doctorId || !chiefComplaint) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'patientId, doctorId, and chiefComplaint are required',
      });
    }

    const encounter = await EncounterService.createEncounter({
      patientId,
      doctorId,
      appointmentId,
      visitStatus: visitStatus || 'TRIAGE',
      chiefComplaint
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
 * GET /api/encounters/:id
 * Get encounter details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const encounter = await EncounterService.getEncounter(encounterId);

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
 * POST /api/encounters/:id/vitals
 * Record patient vitals
 */
router.post('/:id/vitals', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const vitals = await EncounterService.recordVitals(encounterId, req.body);

    res.status(201).json({
      message: 'Vitals recorded successfully',
      vitals,
    });
  } catch (error) {
    console.error('Record vitals error:', error);
    res.status(500).json({
      error: 'Failed to record vitals',
      message: 'An error occurred while recording vitals',
    });
  }
});

/**
 * PATCH /api/encounters/:id/vitals/:vitalsId
 * Update vitals
 */
router.patch('/:id/vitals/:vitalsId', authenticate, async (req: Request, res: Response) => {
  try {
    const { vitalsId } = req.params;
    const vitalsIdValue = Array.isArray(vitalsId) ? vitalsId[0] : vitalsId;

    const vitals = await EncounterService.updateVitals(vitalsIdValue, req.body);

    res.json({
      message: 'Vitals updated successfully',
      vitals,
    });
  } catch (error) {
    console.error('Update vitals error:', error);
    res.status(500).json({
      error: 'Failed to update vitals',
      message: 'An error occurred while updating vitals',
    });
  }
});

/**
 * POST /api/encounters/:id/soap
 * Add SOAP note
 */
router.post('/:id/soap', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const { subjective, objective, assessment, plan } = req.body;

    if (!subjective || !objective || !assessment || !plan) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All SOAP components (subjective, objective, assessment, plan) are required',
      });
    }

    const encounter = await EncounterService.addSOAPNote(encounterId, {
      subjective,
      objective,
      assessment,
      plan
    });

    res.json({
      message: 'SOAP note added successfully',
      encounter,
    });
  } catch (error) {
    console.error('Add SOAP note error:', error);
    res.status(500).json({
      error: 'Failed to add SOAP note',
      message: 'An error occurred while adding SOAP note',
    });
  }
});

/**
 * POST /api/encounters/:id/diagnosis
 * Add diagnosis
 */
router.post('/:id/diagnosis', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const { code, description, isPrimary, notes } = req.body;

    if (!code || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'code and description are required',
      });
    }

    const diagnosis = await EncounterService.addDiagnosis(encounterId, {
      code,
      description,
      isPrimary: isPrimary || false,
      notes
    });

    res.status(201).json({
      message: 'Diagnosis added successfully',
      diagnosis,
    });
  } catch (error) {
    console.error('Add diagnosis error:', error);
    res.status(500).json({
      error: 'Failed to add diagnosis',
      message: 'An error occurred while adding diagnosis',
    });
  }
});

/**
 * PATCH /api/encounters/:id/status
 * Update visit status
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const { visitStatus } = req.body;

    if (!visitStatus) {
      return res.status(400).json({
        error: 'Missing visit status',
        message: 'visitStatus is required',
      });
    }

    const encounter = await EncounterService.updateVisitStatus(encounterId, visitStatus);

    res.json({
      message: 'Visit status updated successfully',
      encounter,
    });
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({
      error: 'Failed to update visit status',
      message: 'An error occurred while updating visit status',
    });
  }
});

/**
 * POST /api/encounters/:id/signoff
 * Sign off encounter
 */
router.post('/:id/signoff', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;

    const encounter = await EncounterService.signOffEncounter(encounterId, req.user!.userId);

    res.json({
      message: 'Encounter signed off successfully',
      encounter,
    });
  } catch (error) {
    console.error('Sign off encounter error:', error);
    res.status(500).json({
      error: 'Failed to sign off encounter',
      message: 'An error occurred while signing off encounter',
    });
  }
});

/**
 * PATCH /api/encounters/:id/discharge
 * Discharge patient (complete encounter)
 * Roles: RECEPTIONIST, DOCTOR, ADMIN
 */
router.patch('/:id/discharge', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['RECEPTIONIST', 'DOCTOR', 'ADMIN'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to discharge patients',
      });
    }

    const { id } = req.params;
    const encounterId = Array.isArray(id) ? id[0] : id;
    const { dischargeNotes } = req.body;

    // Get current encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true }
    });

    if (!encounter) {
      return res.status(404).json({
        error: 'Encounter not found',
        message: 'The requested encounter does not exist',
      });
    }

    // Update encounter to COMPLETED
    const updatedEncounter = await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        visitStatus: 'COMPLETED',
        signedAt: new Date(),
        signedBy: req.user!.userId,
        dischargeNotes: dischargeNotes || null,
      },
      include: {
        patient: true,
        vitals: true,
      }
    });

    // Update patient's last activity
    await prisma.patient.update({
      where: { id: encounter.patientId },
      data: { lastActivityAt: new Date() }
    });

    res.json({
      message: 'Patient discharged successfully',
      encounter: updatedEncounter,
    });
  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({
      error: 'Failed to discharge patient',
      message: 'An error occurred while discharging patient',
    });
  }
});

/**
 * GET /api/encounters/patient/:patientId
 * Get patient encounter history
 */
router.get('/patient/:patientId', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patientIdValue = Array.isArray(patientId) ? patientId[0] : patientId;
    const { limit } = req.query;

    const encounters = await EncounterService.getPatientEncounters(
      patientIdValue,
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      encounters,
      total: encounters.length,
    });
  } catch (error) {
    console.error('Get patient encounters error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient encounters',
      message: 'An error occurred while fetching patient encounters',
    });
  }
});

/**
 * GET /api/encounters/doctor/:doctorId/active
 * Get active encounters for a doctor
 */
router.get('/doctor/:doctorId/active', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const doctorIdValue = Array.isArray(doctorId) ? doctorId[0] : doctorId;

    const encounters = await EncounterService.getActiveEncounters(doctorIdValue);

    res.json({
      encounters,
      total: encounters.length,
    });
  } catch (error) {
    console.error('Get active encounters error:', error);
    res.status(500).json({
      error: 'Failed to fetch active encounters',
      message: 'An error occurred while fetching active encounters',
    });
  }
});

export default router;