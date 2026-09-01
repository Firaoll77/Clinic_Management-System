import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ReportService } from '../lib/reportService';

const router = Router();

/**
 * GET /api/reports/revenue/daily/:date
 * Get daily revenue report
 * Roles: ADMIN, RECEPTIONIST
 */
router.get('/revenue/daily/:date', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const dateValue = Array.isArray(date) ? date[0] : date;

    const report = await ReportService.getDailyRevenueReport(new Date(dateValue));

    res.json(report);
  } catch (error) {
    console.error('Get daily revenue report error:', error);
    res.status(500).json({
      error: 'Failed to fetch daily revenue report',
      message: 'An error occurred while fetching the report',
    });
  }
});

/**
 * GET /api/reports/revenue/monthly/:year/:month
 * Get monthly revenue report
 * Roles: ADMIN, RECEPTIONIST
 */
router.get('/revenue/monthly/:year/:month', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const yearValue = parseInt(Array.isArray(year) ? year[0] : year);
    const monthValue = parseInt(Array.isArray(month) ? month[0] : month);

    const report = await ReportService.getMonthlyRevenueReport(yearValue, monthValue);

    res.json(report);
  } catch (error) {
    console.error('Get monthly revenue report error:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly revenue report',
      message: 'An error occurred while fetching the report',
    });
  }
});

/**
 * GET /api/reports/operational
 * Get operational statistics
 */
router.get('/operational', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date range',
        message: 'startDate and endDate are required',
      });
    }

    const stats = await ReportService.getOperationalStats(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(stats);
  } catch (error) {
    console.error('Get operational stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch operational stats',
      message: 'An error occurred while fetching operational stats',
    });
  }
});

/**
 * GET /api/reports/doctor/:doctorId
 * Get doctor performance report
 */
router.get('/doctor/:doctorId', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date range',
        message: 'startDate and endDate are required',
      });
    }

    const report = await ReportService.getDoctorPerformanceReport(
      Array.isArray(doctorId) ? doctorId[0] : doctorId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(report);
  } catch (error) {
    console.error('Get doctor performance report error:', error);
    res.status(500).json({
      error: 'Failed to fetch doctor performance report',
      message: 'An error occurred while fetching the report',
    });
  }
});

/**
 * GET /api/reports/financial
 * Get financial summary
 * Roles: ADMIN, RECEPTIONIST
 */
router.get('/financial', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date range',
        message: 'startDate and endDate are required',
      });
    }

    const summary = await ReportService.getFinancialSummary(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(summary);
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch financial summary',
      message: 'An error occurred while fetching financial summary',
    });
  }
});

/**
 * GET /api/reports/patient/:patientId/visits
 * Get patient visit history
 */
router.get('/patient/:patientId/visits', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patientIdValue = Array.isArray(patientId) ? patientId[0] : patientId;

    const visits = await ReportService.getPatientVisitHistory(patientIdValue);

    res.json({
      visits,
      total: visits.length,
    });
  } catch (error) {
    console.error('Get patient visit history error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient visit history',
      message: 'An error occurred while fetching patient visit history',
    });
  }
});

/**
 * POST /api/reports/export/csv
 * Export data to CSV
 * Roles: ADMIN, RECEPTIONIST
 */
router.post('/export/csv', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req: Request, res: Response) => {
  try {
    const { data, filename } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'data must be an array',
      });
    }

    const csv = await ReportService.exportToCSV(data, filename || 'export.csv');

    res.json(csv);
  } catch (error) {
    console.error('Export to CSV error:', error);
    res.status(500).json({
      error: 'Failed to export to CSV',
      message: error instanceof Error ? error.message : 'An error occurred while exporting',
    });
  }
});

export default router;