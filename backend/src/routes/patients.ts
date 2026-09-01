import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { PatientService } from '../lib/patientService';
import {
  registerPatientSchema,
  updatePatientSchema,
  patientSearchSchema,
  emergencyAccessSchema,
  RegisterPatientInput,
  UpdatePatientInput,
  PatientSearchInput,
  EmergencyAccessInput,
} from '../lib/validation';
import {
  filterPatientDataByRole,
  validatePatientEdit,
} from '../lib/patientAccess';
import {
  createCreationAuditLog,
  createFieldChangeAuditLog,
  createEmergencyAccessAuditLog,
} from '../lib/audit';
import {
  createPatientChangeNotification,
  createPatientRegistrationNotification,
  createPatientArchivedNotification,
  createPatientRestoredNotification,
} from '../lib/notifications';

const router = Router();

/**
 * POST /api/patients/register
 * Register a new patient (Receptionist, Doctor, Nurse, Admin)
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    // Check permissions
    const allowedRoles = ['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to register patients',
      });
    }

    // Validate input
    const validatedData: RegisterPatientInput = registerPatientSchema.parse(req.body);

    // Check for existing patient with same national ID
    const existingPatient = await prisma.patient.findUnique({
      where: { nationalId: validatedData.nationalId }
    });

    if (existingPatient) {
      return res.status(400).json({
        error: 'Patient with this national ID already exists'
      });
    }

    // Use PatientService for registration with improved MRN generation and duplicate detection
    const patient = await PatientService.registerPatient({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      dob: new Date(validatedData.dob),
      gender: validatedData.gender,
      phone: validatedData.phone,
      email: validatedData.email,
      nationalId: validatedData.nationalId || '',
      address: validatedData.address,
      bloodGroup: validatedData.bloodGroup,
      emergencyContact: validatedData.emergencyContact,
    });

    // Add allergies if provided
    if (validatedData.allergies && validatedData.allergies.length > 0) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          allergies: {
            create: validatedData.allergies
          }
        }
      });
    }

    // Create audit log
    await createCreationAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patient.id,
      patient,
      req.ip,
      req.get('user-agent')
    );

    // Create notification
    await createPatientRegistrationNotification(
      patient.id,
      `${patient.firstName} ${patient.lastName}`,
      req.user!.role as any
    );

    // Get complete patient with allergies
    const completePatient = await prisma.patient.findUnique({
      where: { id: patient.id },
      include: { allergies: true }
    });

    // Filter response based on role
    const filteredPatient = filterPatientDataByRole(completePatient!, req.user!.role as any);

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: filteredPatient,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(400).json({
        error: 'Duplicate patient',
        message: error.message,
      });
    }

    console.error('Patient registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during patient registration',
    });
  }
});

/**
 * GET /api/patients
 * Get all patients with status filtering (active, archived, all), search, and counts
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search || req.query.q || req.query.query || '') as string).trim();
    const status = ((req.query.status || 'all') as string).toLowerCase() as 'active' | 'archived' | 'all';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await PatientService.getPatients({ search, status, page, limit });

    // Filter patients based on role
    const filteredPatients = result.patients.map(patient =>
      filterPatientDataByRole(patient, req.user!.role as any)
    );

    res.json({
      patients: filteredPatients,
      total: result.total,
      totalAll: result.totalAll,
      activeCount: result.activeCount,
      archivedCount: result.archivedCount,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch patients',
      message: 'An error occurred while fetching patients',
    });
  }
});

/**
 * GET /api/patients/search
 * Search patients by name, phone, MRN, or national ID
 */
router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const searchTerm = ((req.query.q || req.query.query || req.query.search || '') as string).trim();
    const status = ((req.query.status || 'active') as string).toLowerCase() as 'active' | 'archived' | 'all';

    // Use PatientService for improved search
    const patients = await PatientService.searchPatients(searchTerm, { status });

    // Filter patients based on role
    const filteredPatients = patients.map(patient =>
      filterPatientDataByRole(patient, req.user!.role as any)
    );

    res.json({
      patients: filteredPatients,
      total: filteredPatients.length,
    });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred during patient search',
    });
  }
});

/**
 * GET /api/patients
 * Get patients with search, status filtering, and count statistics
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search || req.query.q || '') as string).trim();
    const status = (req.query.status as string)?.toLowerCase();

    // Build filter conditions
    const where: any = {};

    if (status === 'active') {
      where.isArchived = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    }

    if (search) {
      where.OR = [
        { mrn: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, totalCount, activeCount, archivedCount] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          allergies: true,
        },
        orderBy: {
          lastActivityAt: 'desc',
        },
        take: 50,
      }),
      prisma.patient.count(),
      prisma.patient.count({ where: { isArchived: false } }),
      prisma.patient.count({ where: { isArchived: true } }),
    ]);

    // Filter patients based on role
    const filteredPatients = patients.map(patient =>
      filterPatientDataByRole(patient, req.user!.role as any)
    );

    res.json({
      patients: filteredPatients,
      total: filteredPatients.length,
      totalAll: totalCount,
      activeCount,
      archivedCount,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      error: 'Failed to fetch patients',
      message: 'An error occurred while fetching patients',
    });
  }
});

/**
 * GET /api/patients/:id
 * Get patient by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        allergies: true,
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
          take: 5,
        },
        encounters: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            vitals: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    // Filter patient data based on role
    const filteredPatient = filterPatientDataByRole(patient, req.user!.role as any);

    res.json({
      patient: filteredPatient,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient',
      message: 'An error occurred while fetching patient',
    });
  }
});

/**
 * PATCH /api/patients/:id
 * Update patient information
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    // Validate input
    const validatedData: UpdatePatientInput = updatePatientSchema.parse(req.body);

    // Get current patient data
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!currentPatient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    // Validate edit permissions
    const changedFields = Object.keys(validatedData);
    const validation = validatePatientEdit(req.user!.role as any, changedFields);

    if (!validation.valid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to edit these fields',
        invalidFields: validation.invalidFields,
      });
    }

    // Track changes for audit log
    const changes: Record<string, { before: any; after: any }> = {};

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(validatedData.firstName && { firstName: validatedData.firstName }),
        ...(validatedData.lastName && { lastName: validatedData.lastName }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.address && { address: validatedData.address }),
        ...(validatedData.bloodGroup && { bloodGroup: validatedData.bloodGroup }),
        ...(validatedData.emergencyContact && { emergencyContact: validatedData.emergencyContact }),
        lastActivityAt: new Date(),
      },
    });

    // Create audit logs for each changed field
    for (const field of changedFields) {
      if (currentPatient[field as keyof typeof currentPatient] !== updatedPatient[field as keyof typeof updatedPatient]) {
        changes[field] = {
          before: currentPatient[field as keyof typeof currentPatient],
          after: updatedPatient[field as keyof typeof updatedPatient],
        };

        await createFieldChangeAuditLog(
          req.user!.userId,
          req.user!.role as any,
          'PATIENT',
          patientId,
          field,
          currentPatient[field as keyof typeof currentPatient],
          updatedPatient[field as keyof typeof updatedPatient],
          req.ip,
          req.get('user-agent')
        );
      }
    }

    // Create notification if there were changes
    if (Object.keys(changes).length > 0) {
      await createPatientChangeNotification(
        patientId,
        `${updatedPatient.firstName} ${updatedPatient.lastName}`,
        req.user!.role as any,
        Object.keys(changes)
      );
    }

    // Filter response based on role
    const filteredPatient = filterPatientDataByRole(updatedPatient, req.user!.role as any);

    res.json({
      message: 'Patient updated successfully',
      patient: filteredPatient,
      changes,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    console.error('Update patient error:', error);
    res.status(500).json({
      error: 'Failed to update patient',
      message: 'An error occurred while updating patient',
    });
  }
});

/**
 * POST /api/patients/:id/emergency-access
 * Request emergency access to patient data
 */
router.post('/:id/emergency-access', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    // Validate input
    const validatedData: EmergencyAccessInput = emergencyAccessSchema.parse(req.body);

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    // Check if user already has active emergency access
    const existingAccess = await prisma.emergencyAccess.findFirst({
      where: {
        patientId: patientId,
        userId: req.user!.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingAccess) {
      return res.status(400).json({
        error: 'Access already granted',
        message: 'You already have active emergency access to this patient',
      });
    }

    // Calculate expiration time
    const duration = validatedData.duration || 2; // Default 2 hours
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

    // Create emergency access record
    const emergencyAccess = await prisma.emergencyAccess.create({
      data: {
        patientId: patientId,
        userId: req.user!.userId,
        reason: validatedData.reason,
        expiresAt,
      },
    });

    // Create audit log
    await createEmergencyAccessAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patientId,
      validatedData.reason,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      message: 'Emergency access granted',
      emergencyAccess: {
        id: emergencyAccess.id,
        expiresAt: emergencyAccess.expiresAt,
        reason: emergencyAccess.reason,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    console.error('Emergency access error:', error);
    res.status(500).json({
      error: 'Failed to grant emergency access',
      message: 'An error occurred while granting emergency access',
    });
  }
});

/**
 * POST /api/patients/:id/archive
 * Archive a patient (Admin only)
 */
router.post('/:id/archive', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    if (patient.isArchived) {
      return res.status(400).json({
        error: 'Already archived',
        message: 'Patient is already archived',
      });
    }

    // Archive patient
    const archivedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    // Create audit log
    await createFieldChangeAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patientId,
      'isArchived',
      false,
      true,
      req.ip,
      req.get('user-agent')
    );

    // Create notification
    await createPatientArchivedNotification(
      patientId,
      `${archivedPatient.firstName} ${archivedPatient.lastName}`,
      req.user!.role
    );

    res.json({
      message: 'Patient archived successfully',
      patient: archivedPatient,
    });
  } catch (error) {
    console.error('Archive patient error:', error);
    res.status(500).json({
      error: 'Failed to archive patient',
      message: 'An error occurred while archiving patient',
    });
  }
});

/**
 * POST /api/patients/:id/restore
 * Restore an archived patient (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    if (!patient.isArchived) {
      return res.status(400).json({
        error: 'Not archived',
        message: 'Patient is not archived',
      });
    }

    // Restore patient
    const restoredPatient = await PatientService.restorePatient(patientId);

    // Create audit log
    await createFieldChangeAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patientId,
      'isArchived',
      true,
      false,
      req.ip,
      req.get('user-agent')
    );

    // Create notification
    await createPatientRestoredNotification(
      patientId,
      `${restoredPatient.firstName} ${restoredPatient.lastName}`,
      req.user!.role
    );

    res.json({
      message: 'Patient restored successfully',
      patient: restoredPatient,
    });
  } catch (error) {
    console.error('Restore patient error:', error);
    res.status(500).json({
      error: 'Failed to restore patient',
      message: 'An error occurred while restoring patient',
    });
  }
});

/**
 * POST /api/patients/:id/unarchive
 * Alias for restore
 */
router.post('/:id/unarchive', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = Array.isArray(id) ? id[0] : id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient not found',
      });
    }

    if (!patient.isArchived) {
      return res.status(400).json({
        error: 'Not archived',
        message: 'Patient is not archived',
      });
    }

    const restoredPatient = await PatientService.restorePatient(patientId);

    await createFieldChangeAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patientId,
      'isArchived',
      true,
      false,
      req.ip,
      req.get('user-agent')
    );

    await createPatientRestoredNotification(
      patientId,
      `${restoredPatient.firstName} ${restoredPatient.lastName}`,
      req.user!.role
    );

    res.json({
      message: 'Patient restored successfully',
      patient: restoredPatient,
    });
  } catch (error) {
    console.error('Unarchive patient error:', error);
    res.status(500).json({
      error: 'Failed to restore patient',
      message: 'An error occurred while restoring patient',
    });
  }
});

/**
 * GET /api/patients/mrn/:mrn
 * Get patient by MRN
 */
router.get('/mrn/:mrn', authenticate, async (req: Request, res: Response) => {
  try {
    const { mrn } = req.params;
    const mrnValue = Array.isArray(mrn) ? mrn[0] : mrn;

    // Use PatientService to get patient by MRN
    const patient = await PatientService.getPatientByMRN(mrnValue);

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient with this MRN not found',
      });
    }

    // Filter patient data based on role
    const filteredPatient = filterPatientDataByRole(patient, req.user!.role as any);

    res.json({
      patient: filteredPatient,
    });
  } catch (error) {
    console.error('Get patient by MRN error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient',
      message: 'An error occurred while fetching patient',
    });
  }
});

/**
 * GET /api/patients/:mrn/timeline
 * Get patient timeline
 */
router.get('/:mrn/timeline', authenticate, async (req: Request, res: Response) => {
  try {
    const { mrn } = req.params;
    const mrnValue = Array.isArray(mrn) ? mrn[0] : mrn;

    // Use PatientService to get patient timeline
    const timeline = await PatientService.getPatientTimeline(mrnValue);

    res.json({
      timeline,
      total: timeline.length,
    });
  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient timeline',
      message: 'An error occurred while fetching patient timeline',
    });
  }
});

/**
 * PATCH /api/patients/mrn/:mrn
 * Update patient by MRN
 */
router.patch('/mrn/:mrn', authenticate, async (req: Request, res: Response) => {
  try {
    const { mrn } = req.params;
    const mrnValue = Array.isArray(mrn) ? mrn[0] : mrn;

    const updateData = req.body;

    // Use PatientService to update patient
    const patient = await PatientService.updatePatient(mrnValue, updateData);

    // Create audit log for the update
    await createFieldChangeAuditLog(
      req.user!.userId,
      req.user!.role,
      'PATIENT',
      patient.id,
      'general_update',
      {},
      updateData,
      req.ip,
      req.get('user-agent')
    );

    // Filter response based on role
    const filteredPatient = filterPatientDataByRole(patient, req.user!.role as any);

    res.json({
      message: 'Patient updated successfully',
      patient: filteredPatient,
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      error: 'Failed to update patient',
      message: 'An error occurred while updating patient',
    });
  }
});

export default router;
