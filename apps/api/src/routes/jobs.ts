import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize, type AuthenticatedRequest } from '@/middleware/auth';
import { AppError } from '@/middleware/errorHandler';

const router = Router();

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  requirements: z.string().optional(),
  payRate: z.number().positive().optional(),
  currency: z.string().default('GBP'),
  assignedId: z.string().optional(),
  organizationId: z.string().optional(),
});

const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/jobs
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = '1', limit = '10', status, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    // Filter by role
    if (req.user?.role === 'WORKER') {
      where.assignedId = req.user.id;
    } else if (req.user?.role === 'CLIENT') {
      where.createdById = req.user.id;
    }
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assigned: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: { shifts: true, timesheets: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        jobs,
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

// POST /api/jobs
router.post('/', authenticate, authorize('CLIENT', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createJobSchema.parse(req.body);
    
    const job = await prisma.job.create({
      data: {
        ...data,
        createdById: req.user!.id,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assigned: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assigned: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        shifts: {
          include: {
            worker: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        timesheets: {
          include: {
            worker: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Check access permissions
    const canAccess = 
      req.user?.role === 'ADMIN' ||
      job.createdById === req.user?.id ||
      job.assignedId === req.user?.id;

    if (!canAccess) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/jobs/:id
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateJobSchema.parse(req.body);

    // Check if job exists and user has permission
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!existingJob) {
      throw new AppError('Job not found', 404);
    }

    const canEdit = 
      req.user?.role === 'ADMIN' ||
      existingJob.createdById === req.user?.id;

    if (!canEdit) {
      throw new AppError('Access denied', 403);
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assigned: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authenticate, authorize('CLIENT', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if job exists and user has permission
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const canDelete = 
      req.user?.role === 'ADMIN' ||
      job.createdById === req.user?.id;

    if (!canDelete) {
      throw new AppError('Access denied', 403);
    }

    // Only allow deletion if job is in DRAFT status
    if (job.status !== 'DRAFT') {
      throw new AppError('Only draft jobs can be deleted', 400);
    }

    await prisma.job.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as jobsRouter };