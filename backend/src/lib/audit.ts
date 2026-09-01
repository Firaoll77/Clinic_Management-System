import { prisma } from './prisma';

export interface AuditLogData {
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  fieldName?: string;
  before?: any;
  after?: any;
  reason?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Create a detailed audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: data.actorUserId,
        actorRole: data.actorRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        fieldName: data.fieldName,
        before: data.before ? JSON.stringify(data.before) : null,
        after: data.after ? JSON.stringify(data.after) : null,
        reason: data.reason,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

/**
 * Create audit log for field-level changes
 */
export async function createFieldChangeAuditLog(
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  fieldName: string,
  before: any,
  after: any,
  ip?: string,
  userAgent?: string
) {
  return createAuditLog({
    actorUserId,
    actorRole,
    action: 'FIELD_UPDATE',
    entityType,
    entityId,
    fieldName,
    before,
    after,
    ip,
    userAgent,
  });
}

/**
 * Create audit log for entity creation
 */
export async function createCreationAuditLog(
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  entityData: any,
  ip?: string,
  userAgent?: string
) {
  return createAuditLog({
    actorUserId,
    actorRole,
    action: 'CREATE',
    entityType,
    entityId,
    after: entityData,
    ip,
    userAgent,
  });
}

/**
 * Create audit log for entity deletion
 */
export async function createDeletionAuditLog(
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  entityData: any,
  reason?: string,
  ip?: string,
  userAgent?: string
) {
  return createAuditLog({
    actorUserId,
    actorRole,
    action: 'DELETE',
    entityType,
    entityId,
    before: entityData,
    reason,
    ip,
    userAgent,
  });
}

/**
 * Create audit log for emergency access
 */
export async function createEmergencyAccessAuditLog(
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  reason: string,
  ip?: string,
  userAgent?: string
) {
  return createAuditLog({
    actorUserId,
    actorRole,
    action: 'EMERGENCY_ACCESS',
    entityType,
    entityId,
    reason,
    ip,
    userAgent,
  });
}
