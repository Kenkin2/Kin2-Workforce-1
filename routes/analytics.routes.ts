import { Router } from "express";
import type { Express } from "express";
import { isAuthenticated } from "../middleware/auth-guards";
import { asyncHandler } from "../middleware/error-handler";
import { cacheMiddleware, invalidateOnMutation, CacheDomains, CacheTTL } from "../middleware/cache";

export function registerAnalyticsRoutes(app: Express, services: {
  storage: any;
}) {
  const { storage } = services;

  // Dashboard Stats - High traffic, cache with SHORT TTL for real-time feel
  app.get('/api/dashboard/stats',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      
      const [
        totalJobs,
        totalWorkers,
        totalClients,
        totalShifts,
        activeJobs,
        pendingTimesheets,
        completedCourses
      ] = await Promise.all([
        storage.getJobs().then((jobs: any[]) => jobs.length),
        storage.getWorkers().then((workers: any[]) => workers.length),
        storage.getClients().then((clients: any[]) => clients.length),
        storage.getShifts().then((shifts: any[]) => shifts.length),
        storage.getJobs().then((jobs: any[]) => jobs.filter((j: any) => j.status === 'active').length),
        storage.getTimesheets().then((timesheets: any[]) => 
          timesheets.filter((t: any) => t.status === 'pending').length
        ),
        storage.getCourses().then((courses: any[]) => 
          courses.filter((c: any) => c.status === 'completed' && c.userId === userId).length
        )
      ]);

      res.json({
        totalJobs,
        totalWorkers,
        totalClients,
        totalShifts,
        activeJobs,
        pendingTimesheets,
        completedCourses,
        timestamp: new Date().toISOString()
      });
    })
  );

  // Analytics Reports - Cache with MEDIUM TTL
  app.get('/api/reports/analytics',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const { startDate, endDate, type } = req.query;

      const jobs = await storage.getJobs();
      const shifts = await storage.getShifts();
      const timesheets = await storage.getTimesheets();

      let filteredData: any[] = [];
      if (type === 'jobs') {
        filteredData = jobs;
      } else if (type === 'shifts') {
        filteredData = shifts;
      } else if (type === 'timesheets') {
        filteredData = timesheets;
      }

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date();
        filteredData = filteredData.filter((item: any) => {
          const itemDate = new Date(item.createdAt || item.date || item.startTime);
          return itemDate >= start && itemDate <= end;
        });
      }

      res.json({
        type,
        count: filteredData.length,
        data: filteredData,
        dateRange: { startDate, endDate }
      });
    })
  );

  // System Metrics - Cache with SHORT TTL for near real-time monitoring
  app.get('/api/analytics/system-metrics',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      const [jobs, shifts, users] = await Promise.all([
        storage.getJobs(),
        storage.getShifts(),
        storage.getUsers()
      ]);

      res.json({
        system: {
          uptime: Math.floor(uptime),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          },
          nodeVersion: process.version,
          platform: process.platform
        },
        database: {
          totalJobs: jobs.length,
          totalShifts: shifts.length,
          totalUsers: users.length,
          activeJobs: jobs.filter((j: any) => j.status === 'active').length,
          activeShifts: shifts.filter((s: any) => s.status === 'active').length
        },
        timestamp: new Date().toISOString()
      });
    })
  );

  // Advanced Analytics - Cache with MEDIUM TTL
  app.get('/api/analytics/advanced',
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.ANALYTICS, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const { metric, period } = req.query;

      const [jobs, shifts, timesheets, payments] = await Promise.all([
        storage.getJobs(),
        storage.getShifts(),
        storage.getTimesheets(),
        storage.getPayments()
      ]);

      let result: any = {};

      if (metric === 'revenue') {
        const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        result = { metric: 'revenue', total: totalRevenue, currency: 'GBP' };
      } else if (metric === 'utilization') {
        const totalShifts = shifts.length;
        const completedShifts = shifts.filter((s: any) => s.status === 'completed').length;
        result = { 
          metric: 'utilization', 
          total: totalShifts, 
          completed: completedShifts,
          rate: totalShifts > 0 ? (completedShifts / totalShifts * 100).toFixed(2) : 0
        };
      } else {
        result = {
          jobs: jobs.length,
          shifts: shifts.length,
          timesheets: timesheets.length,
          payments: payments.length
        };
      }

      res.json({ ...result, period, timestamp: new Date().toISOString() });
    })
  );
}
