import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

const isDevelopment = process.env.NODE_ENV === 'development';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      method: req.method 
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDevelopment ? 10000 : 60,
  message: 'API rate limit exceeded, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      userId: (req as any).user?.id 
    });
    res.status(429).json({
      error: 'API rate limit exceeded, please slow down.'
    });
  }
});
