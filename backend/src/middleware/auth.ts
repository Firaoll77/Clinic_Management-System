import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Get token from Authorization header
 */
function getToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid token found',
      });
    }

    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Authorization failed',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
}
