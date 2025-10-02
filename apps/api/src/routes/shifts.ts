import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize, type AuthenticatedRequest } from '@/middleware/auth';
import { AppError } from '@/middleware/errorHandler';

const router = Router();

const createShiftSchema = z.object({
  title: z.string().min(1),
  jobId: z.string(),
  workerId: z.string(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hourlyRate: z.number().positive().optional(),
  currency: z.string().default('GBP'),
  notes: z.string().optional(),
  organizationId: z.string().optional(),
});

const updateShiftSchema = createShiftSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  breakDuration: z.number().int().min(0).optional(),
  clockInLat: z.number().optional(),
  clockInLng: z.number().optional(),
  clockOutLat: z.number().optional(),
  clockOutLng: z.number().optional(),
});

// GET /api/shifts
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      jobId, 
      workerId,
      startDate,
      endDate 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    // Filter by role
    if (req.user?.role === 'WORKER') {
      where.workerId = req.user.id;
    }
    
    // Apply filters
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (workerId && req.user?.role !== 'WORKER') where.workerId = workerId;
    
    // Date range filter
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate as string);
      if (endDate) where.scheduledStart.lte = new Date(endDate as string);
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          worker: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          job: {
            select: { id: true, title: true, status: true },
          },
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: { timesheets: true },
          },
        },
        orderBy: { scheduledStart: 'desc' },
      }),
      prisma.shift.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        shifts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/shifts
router.post('/', authenticate, authorize('CLIENT', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createShiftSchema.parse(req.body);
    
    // Verify job exists and user has permission
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, createdById: true, status: true },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const canCreateShift = 
      req.user?.role === 'ADMIN' ||
      job.createdById === req.user?.id;

    if (!canCreateShift) {
      throw new AppError('Access denied', 403);
    }

    if (job.status !== 'ACTIVE') {
      throw new AppError('Can only create shifts for active jobs', 400);
    }

    // Verify worker exists
    const worker = await prisma.user.findUnique({
      where: { id: data.workerId },
      select: { id: true, role: true },
    });

    if (!worker || worker.role !== 'WORKER') {
      throw new AppError('Invalid worker', 400);
    }

    const shift = await prisma.shift.create({
      data: {
        ...data,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
      },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true, status: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/shifts/:id/clock-in
router.put('/:id/clock-in', authenticate, authorize('WORKER'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, location } = req.body;

    const shift = await prisma.shift.findUnique({
      where: { id },
      select: { id: true, workerId: true, status: true, scheduledStart: true },
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    if (shift.workerId !== req.user?.id) {
      throw new AppError('Access denied', 403);
    }

    if (shift.status !== 'SCHEDULED') {
      throw new AppError('Shift already started or completed', 400);
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
        clockInLat: latitude,
        clockInLng: longitude,
        location: location || shift.location,
      },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({
      success: true,
      data: { shift: updatedShift },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/shifts/:id/clock-out
router.put('/:id/clock-out', authenticate, authorize('WORKER'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, notes } = req.body;

    const shift = await prisma.shift.findUnique({
      where: { id },
      select: { id: true, workerId: true, status: true, actualStart: true },
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    if (shift.workerId !== req.user?.id) {
      throw new AppError('Access denied', 403);
    }

    if (shift.status !== 'IN_PROGRESS') {
      throw new AppError('Shift not in progress', 400);
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
        clockOutLat: latitude,
        clockOutLng: longitude,
        notes: notes || shift.notes,
      },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({
      success: true,
      data: { shift: updatedShift },
    });
  } catch (error) {
    next(error);
  }
});

export { router as shiftsRouter };