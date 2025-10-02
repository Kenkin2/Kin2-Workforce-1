import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../db';
import { productionReadinessCheck } from '../utils/env-validator';
import logger from '../utils/logger';

const router = Router();

/**
 * Liveness probe - Is the server running?
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Readiness probe - Is the server ready to accept traffic?
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    if (!dbHealth.healthy) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database unavailable',
        database: dbHealth
      });
    }
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealth.healthy,
        latency: `${dbHealth.latency}ms`,
        connections: dbHealth.connections
      }
    });
  } catch (error: any) {
    logger.error('Readiness check failed', { error: error?.message });
    res.status(503).json({
      status: 'not ready',
      error: error?.message
    });
  }
});

/**
 * Detailed health check - Comprehensive system status
 */
router.get('/health/status', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const prodCheck = productionReadinessCheck();
    
    const status = {
      server: {
        status: 'ok',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        healthy: dbHealth.healthy,
        latency: `${dbHealth.latency}ms`,
        connections: dbHealth.connections
      },
      production: {
        ready: prodCheck.ready,
        issues: prodCheck.issues,
        warnings: prodCheck.warnings
      },
      timestamp: new Date().toISOString()
    };
    
    const httpStatus = dbHealth.healthy ? 200 : 503;
    res.status(httpStatus).json(status);
  } catch (error: any) {
    logger.error('Health status check failed', { error: error?.message });
    res.status(500).json({
      status: 'error',
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
