import { prisma } from './prisma';

export interface NotificationData {
  userId?: string;
  patientId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  expiresAt?: Date;
}

/**
 * Create a notification
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        patientId: data.patientId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        expiresAt: data.expiresAt,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notifications shouldn't break the main operation
  }
}

/**
 * Create notification for patient data change
 */
export async function createPatientChangeNotification(
  patientId: string,
  patientName: string,
  changedBy: string,
  changedFields: string[]
) {
  const message = `Patient ${patientName} data updated by ${changedBy}. Changed fields: ${changedFields.join(', ')}`;

  // Create system-wide notification for active patient
  await createNotification({
    patientId,
    type: 'PATIENT_UPDATE',
    title: 'Patient Data Updated',
    message,
    data: {
      patientId,
      patientName,
      changedBy,
      changedFields,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
}

/**
 * Create notification for new patient registration
 */
export async function createPatientRegistrationNotification(
  patientId: string,
  patientName: string,
  registeredBy: string
) {
  const message = `New patient ${patientName} registered by ${registeredBy}`;

  await createNotification({
    patientId,
    type: 'PATIENT_REGISTRATION',
    title: 'New Patient Registered',
    message,
    data: {
      patientId,
      patientName,
      registeredBy,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
}

/**
 * Create notification for patient archiving
 */
export async function createPatientArchivedNotification(
  patientId: string,
  patientName: string,
  archivedBy: string
) {
  const message = `Patient ${patientName} archived by ${archivedBy}`;

  await createNotification({
    patientId,
    type: 'PATIENT_ARCHIVED',
    title: 'Patient Archived',
    message,
    data: {
      patientId,
      patientName,
      archivedBy,
    },
  });
}

/**
 * Create notification for patient restoration
 */
export async function createPatientRestoredNotification(
  patientId: string,
  patientName: string,
  restoredBy: string
) {
  const message = `Patient ${patientName} restored from archives by ${restoredBy}`;

  await createNotification({
    patientId,
    type: 'PATIENT_RESTORED',
    title: 'Patient Restored',
    message,
    data: {
      patientId,
      patientName,
      restoredBy,
    },
  });
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
  const where: any = {
    OR: [
      { userId }, // User-specific notifications
      { userId: null }, // System-wide notifications
    ],
    isRead: unreadOnly ? false : undefined,
  };

  // Exclude expired notifications
  where.OR = [
    ...where.OR,
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ];

  return prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
