import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import logger from '../utils/logger';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * CSRF Protection using Double Submit Cookie pattern
 * - Generates a random token and sets it as both a cookie and expects it in request header
 * - Validates that cookie and header match for state-changing requests
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Generate token if not exists
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript to include in requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
  }
  next();
}

/**
 * Validate CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for webhook endpoints (they use signature verification)
  if (req.path.includes('/webhook')) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed: missing token', {
      method: req.method,
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
      ip: req.ip
    });
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'Missing CSRF token'
    });
  }

  if (cookieToken !== headerToken) {
    logger.warn('CSRF validation failed: token mismatch', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'Invalid CSRF token'
    });
  }

  next();
}

/**
 * Endpoint to get CSRF token for client
 */
export function getCsrfToken(req: Request, res: Response) {
  const token = req.cookies[CSRF_COOKIE_NAME];
  if (!token) {
    return res.status(500).json({ error: 'CSRF token not available' });
  }
  res.json({ csrfToken: token });
}
