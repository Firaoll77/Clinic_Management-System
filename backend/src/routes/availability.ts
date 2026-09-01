import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { DoctorAvailabilityService } from '../lib/doctorAvailabilityService';

const router = Router();

/**
 * POST /api/availability
 * Create doctor availability (Admin, Doctor)
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedRoles = ['ADMIN', 'DOCTOR'];
    if (!allowedRoles.includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to manage availability',
      });
    }

    const { doctorId, weekday, startTime, endTime, slotMinutes, effectiveFrom, effectiveTo } = req.body;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        error: 'Invalid time format',
        message: 'Time must be in HH:MM format',
      });
    }

    // Validate weekday
    if (weekday < 0 || weekday > 6) {
      return res.status(400).json({
        error: 'Invalid weekday',
        message: 'Weekday must be between 0 (Sunday) and 6 (Saturday)',
      });
    }

    // Validate slot duration
    if (slotMinutes < 5 || slotMinutes > 120) {
      return res.status(400).json({
        error: 'Invalid slot duration',
        message: 'Slot duration must be between 5 and 120 minutes',
      });
    }

    const availability = await DoctorAvailabilityService.createAvailability({
      doctorId,
      weekday,
      startTime,
      endTime,
      slotMinutes,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });

    res.status(201).json({
      message: 'Availability created successfully',
      availability,
    });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({
      error: 'Failed to create availability',
      message: 'An error occurred while creating availability',
    });
  }
});

/**
 * GET /api/availability/doctor/:doctorId
 * Get all availabilities for a doctor
 */
router.get('/doctor/:doctorId', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const doctorIdValue = Array.isArray(doctorId) ? doctorId[0] : doctorId;

    const availabilities = await DoctorAvailabilityService.getAllDoctorAvailabilities(doctorIdValue);

    res.json({
      availabilities,
      total: availabilities.length,
    });
  } catch (error) {
    console.error('Get availabilities error:', error);
    res.status(500).json({
      error: 'Failed to fetch availabilities',
      message: 'An error occurred while fetching availabilities',
    });
  }
});

/**
 * GET /api/availability/doctor/:doctorId/date/:date
 * Get available slots for a specific date
 */
router.get('/doctor/:doctorId/date/:date', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.params;
    const doctorIdValue = Array.isArray(doctorId) ? doctorId[0] : doctorId;
    const dateValue = Array.isArray(date) ? date[0] : date;

    const targetDate = new Date(dateValue);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Please provide a valid date',
      });
    }

    const availableSlots = await DoctorAvailabilityService.getAvailableSlots(doctorIdValue, targetDate);

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
 * GET /api/availability/doctor/:doctorId/week/:weekStart
 * Get weekly availability overview
 */
router.get('/doctor/:doctorId/week/:weekStart', authenticate, async (req: Request, res: Response) => {
  try {
    const { doctorId, weekStart } = req.params;
    const doctorIdValue = Array.isArray(doctorId) ? doctorId[0] : doctorId;
    const weekStartValue = Array.isArray(weekStart) ? weekStart[0] : weekStart;

    const startDate = new Date(weekStartValue);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Please provide a valid start date',
      });
    }

    const weeklyAvailability = await DoctorAvailabilityService.getWeeklyAvailability(doctorIdValue, startDate);

    res.json({
      weekStart: startDate,
      weeklyAvailability,
    });
  } catch (error) {
    console.error('Get weekly availability error:', error);
    res.status(500).json({
      error: 'Failed to fetch weekly availability',
      message: 'An error occurred while fetching weekly availability',
    });
  }
});

/**
 * PATCH /api/availability/:id
 * Update availability
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const availabilityId = Array.isArray(id) ? id[0] : id;

    const availability = await DoctorAvailabilityService.updateAvailability(availabilityId, req.body);

    res.json({
      message: 'Availability updated successfully',
      availability,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      error: 'Failed to update availability',
      message: 'An error occurred while updating availability',
    });
  }
});

/**
 * DELETE /api/availability/:id
 * Delete availability
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const availabilityId = Array.isArray(id) ? id[0] : id;

    await DoctorAvailabilityService.deleteAvailability(availabilityId);

    res.json({
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({
      error: 'Failed to delete availability',
      message: 'An error occurred while deleting availability',
    });
  }
});

export default router;