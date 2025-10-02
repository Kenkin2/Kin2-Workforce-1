import { Router } from "express";
import type { Express } from "express";
import { isAuthenticated } from "../middleware/auth-guards";
import { asyncHandler, NotFoundError, ValidationError } from "../middleware/error-handler";
import { cacheMiddleware, invalidateOnMutation, CacheDomains, CacheTTL } from "../middleware/cache";
import { insertJobSchema, insertShiftSchema } from "@shared/schema";
import logger from "../utils/logger";
import { z } from "zod";

export function registerWorkforceRoutes(app: Express, services: {
  storage: any;
  notificationService: any;
}) {
  const { storage, notificationService } = services;

  // Jobs
  app.get('/api/jobs', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const jobs = await storage.getJobs();
      res.json(jobs);
    })
  );

  app.post('/api/jobs', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req: any, res) => {
      const result = insertJobSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Invalid job data', result.error.errors);
      }

      const job = await storage.createJob({
        ...result.data,
        clientId: req.user.claims.sub,
      });

      notificationService.sendJobCreatedNotification(job);
      res.json(job);
    })
  );

  app.get('/api/jobs/:id', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const job = await storage.getJob(parseInt(req.params.id));
      if (!job) {
        throw new NotFoundError('Job');
      }
      res.json(job);
    })
  );

  // Shifts
  app.post('/api/shifts', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req: any, res) => {
      const result = insertShiftSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Invalid shift data', result.error.errors);
      }
      const shift = await storage.createShift(result.data);
      res.json(shift);
    })
  );

  app.get('/api/shifts/job/:jobId', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const shifts = await storage.getShiftsByJob(parseInt(req.params.jobId));
      res.json(shifts);
    })
  );

  app.get('/api/shifts/worker/:workerId', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const shifts = await storage.getWorkerShifts(req.params.workerId);
      if (!shifts || shifts.length === 0) {
        return res.json([]);
      }
      res.json(shifts);
    })
  );

  app.get('/api/shifts', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const { status, startDate, endDate, workerId, jobId } = req.query;
      
      let shifts = await storage.getShifts();
      
      if (status) {
        shifts = shifts.filter((s: any) => s.status === status);
      }
      if (workerId) {
        shifts = shifts.filter((s: any) => s.workerId === workerId);
      }
      if (jobId) {
        shifts = shifts.filter((s: any) => s.jobId === parseInt(jobId as string));
      }
      if (startDate) {
        const start = new Date(startDate as string);
        shifts = shifts.filter((s: any) => new Date(s.startTime) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        shifts = shifts.filter((s: any) => new Date(s.endTime) <= end);
      }
      
      res.json(shifts);
    })
  );

  app.patch('/api/shifts/:id', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      const shift = await storage.updateShift(parseInt(req.params.id), req.body);
      res.json(shift);
    })
  );

  app.delete('/api/shifts/:id', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      await storage.deleteShift(parseInt(req.params.id));
      res.json({ success: true });
    })
  );

  // Recurring Shifts
  app.post("/api/recurring-shifts", 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      const recurringShift = await storage.createRecurringShift(req.body);
      res.json(recurringShift);
    })
  );

  app.get("/api/recurring-shifts", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const recurringShifts = await storage.getRecurringShifts();
      res.json(recurringShifts);
    })
  );

  app.post("/api/recurring-shifts/:id/generate", 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      const { startDate, endDate } = req.body;
      const shifts = await storage.generateShiftsFromRecurring(parseInt(req.params.id), startDate, endDate);
      res.json(shifts);
    })
  );

  // Worker Availability
  app.get("/api/worker-availability/:workerId", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const { workerId } = req.params;
      const { date } = req.query;
      
      const targetDate = date ? new Date(date as string) : new Date();
      const shifts = await storage.getWorkerShifts(workerId);
      const shiftToday = shifts.some((s: any) => {
        const shiftDate = new Date(s.startTime);
        return shiftDate.toDateString() === targetDate.toDateString();
      });
      
      res.json({
        workerId,
        date: targetDate.toISOString(),
        available: !shiftToday,
        shifts: shifts.filter((s: any) => {
          const shiftDate = new Date(s.startTime);
          return shiftDate.toDateString() === targetDate.toDateString();
        })
      });
    })
  );

  // Scheduling Conflicts
  app.get("/api/scheduling-conflicts/:workerId", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const { workerId } = req.params;
      const shifts = await storage.getWorkerShifts(workerId);
      
      const conflicts = [];
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1 = shifts[i];
          const shift2 = shifts[j];
          
          const start1 = new Date(shift1.startTime);
          const end1 = new Date(shift1.endTime);
          const start2 = new Date(shift2.startTime);
          const end2 = new Date(shift2.endTime);
          
          if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
            conflicts.push({
              shift1: shift1.id,
              shift2: shift2.id,
              type: 'overlap',
              severity: 'high'
            });
          }
        }
      }
      
      res.json({ workerId, conflicts, count: conflicts.length });
    })
  );

  // Scheduling Analytics
  app.get("/api/scheduling/analytics", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const shifts = await storage.getShifts();
      res.json({
        totalShifts: shifts.length,
        upcomingShifts: shifts.filter((s: any) => new Date(s.startTime) > new Date()).length,
        pastShifts: shifts.filter((s: any) => new Date(s.startTime) < new Date()).length,
      });
    })
  );

  // Scheduling Utilization
  app.get("/api/scheduling/utilization", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const shifts = await storage.getShifts();
      const completedShifts = shifts.filter((s: any) => s.status === 'completed');
      
      res.json({
        totalHours: shifts.reduce((acc: number, s: any) => {
          const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }, 0),
        utilization: (completedShifts.length / shifts.length) * 100 || 0
      });
    })
  );

  // Workers
  app.get('/api/workers', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const workers = await storage.getWorkers();
      res.json(workers);
    })
  );

  // Shift Templates
  app.post("/api/shift-templates", 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      const template = await storage.createShiftTemplate(req.body);
      res.json(template);
    })
  );

  app.get("/api/shift-templates", 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const templates = await storage.getShiftTemplates();
      res.json(templates);
    })
  );

  app.delete("/api/shift-templates/:id", 
    isAuthenticated,
    invalidateOnMutation({ domains: ['WORKFORCE'] }),
    asyncHandler(async (req, res) => {
      await storage.deleteShiftTemplate(parseInt(req.params.id));
      res.json({ success: true });
    })
  );

  logger.info('✅ Workforce routes registered');
}
