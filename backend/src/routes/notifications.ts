import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/notifications';

const router = Router();

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await getUserNotifications(req.user!.userId, unreadOnly);

    res.json({
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'An error occurred while fetching notifications',
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: {
        AND: [
          {
            OR: [
              { userId: req.user!.userId },
              { userId: null },
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          { isRead: false },
        ],
      },
    });

    res.json({
      count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count',
      message: 'An error occurred while fetching unread count',
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notificationId = Array.isArray(id) ? id[0] : id;

    // Check if notification belongs to user or is system-wide
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'Notification not found',
      });
    }

    if (notification.userId && notification.userId !== req.user!.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only mark your own notifications as read',
      });
    }

    const updated = await markNotificationAsRead(notificationId as string);

    res.json({
      message: 'Notification marked as read',
      notification: updated,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'An error occurred while marking notification as read',
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
router.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await markAllNotificationsAsRead(req.user!.userId);

    res.json({
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: 'An error occurred while marking all notifications as read',
    });
  }
});

export default router;
