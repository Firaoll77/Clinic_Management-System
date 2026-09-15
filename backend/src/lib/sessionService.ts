import { prisma } from './prisma';
import { TokenPayload } from './auth';

/**
 * Store a refresh token in the database
 */
export async function storeRefreshToken(
  token: string,
  userId: string,
  userAgent?: string,
  ipAddress?: string
) {
  // Calculate expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });
}

/**
 * Validate a refresh token
 */
export async function validateRefreshToken(token: string): Promise<TokenPayload | null> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken) {
    return null;
  }

  // Check if token is revoked
  if (refreshToken.revokedAt) {
    return null;
  }

  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    // Revoke expired token
    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Check if user is active
  if (!refreshToken.user.isActive) {
    return null;
  }

  return {
    userId: refreshToken.user.id,
    username: refreshToken.user.username,
    role: refreshToken.user.role,
  };
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!refreshToken) {
    return false;
  }

  await prisma.refreshToken.update({
    where: { id: refreshToken.id },
    data: { revokedAt: new Date() },
  });

  return true;
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Revoke all refresh tokens for a user except one
 */
export async function revokeOtherUserTokens(
  userId: string,
  exceptToken: string
): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      token: { not: exceptToken },
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      userAgent: true,
      ipAddress: true,
    },
  });

  return sessions;
}

/**
 * Clean up expired and revoked tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

  return result.count;
}
