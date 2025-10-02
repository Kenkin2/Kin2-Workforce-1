import logger from '../utils/logger';
import type { Express } from 'express';
import { checkDatabaseHealth } from '../db';
import { systemMonitor } from '../monitoring';
import { performanceMonitor } from '../utils/performance-monitor';

export function setupHealthDashboard(app: Express) {
  app.get('/api/health/dashboard', async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const systemMetrics = systemMonitor.getMetrics();
      const performanceStats = performanceMonitor.getSummary();
      const latestMetric = systemMetrics[systemMetrics.length - 1];

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: dbHealth.healthy,
          latency: dbHealth.latency,
        },
        system: {
          cpu: latestMetric?.server.cpuUsage || 0,
          memory: latestMetric?.server.memoryUsage.heapUsed || 0,
          uptime: process.uptime(),
          nodeVersion: process.version,
        },
        performance: performanceStats,
        alerts: [],
        services: {
          api: 'operational',
          websocket: 'operational',
          stripe: 'operational',
          email: 'operational',
        },
      });
    } catch (error) {
      logger.error('Error generating health dashboard:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate health dashboard',
      });
    }
  });

  app.get('/api/health/metrics', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (name && typeof name === 'string') {
        const stats = performanceMonitor.getStats(name);
        res.json(stats);
      } else {
        const summary = performanceMonitor.getSummary();
        res.json(summary);
      }
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  app.get('/api/health/alerts', (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });
}
