import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthenticationError, AuthorizationError } from './error-handler';

/**
 * Enhanced authentication middleware with proper role-based access control
 */

// Extend Express Request type using module augmentation
// Note: This extends the base User type from passport/express
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      role?: 'admin' | 'client' | 'worker';
      claims?: any;
    }
  }
}

// Extend session data
declare module 'express-session' {
  interface SessionData {
    user?: any;
  }
}

export type AuthenticatedRequest = Request;

/**
 * Require authenticated user (no demo access)
 * Use this for sensitive operations and write endpoints
 */
export function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Only allow real authentication (Replit Auth or local auth)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Check for local auth session
  if (req.session?.user && req.session.user.id && !req.session.user.isDemo) {
    req.user = req.session.user;
    return next();
  }
  
  logger.warn('Authentication required', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  throw new AuthenticationError('Authentication required');
}

/**
 * Require specific role(s)
 * Use this for role-restricted operations
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    if (!req.user && !req.session?.user) {
      logger.warn('Role check failed: not authenticated', {
        method: req.method,
        path: req.path,
        requiredRoles: allowedRoles
      });
      throw new AuthenticationError('Authentication required');
    }
    
    const user = req.user || req.session?.user;
    const userRole = user?.role || 'worker';
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role check failed: insufficient permissions', {
        method: req.method,
        path: req.path,
        userRole,
        requiredRoles: allowedRoles,
        userId: user?.id
      });
      throw new AuthorizationError(`Insufficient permissions. Required role(s): ${allowedRoles.join(', ')}`);
    }
    
    next();
  };
}

/**
 * Require admin role
 * Convenience wrapper for admin-only endpoints
 */
export const isAdmin = requireRole('admin');

/**
 * Require client or admin role
 * For endpoints that clients and admins can access
 */
export const isClientOrAdmin = requireRole(['client', 'admin']);

/**
 * DEPRECATED: Only use for read-only, non-sensitive endpoints
 * Allows both authenticated users and demo sessions
 * 
 * WARNING: Do NOT use this for:
 * - Write operations (POST, PUT, PATCH, DELETE)
 * - Sensitive data access
 * - Business-critical operations
 */
export function isAuthenticatedOrDemo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check for demo session
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  
  // Check for regular authentication
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
  logger.warn('Authentication required (demo or real)', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  throw new AuthenticationError('Authentication required');
}
