import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp?: string;
  path?: string;
  stack?: string;
}

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  status = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  status = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  status = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  status = 404;
  code = 'NOT_FOUND';
  details: any;

  constructor(resource: string, details?: any) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.details = details;
  }
}

export class ConflictError extends Error {
  status = 409;
  code = 'CONFLICT';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
  }
}

export class BusinessLogicError extends Error {
  status = 422;
  code = 'BUSINESS_LOGIC_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'BusinessLogicError';
    this.details = details;
  }
}

export class RateLimitError extends Error {
  status = 429;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  status = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  details: any;

  constructor(service: string, details?: any) {
    super(`External service error: ${service}`);
    this.name = 'ExternalServiceError';
    this.details = details;
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  const errorContext = {
    error: message,
    code,
    status,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.id,
    details: (err as any).details,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  if (status >= 500) {
    logger.error('Server error', errorContext);
  } else if (status >= 400) {
    logger.warn('Client error', errorContext);
  }

  if (res.headersSent) {
    return next(err);
  }

  const response: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...((err as any).details && { details: (err as any).details })
  };

  res.status(status).json(response);
}

export function notFoundHandler(req: Request, res: Response) {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  const response: ErrorResponse = {
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(404).json(response);
}

export function asyncHandler<T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createValidationError(field: string, message: string) {
  return new ValidationError('Validation failed', { field, message });
}

export function createNotFoundError(resource: string, id?: string | number) {
  return new NotFoundError(resource, id ? { id } : undefined);
}
