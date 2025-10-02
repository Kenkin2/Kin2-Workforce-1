import { Router } from "express";
import type { Express } from "express";
import { isAuthenticated } from "../middleware/auth-guards";
import { asyncHandler } from "../middleware/error-handler";
import { cacheMiddleware, CacheDomains, CacheTTL } from "../middleware/cache";

export function registerSystemRoutes(app: Express, services: {
  storage: any;
}) {
  const { storage } = services;

  // Public Health Check - No auth, SHORT cache for load balancers
  app.get('/api/system/health',
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      };

      res.json(healthStatus);
    })
  );

  // System Status - Authenticated, SHORT cache
  app.get('/api/system/status',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const [jobs, shifts, users, timesheets] = await Promise.all([
        storage.getJobs(),
        storage.getShifts(),
        storage.getUsers(),
        storage.getTimesheets()
      ]);

      const status = {
        platform: {
          status: 'operational',
          uptime: Math.floor(process.uptime()),
          version: '1.0.0',
          environment: process.env.NODE_ENV
        },
        database: {
          connected: true,
          recordCount: {
            jobs: jobs.length,
            shifts: shifts.length,
            users: users.length,
            timesheets: timesheets.length
          }
        },
        services: {
          authentication: 'operational',
          payments: 'operational',
          notifications: 'operational',
          storage: 'operational'
        },
        timestamp: new Date().toISOString()
      };

      res.json(status);
    })
  );

  // System Metrics - Authenticated, SHORT cache for monitoring dashboards
  app.get('/api/system/metrics',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const [jobs, shifts, timesheets, users] = await Promise.all([
        storage.getJobs(),
        storage.getShifts(),
        storage.getTimesheets(),
        storage.getUsers()
      ]);

      const metrics = {
        system: {
          uptime: Math.floor(process.uptime()),
          memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        application: {
          activeJobs: jobs.filter((j: any) => j.status === 'active').length,
          activeShifts: shifts.filter((s: any) => s.status === 'active').length,
          pendingTimesheets: timesheets.filter((t: any) => t.status === 'pending').length,
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.status === 'active').length
        },
        timestamp: new Date().toISOString()
      };

      res.json(metrics);
    })
  );

  // System Recommendations - Authenticated, MEDIUM cache for AI-driven insights
  app.get('/api/system/recommendations',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const [jobs, shifts, timesheets] = await Promise.all([
        storage.getJobs(),
        storage.getShifts(),
        storage.getTimesheets()
      ]);

      const recommendations: any[] = [];

      // Analyze jobs
      const activeJobs = jobs.filter((j: any) => j.status === 'active');
      if (activeJobs.length > 50) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: `You have ${activeJobs.length} active jobs. Consider archiving completed jobs to improve performance.`,
          action: 'archive_old_jobs'
        });
      }

      // Analyze pending timesheets
      const pendingTimesheets = timesheets.filter((t: any) => t.status === 'pending');
      if (pendingTimesheets.length > 20) {
        recommendations.push({
          type: 'workflow',
          priority: 'high',
          message: `${pendingTimesheets.length} timesheets pending approval. Review and approve to process payments.`,
          action: 'review_timesheets'
        });
      }

      // Analyze shift coverage
      const upcomingShifts = shifts.filter((s: any) => 
        s.status === 'scheduled' && new Date(s.startTime) > new Date()
      );
      const unfilled = upcomingShifts.filter((s: any) => !s.workerId);
      if (unfilled.length > 10) {
        recommendations.push({
          type: 'scheduling',
          priority: 'high',
          message: `${unfilled.length} upcoming shifts are unfilled. Assign workers to avoid gaps.`,
          action: 'assign_workers'
        });
      }

      // Memory usage check
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      if (heapUsedMB > 400) {
        recommendations.push({
          type: 'system',
          priority: 'medium',
          message: `Memory usage is ${heapUsedMB}MB. Consider restarting the service during low-traffic hours.`,
          action: 'schedule_restart'
        });
      }

      res.json({
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString()
      });
    })
  );
}
