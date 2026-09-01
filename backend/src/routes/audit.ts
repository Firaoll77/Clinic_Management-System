import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * GET /api/audit/logs
 * Get audit logs with optional filtering
 * Roles: ADMIN
 */
router.get('/logs', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { 
      entityType, 
      actorUserId, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const where: any = {};
    
    if (entityType) {
      where.entityType = Array.isArray(entityType) ? entityType[0] : entityType;
    }
    
    if (actorUserId) {
      where.actorUserId = Array.isArray(actorUserId) ? actorUserId[0] : actorUserId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(Array.isArray(limit) ? limit[0] : limit),
      skip: Number(Array.isArray(offset) ? offset[0] : offset),
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      logs,
      total,
      limit: Number(Array.isArray(limit) ? limit[0] : limit),
      offset: Number(Array.isArray(offset) ? offset[0] : offset),
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: 'An error occurred while fetching audit logs',
    });
  }
});

/**
 * GET /api/audit/logs/:id
 * Get specific audit log by ID
 * Roles: ADMIN
 */
router.get('/logs/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logId = Array.isArray(id) ? id[0] : id;

    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    res.status(500).json({
      error: 'Failed to fetch audit log',
      message: 'An error occurred while fetching the audit log',
    });
  }
});

/**
 * GET /api/audit/stats
 * Get audit log statistics
 * Roles: ADMIN
 */
router.get('/stats', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const totalLogs = await prisma.auditLog.count();
    
    const logsByType = await prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const logsByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.json({
      totalLogs,
      logsByType,
      logsByAction,
      recentLogs,
    });
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    res.status(500).json({
      error: 'Failed to fetch audit statistics',
      message: 'An error occurred while fetching audit statistics',
    });
  }
});

export default router;
