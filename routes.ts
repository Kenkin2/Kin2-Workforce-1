import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertJobSchema, insertShiftSchema, insertTimesheetSchema, insertPaymentSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq, count } from "drizzle-orm";
import { notificationService } from "./notifications";
import { z } from "zod";
import { paymentProcessor } from "./payments";
import { checkDatabaseHealth } from "./db";
import { systemMonitor } from "./monitoring";
import { performanceMiddleware, checkRateLimit } from "./performance";
import { workforceAIService } from "./ai";
import { integrationManager } from "./integrations";
import { realTimeNotificationService } from "./realtime-notifications";
import { pricingService } from "./services/pricing-service";
import { billingAutomation } from "./services/billing-automation";
import { createActionExecutionService } from "./services/action-execution-service";
import { createIssueDetectionScheduler } from "./services/issue-detection-scheduler";
import logger from './utils/logger';
import { cacheMiddleware, invalidateCacheMiddleware } from './middleware/cache';
import { 
  isAuthenticated as requireAuth,
  isAdmin, 
  isClientOrAdmin,
  isAuthenticatedOrDemo 
} from './middleware/auth-guards';

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
if (!process.env.DATABASE_URL) {
  throw new Error('Missing required DATABASE_URL');
}

// Initialize Stripe with validated configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Error logging endpoint for client-side errors
  app.post('/api/errors/log', async (req, res) => {
    try {
      const errorData = req.body;
      logger.error('[Client Error]', {
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
        timestamp: errorData.timestamp,
        userAgent: errorData.userAgent,
      });
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error logging client error:', error);
      res.status(500).json({ success: false });
    }
  });

  // Performance monitoring middleware
  app.use(performanceMiddleware);
  
  // Setup authentication middleware (database already validated by initializer)
  setupAuth(app);
  logger.info('✅ Authentication middleware configured');
  
  // Start system monitoring
  systemMonitor.startMonitoring();
  logger.info('✅ System monitoring started');

  // Setup health dashboard routes
  const { setupHealthDashboard } = await import('./routes/health-dashboard');
  setupHealthDashboard(app);

  // Import logging and compliance services
  const { loggingService } = await import('./services/logging-service');
  const { regulatoryComplianceService } = await import('./services/regulatory-compliance');

  // Register modular route handlers
  const { registerComplianceRoutes } = await import('./routes/compliance.routes');
  const { registerWorkforceRoutes } = await import('./routes/workforce.routes');
  const { registerPaymentsRoutes } = await import('./routes/payments.routes');
  const { registerAnalyticsRoutes } = await import('./routes/analytics.routes');
  const { registerSystemRoutes } = await import('./routes/system.routes');

  // Register domain-specific routes
  registerComplianceRoutes(app, { regulatoryComplianceService, loggingService, storage });
  registerWorkforceRoutes(app, { storage, notificationService });
  registerPaymentsRoutes(app, { storage, paymentProcessor, stripe, pricingService });
  registerAnalyticsRoutes(app, { storage });
  registerSystemRoutes(app, { storage });
  
  logger.info('✅ All API routes registered successfully');

  // Global Search endpoint
  app.get('/api/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json({ results: [] });
      }

      const searchTerm = q.trim();
      
      if (searchTerm.length < 2) {
        return res.json({ results: [] });
      }

      // Search across multiple entities
      const [jobs, workers, clients, timesheets] = await Promise.all([
        storage.searchJobs(searchTerm),
        storage.searchWorkers(searchTerm),
        storage.searchClients(searchTerm),
        storage.searchTimesheets(searchTerm),
      ]);

      // Format results with consistent structure
      const results = [
        ...jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          subtitle: `${job.location || 'Location not specified'} • ${job.jobType} ${job.salary ? `• £${parseInt(job.salary).toLocaleString()}` : ''}`,
          type: 'job' as const,
          url: `/jobs`,
          metadata: { status: job.status }
        })),
        ...workers.map((worker: any) => ({
          id: worker.id,
          title: `${worker.firstName} ${worker.lastName}`,
          subtitle: `${worker.role} • ${worker.karmaCoins} KC`,
          type: 'worker' as const,
          url: `/workers`,
          metadata: { role: worker.role, email: worker.email }
        })),
        ...clients.map((client: any) => ({
          id: client.id,
          title: `${client.firstName} ${client.lastName}`,
          subtitle: `Client • ${client.email}`,
          type: 'client' as const,
          url: `/clients`,
          metadata: { role: client.role, email: client.email }
        })),
        ...timesheets.map((timesheet: any) => ({
          id: timesheet.id,
          title: `Timesheet #${timesheet.id.slice(0, 8)}`,
          subtitle: `Worker ID: ${timesheet.workerId} • ${timesheet.status}`,
          type: 'timesheet' as const,
          url: `/timesheets`,
          metadata: { status: timesheet.status }
        })),
      ];

      // Each category already limited to 10 results in storage layer
      res.json({ results });
    } catch (error) {
      logger.error('Error in global search:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  // Note: GET /api/timesheets/pending is kept here as it's unique (not in payments.routes.ts)
  app.get('/api/timesheets/pending', isAuthenticated, async (req, res) => {
    try {
      const timesheets = await storage.getPendingTimesheets();
      res.json(timesheets);
    } catch (error) {
      console.error("Error fetching pending timesheets:", error);
      res.status(500).json({ message: "Failed to fetch pending timesheets" });
    }
  });

  // Clients routes
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getUsersByRole('client');
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Comprehensive User Management API Endpoints
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      // Only admins can view all users
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin required." });
      }
      
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        karmaCoins: users.karmaCoins,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      // Only admins can update user roles
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin required." });
      }
      
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'client', 'worker'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be admin, client, or worker." });
      }
      
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
      
      const updatedUser = await db.select().from(users).where(eq(users.id, id));
      res.json({ message: "User role updated successfully", user: updatedUser[0] });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/users/stats', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      // Only admins can view user statistics
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin required." });
      }
      
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [adminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
      const [clientCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'client'));
      const [workerCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'worker'));
      
      res.json({
        totalUsers: totalUsers.count,
        adminCount: adminCount.count,
        clientCount: clientCount.count,
        workerCount: workerCount.count,
        roleDistribution: {
          admin: adminCount.count,
          client: clientCount.count,
          worker: workerCount.count
        }
      });
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Courses routes
  app.get('/api/courses', isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = req.params.id;
      const userId = req.user.claims.sub;
      
      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const completion = await storage.createCourseCompletion({
        userId,
        courseId,
        score: req.body.score || 100
      });
      
      // Award KarmaCoins
      await storage.updateUserKarmaCoins(userId, course.karmaReward);
      
      // Create activity
      await storage.createActivity({
        userId,
        type: "course_completed",
        description: `Completed course: ${course.title} and earned ${course.karmaReward} KarmaCoins`,
        metadata: { courseId, karmaReward: course.karmaReward }
      });
      
      res.json(completion);
    } catch (error) {
      console.error("Error completing course:", error);
      res.status(500).json({ message: "Failed to complete course" });
    }
  });

  // Activities routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Payments routes
  app.get('/api/payments/worker/:workerId', isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByWorker(req.params.workerId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Enhanced payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, workerId, timesheetId, metadata } = req.body;
      
      const paymentIntent = await paymentProcessor.createPaymentIntent({
        amount,
        workerId,
        timesheetId,
        metadata
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Enhanced subscription management
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: 'User email is required for subscription' });
      }

      const { trialDays, priceId } = req.body;
      
      const subscription = await paymentProcessor.createOrUpdateSubscription({
        userId,
        email: user.email,
        priceId,
        trialDays
      });
      
      res.json(subscription);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/webhooks/stripe', async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    
    try {
      await paymentProcessor.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error:', error);
      res.status(400).json({ message: 'Webhook error: ' + error.message });
    }
  });

  // Pricing Management API Routes
  
  // Get all active pricing plans
  app.get('/api/pricing/plans', async (req, res) => {
    try {
      const plans = await pricingService.getActivePlans();
      res.json(plans);
    } catch (error) {
      logger.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Failed to fetch pricing plans' });
    }
  });

  // Calculate pricing for specific organization
  app.post('/api/pricing/calculate', isAuthenticated, async (req, res) => {
    try {
      const { planId, employeeCount, organizationId } = req.body;
      
      if (!planId || !employeeCount) {
        return res.status(400).json({ message: 'Plan ID and employee count are required' });
      }

      const pricing = await pricingService.calculatePrice(planId, employeeCount, organizationId);
      res.json(pricing);
    } catch (error) {
      logger.error('Error calculating pricing:', error);
      res.status(500).json({ message: 'Failed to calculate pricing' });
    }
  });

  // Create organization subscription
  app.post('/api/pricing/subscribe', isAuthenticated, async (req, res) => {
    try {
      const { organizationId, planId, employeeCount = 1 } = req.body;
      
      if (!organizationId || !planId) {
        return res.status(400).json({ message: 'Organization ID and plan ID are required' });
      }

      const subscription = await pricingService.createOrganizationSubscription(
        organizationId, 
        planId, 
        employeeCount
      );
      
      res.json(subscription);
    } catch (error) {
      logger.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Update employee count for existing subscription
  app.patch('/api/pricing/subscription/:orgId/employees', isAuthenticated, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { employeeCount } = req.body;
      
      if (!employeeCount || employeeCount < 1) {
        return res.status(400).json({ message: 'Valid employee count is required' });
      }

      await pricingService.updateEmployeeCount(orgId, employeeCount);
      res.json({ success: true, employeeCount });
    } catch (error) {
      logger.error('Error updating employee count:', error);
      res.status(500).json({ message: 'Failed to update employee count' });
    }
  });

  // Get organization subscription details
  app.get('/api/pricing/subscription/:orgId', isAuthenticated, async (req, res) => {
    try {
      const { orgId } = req.params;
      const subscription = await pricingService.getOrganizationSubscription(orgId);
      res.json(subscription);
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Get usage metrics for organization
  app.get('/api/pricing/usage/:orgId', isAuthenticated, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { billingPeriod } = req.query;
      
      const usage = await pricingService.getOrganizationUsage(
        orgId, 
        billingPeriod as string
      );
      res.json(usage);
    } catch (error) {
      logger.error('Error fetching usage:', error);
      res.status(500).json({ message: 'Failed to fetch usage' });
    }
  });

  // Manual billing trigger (admin only)
  app.post('/api/pricing/billing/process/:orgId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { orgId } = req.params;
      await pricingService.processBilling(orgId);
      res.json({ success: true, message: 'Billing processed successfully' });
    } catch (error) {
      logger.error('Error processing billing:', error);
      res.status(500).json({ message: 'Failed to process billing' });
    }
  });

  // Get billing metrics (admin only)
  app.get('/api/pricing/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const metrics = await billingAutomation.getBillingMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching billing metrics:', error);
      res.status(500).json({ message: 'Failed to fetch billing metrics' });
    }
  });

  // Payment metrics endpoint
  app.get('/api/payments/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = paymentProcessor.getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching payment metrics:', error);
      res.status(500).json({ message: 'Failed to fetch payment metrics' });
    }
  });

  // Original subscription management (keeping for backward compatibility)
  app.post('/api/create-subscription-legacy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: 'User email is required for subscription' });
      }

      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          metadata: {
            userId: userId,
            platform: "kin2_workforce"
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.upsertUser({
          ...user,
          stripeCustomerId: customerId
        });
      }

      // Create or get product
      let product;
      const products = await stripe.products.list({ limit: 1 });
      if (products.data.length > 0) {
        product = products.data[0];
      } else {
        product = await stripe.products.create({
          name: "Kin2 Workforce Premium"
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'gbp',
            product: product.id,
            unit_amount: 2999,
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.upsertUser({
        ...user,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Reports and analytics
  app.get('/api/reports/hmrc-csv', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Generate HMRC-compliant CSV data
      const payments = await storage.getPaymentsByWorker('all'); // This would need to be implemented
      const csvData = generateHMRCCSV(payments);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=hmrc-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);
    } catch (error: any) {
      console.error("Error generating HMRC report:", error);
      res.status(500).json({ message: "Error generating report: " + error.message });
    }
  });

  // Compliance and GDPR
  app.post('/api/gdpr/data-export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Compile all user data for GDPR export
      const userData = {
        profile: user,
        jobs: await storage.getJobsByClient(userId),
        timesheets: await storage.getTimesheetsByWorker(userId),
        payments: await storage.getPaymentsByWorker(userId),
        courses: await storage.getUserCourseCompletions(userId),
        activities: await storage.getRecentActivities(100) // All activities for this user
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=user-data-export-${userId}.json`);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // AI Routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      if (!message?.trim()) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Timeout after 10 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 10000)
      );

      // Get user context for personalized responses
      const user = await storage.getUser(userId);
      const enhancedContext = {
        ...context,
        userRole: user?.role || 'admin',
        timestamp: new Date().toISOString()
      };

      const aiPromise = workforceAIService.chatAssistant(message, userId || '', enhancedContext);
      const response = await Promise.race([aiPromise, timeoutPromise]);
      
      res.json(response);
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        message: "I'm temporarily unavailable. Please try again in a moment.",
        suggestions: ["Try AI Intelligence dashboard", "Check platform features", "Review workforce analytics"]
      });
    }
  });

  app.post('/api/ai/job-match', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.body;
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const workers = await storage.getUsersByRole('worker');
      const matches = await workforceAIService.generateJobMatch(job, workers as any);
      res.json(matches);
    } catch (error) {
      console.error("AI job matching error:", error);
      res.status(500).json({ message: "Failed to generate job matches" });
    }
  });

  app.post('/api/ai/schedule-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const shifts = await storage.getShiftsByJob(req.body.jobId || '');
      const workers = await storage.getUsersByRole('worker');
      const recommendations = await workforceAIService.generateScheduleRecommendation(shifts as any, workers as any);
      res.json(recommendations);
    } catch (error) {
      console.error("AI scheduling error:", error);
      res.status(500).json({ message: "Failed to generate schedule recommendations" });
    }
  });

  app.get('/api/ai/insights', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      const insights = await workforceAIService.generateInsights(stats as any);
      res.json({ insights });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // AI Automation Recommendations
  app.get('/api/ai/automation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Get simplified data for automation analysis
      const jobs = await storage.getJobs();
      const stats = await storage.getDashboardStats();
      
      const workforceData = {
        userRole: user?.role || 'admin',
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j: any) => j.status === 'active').length,
        stats: stats
      };

      const recommendations = await workforceAIService.generateAutomationRecommendations(workforceData as any);
      res.json({ recommendations });
    } catch (error) {
      console.error("AI automation error:", error);
      res.status(500).json({ message: "Failed to generate automation recommendations" });
    }
  });

  // Integration Management Routes
  app.get('/api/integrations', isAuthenticated, async (req, res) => {
    try {
      const integrations = [
        {
          id: 'replit-auth',
          name: 'Replit Authentication',
          status: 'connected',
          category: 'core',
          healthCheck: true
        },
        {
          id: 'neon-database',
          name: 'Neon PostgreSQL',
          status: 'connected', 
          category: 'core',
          healthCheck: true
        },
        {
          id: 'stripe-payments',
          name: 'Stripe Payments',
          status: process.env.STRIPE_SECRET_KEY ? 'connected' : 'available',
          category: 'payments',
          healthCheck: !!process.env.STRIPE_SECRET_KEY
        },
        {
          id: 'openai-ai',
          name: 'OpenAI Intelligence',
          status: process.env.OPENAI_API_KEY ? 'connected' : 'available',
          category: 'ai',
          healthCheck: !!process.env.OPENAI_API_KEY
        }
      ];
      
      res.json({ integrations });
    } catch (error) {
      console.error("Integration status error:", error);
      res.status(500).json({ message: "Failed to fetch integration status" });
    }
  });

  // Webhook Management
  app.post('/api/integrations/webhook', isAuthenticated, async (req: any, res) => {
    try {
      const { service, event, data } = req.body;
      
      // Process webhook based on service
      switch (service) {
        case 'stripe':
          // Already handled by existing Stripe webhook
          break;
        case 'slack':
          // Process Slack webhooks
          logger.info('Slack webhook received:', event, data);
          break;
        case 'twilio':
          // Process Twilio webhooks  
          logger.info('Twilio webhook received:', event, data);
          break;
        default:
          logger.info('Unknown webhook service:', service);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // GDPR Compliance Routes
  app.post('/api/gdpr/cookie-consent', async (req: any, res) => {
    try {
      const { gdprService } = await import('./gdpr.js');
      const { consents } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      const sessionId = req.sessionID;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const consent = await gdprService.recordCookieConsent({
        userId,
        sessionId,
        consents,
        ipAddress,
        userAgent,
      });

      res.json({ success: true, consent });
    } catch (error) {
      console.error("Cookie consent error:", error);
      res.status(500).json({ message: "Failed to record consent" });
    }
  });

  app.get('/api/gdpr/cookie-consent', async (req: any, res) => {
    try {
      const { gdprService } = await import('./gdpr.js');
      const userId = (req.user as any)?.claims?.sub;
      const sessionId = req.sessionID;

      const consent = await gdprService.getCookieConsent(userId, sessionId);
      res.json(consent);
    } catch (error) {
      console.error("Get cookie consent error:", error);
      res.status(500).json({ message: "Failed to get consent" });
    }
  });

  app.post('/api/gdpr/data-request', isAuthenticated, async (req: any, res) => {
    try {
      const { gdprService } = await import('./gdpr.js');
      const { requestType, requestDetails } = req.body;
      const userId = req.user.claims.sub;

      const request = await gdprService.submitDataRequest({
        userId,
        requestType,
        requestDetails,
        verificationMethod: 'authenticated_session',
      });

      res.json({ success: true, request });
    } catch (error) {
      console.error("Data request error:", error);
      res.status(500).json({ message: "Failed to submit data request" });
    }
  });

  app.get('/api/gdpr/privacy-data', isAuthenticated, async (req: any, res) => {
    try {
      const { gdprService } = await import('./gdpr.js');
      const userId = req.user.claims.sub;

      const privacyData = await gdprService.getUserPrivacyData(userId);
      res.json(privacyData);
    } catch (error) {
      console.error("Privacy data error:", error);
      res.status(500).json({ message: "Failed to get privacy data" });
    }
  });

  app.get('/api/gdpr/export-data', isAuthenticated, async (req: any, res) => {
    try {
      const { gdprService } = await import('./gdpr.js');
      const userId = req.user.claims.sub;

      const exportData = await gdprService.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-data-export-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Data export error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Admin GDPR routes
  app.get('/api/gdpr/compliance-report', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { gdprService } = await import('./gdpr.js');
      const { start, end } = req.query;
      
      const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end) : new Date();

      const report = await gdprService.generateComplianceReport(startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error("Compliance report error:", error);
      res.status(500).json({ message: "Failed to generate compliance report" });
    }
  });

  // Integration Testing Routes
  app.get('/api/integrations/health', async (req, res) => {
    try {
      const health = await integrationManager.checkAllIntegrations();
      res.json(health);
    } catch (error) {
      console.error("Error checking integration health:", error);
      res.status(500).json({ message: "Failed to check integration health" });
    }
  });

  app.post('/api/integrations/test', isAuthenticated, async (req, res) => {
    try {
      const testResults = await integrationManager.runIntegrationTests();
      res.json(testResults);
    } catch (error) {
      console.error("Error running integration tests:", error);
      res.status(500).json({ message: "Failed to run integration tests" });
    }
  });

  app.get('/api/testing/health-check', async (req, res) => {
    try {
      const { testingFramework } = await import('./testing.js');
      const healthCheck = await testingFramework.runQuickHealthCheck();
      res.json(healthCheck);
    } catch (error) {
      console.error("Error running health check:", error);
      res.status(500).json({ message: "Failed to run health check" });
    }
  });

  app.post('/api/testing/run-all', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { testingFramework } = await import('./testing.js');
      const allTests = await testingFramework.runAllTests();
      const report = await testingFramework.generateTestReport();
      
      res.json({ tests: allTests, report });
    } catch (error) {
      console.error("Error running all tests:", error);
      res.status(500).json({ message: "Failed to run tests" });
    }
  });

  // Workflow Automation Routes
  app.get('/api/workflows/rules', isAuthenticated, async (req: any, res) => {
    try {
      const { workflowEngine } = await import('./workflow-automation.js');
      const rules = workflowEngine.getRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching workflow rules:", error);
      res.status(500).json({ message: "Failed to fetch workflow rules" });
    }
  });

  app.post('/api/workflows/rules', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { workflowEngine } = await import('./workflow-automation.js');
      await workflowEngine.addRule(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating workflow rule:", error);
      res.status(500).json({ message: "Failed to create workflow rule" });
    }
  });

  app.get('/api/workflows/executions', isAuthenticated, async (req: any, res) => {
    try {
      const { workflowEngine } = await import('./workflow-automation.js');
      const executions = workflowEngine.getExecutions(50);
      const stats = workflowEngine.getExecutionStats();
      res.json({ executions, stats });
    } catch (error) {
      console.error("Error fetching workflow executions:", error);
      res.status(500).json({ message: "Failed to fetch workflow executions" });
    }
  });

  app.post('/api/workflows/trigger/:ruleId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { workflowEngine } = await import('./workflow-automation.js');
      const execution = await workflowEngine.executeRule(req.params.ruleId, req.body);
      res.json(execution);
    } catch (error) {
      console.error("Error executing workflow rule:", error);
      res.status(500).json({ message: "Failed to execute workflow rule" });
    }
  });

  // Real-time Notification Routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationIds } = req.body;
      
      await storage.markNotificationsAsRead(userId, notificationIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.get('/api/notifications/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { realTimeNotificationService } = await import('./realtime-notifications.js');
      const stats = realTimeNotificationService.getConnectionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({ message: "Failed to fetch notification stats" });
    }
  });

  // Deployment Configuration Routes
  app.get('/api/deployment/status', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { deploymentManager } = await import('./deployment-config.js');
      const readiness = await deploymentManager.validateDeploymentReadiness();
      const report = await deploymentManager.generateDeploymentReport();
      
      res.json({ readiness, report });
    } catch (error) {
      console.error("Error checking deployment status:", error);
      res.status(500).json({ message: "Failed to check deployment status" });
    }
  });

  app.get('/api/deployment/config', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { deploymentManager } = await import('./deployment-config.js');
      const config = deploymentManager.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching deployment config:", error);
      res.status(500).json({ message: "Failed to fetch deployment config" });
    }
  });

  app.get('/api/deployment/docker-files', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { deploymentManager } = await import('./deployment-config.js');
      const files = {
        dockerfile: deploymentManager.generateDockerfile(),
        dockerCompose: deploymentManager.generateDockerCompose(),
        kubernetes: deploymentManager.generateKubernetesManifests(),
        nginx: deploymentManager.generateNginxConfig(),
        deployScript: deploymentManager.generateDeploymentScript()
      };
      
      res.json(files);
    } catch (error) {
      console.error("Error generating deployment files:", error);
      res.status(500).json({ message: "Failed to generate deployment files" });
    }
  });

  // API route handlers are now registered
  logger.info('✅ All API routes registered successfully');

function generateHMRCCSV(payments: any[]): string {
  const headers = ['Date', 'Worker ID', 'Worker Name', 'Amount', 'Tax', 'NI', 'Net Pay'];
  const rows = payments.map(payment => [
    new Date(payment.createdAt).toISOString().split('T')[0],
    payment.workerId,
    'Worker Name', // Would need to join with user data
    payment.amount,
    (parseFloat(payment.amount) * 0.2).toFixed(2), // 20% tax estimate
    (parseFloat(payment.amount) * 0.12).toFixed(2), // 12% NI estimate
    (parseFloat(payment.amount) * 0.68).toFixed(2) // Net after tax and NI
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

  // Advanced Enterprise Features Routes
  
  // AI Analytics Routes
  app.get('/api/ai/insights', isAuthenticated, async (req, res) => {
    try {
      const { aiAnalyticsService } = await import('./ai-analytics');
      const insights = await aiAnalyticsService.generateWorkforceInsights();
      res.json(insights);
    } catch (error) {
      logger.error('AI insights error:', error);
      res.status(500).json({ message: 'Failed to generate insights' });
    }
  });

  app.get('/api/ai/metrics', isAuthenticated, async (req, res) => {
    try {
      const { aiAnalyticsService } = await import('./ai-analytics');
      const metrics = await aiAnalyticsService.calculateWorkforceMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('AI metrics error:', error);
      res.status(500).json({ message: 'Failed to calculate metrics' });
    }
  });

  // Business Intelligence Routes
  app.get('/api/bi/forecast/:type', isAuthenticated, async (req, res) => {
    try {
      const { businessIntelligenceService } = await import('./business-intelligence');
      const { type } = req.params;
      const periods = parseInt(req.query.periods as string) || 6;
      const forecast = await businessIntelligenceService.generateForecast(type as any, periods);
      res.json(forecast);
    } catch (error) {
      logger.error('Forecast error:', error);
      res.status(500).json({ message: 'Failed to generate forecast' });
    }
  });

  app.post('/api/bi/custom-report', isAuthenticated, async (req, res) => {
    try {
      const { businessIntelligenceService } = await import('./business-intelligence');
      const report = await businessIntelligenceService.createCustomReport(req.body);
      res.json(report);
    } catch (error) {
      logger.error('Custom report error:', error);
      res.status(500).json({ message: 'Failed to create custom report' });
    }
  });

  // API Marketplace Routes
  app.get('/api/marketplace/apps', isAuthenticated, async (req, res) => {
    try {
      const { apiMarketplaceService } = await import('./api-marketplace');
      const category = req.query.category as string;
      const apps = await apiMarketplaceService.getMarketplaceApps(category);
      res.json(apps);
    } catch (error) {
      logger.error('Marketplace apps error:', error);
      res.status(500).json({ message: 'Failed to get marketplace apps' });
    }
  });

  app.post('/api/marketplace/install/:appId', isAuthenticated, async (req, res) => {
    try {
      const { apiMarketplaceService } = await import('./api-marketplace');
      const { appId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      await apiMarketplaceService.installApp(appId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error('App installation error:', error);
      res.status(500).json({ message: 'Failed to install app' });
    }
  });

  // Mobile API Routes
  app.get('/api/mobile/data', isAuthenticated, async (req, res) => {
    try {
      const { mobileAPIService } = await import('./mobile-api');
      const userId = (req.user as any)?.claims?.sub;
      const data = await mobileAPIService.getOptimizedMobileData(userId);
      res.json(data);
    } catch (error) {
      logger.error('Mobile data error:', error);
      res.status(500).json({ message: 'Failed to get mobile data' });
    }
  });

  app.get('/api/mobile/nearby-jobs', isAuthenticated, async (req, res) => {
    try {
      const { mobileAPIService } = await import('./mobile-api');
      const userId = (req.user as any)?.claims?.sub;
      const radius = parseInt(req.query.radius as string) || 10;
      const jobs = await mobileAPIService.getWorkerNearbyJobs(userId, radius);
      res.json(jobs);
    } catch (error) {
      logger.error('Nearby jobs error:', error);
      res.status(500).json({ message: 'Failed to get nearby jobs' });
    }
  });

  app.post('/api/mobile/clock', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { action, location } = req.body;
      
      // Process clock in/out
      console.log(`⏰ ${action === 'in' ? 'Clock in' : 'Clock out'} for user ${userId}`);
      
      res.json({ 
        success: true, 
        timestamp: new Date(),
        action: action === 'in' ? 'clocked_in' : 'clocked_out'
      });
    } catch (error) {
      logger.error('Clock action error:', error);
      res.status(500).json({ message: 'Failed to process clock action' });
    }
  });

  // Enterprise Backup Routes
  app.post('/api/enterprise/backup', isAuthenticated, async (req, res) => {
    try {
      const { enterpriseBackupService } = await import('./enterprise-backup');
      const userId = (req.user as any)?.claims?.sub;
      const backup = await enterpriseBackupService.createFullBackup(userId);
      res.json(backup);
    } catch (error) {
      logger.error('Backup creation error:', error);
      res.status(500).json({ message: 'Failed to create backup' });
    }
  });

  app.get('/api/enterprise/backup/analytics', isAuthenticated, async (req, res) => {
    try {
      const { enterpriseBackupService } = await import('./enterprise-backup');
      const userId = (req.user as any)?.claims?.sub;
      const analytics = await enterpriseBackupService.getBackupAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      logger.error('Backup analytics error:', error);
      res.status(500).json({ message: 'Failed to get backup analytics' });
    }
  });

  // Payroll and Reporting routes
  app.post('/api/payroll/generate', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { payrollService } = await import('./services/payroll-service');
      const { startDate, endDate } = req.body;
      
      const payrollData = await payrollService.generatePayrollForPeriod(
        new Date(startDate), 
        new Date(endDate)
      );
      
      await payrollService.savePayrollRecords(
        payrollData, 
        new Date(startDate), 
        new Date(endDate)
      );
      
      res.json({
        success: true,
        recordsGenerated: payrollData.length,
        totalGrossPay: payrollData.reduce((sum, p) => sum + p.grossPay, 0),
        totalNetPay: payrollData.reduce((sum, p) => sum + p.netPay, 0)
      });
    } catch (error) {
      console.error("Payroll generation error:", error);
      res.status(500).json({ message: "Failed to generate payroll" });
    }
  });

  app.get('/api/payroll/records', isAuthenticated, async (req: any, res) => {
    try {
      const { payrollService } = await import('./services/payroll-service');
      const { year, month, workerId } = req.query;
      
      if (workerId) {
        const records = await payrollService.getWorkerPayrollRecords(
          workerId, 
          parseInt(year || new Date().getFullYear().toString()),
          month ? parseInt(month) : undefined
        );
        res.json(records);
      } else {
        // Admin view - get all records
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "Admin access required" });
        }
        
        const records = await payrollService.getPayrollForHMRC(year || "2024-25");
        res.json(records);
      }
    } catch (error) {
      console.error("Payroll records error:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post('/api/reports/hmrc-csv', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { hmrcService } = await import('./services/hmrc-service');
      const { taxYear, payPeriod } = req.body;
      
      const csvData = await hmrcService.generateFPSSubmission(taxYear, payPeriod);
      const submission = await hmrcService.saveHMRCSubmission(
        "rti_fps", 
        taxYear, 
        payPeriod, 
        csvData
      );
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="HMRC_FPS_${taxYear}_${payPeriod}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("HMRC CSV generation error:", error);
      res.status(500).json({ message: "Failed to generate HMRC CSV" });
    }
  });

  app.get('/api/payslips/:workerId/:payrollRecordId', isAuthenticated, async (req: any, res) => {
    try {
      const { payslipService } = await import('./services/payslip-service');
      const { workerId, payrollRecordId } = req.params;
      
      // Check if user can access this payslip
      if (req.user.role !== 'admin' && req.user.claims.sub !== workerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const payslipData = await payslipService.generatePayslip(workerId, payrollRecordId);
      
      if (!payslipData) {
        return res.status(404).json({ message: "Payslip not found" });
      }
      
      const html = payslipService.generatePayslipHTML(payslipData);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Payslip generation error:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  app.get('/api/reports/payroll-summary', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { hmrcService } = await import('./services/hmrc-service');
      const { startDate, endDate } = req.query;
      
      const report = await hmrcService.generatePayrollReport(
        new Date(startDate || new Date().toISOString()),
        new Date(endDate || new Date().toISOString())
      );
      
      res.json(report);
    } catch (error) {
      console.error("Payroll summary error:", error);
      res.status(500).json({ message: "Failed to generate payroll summary" });
    }
  });

  app.get('/api/reports/p60/:workerId/:taxYear', isAuthenticated, async (req: any, res) => {
    try {
      const { hmrcService } = await import('./services/hmrc-service');
      const { workerId, taxYear } = req.params;
      
      // Check if user can access this P60
      if (req.user.role !== 'admin' && req.user.claims.sub !== workerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const p60Data = await hmrcService.generateP60Data(workerId, taxYear);
      res.json(p60Data);
    } catch (error) {
      console.error("P60 generation error:", error);
      res.status(500).json({ message: "Failed to generate P60" });
    }
  });

  // Education System API Routes
  const { educationService } = await import('./services/education-service');
  
  // Qualifications endpoints
  app.post('/api/education/qualifications', isAuthenticated, async (req: any, res) => {
    try {
      const qualificationData = {
        ...req.body,
        userId: req.user.claims.sub,
      };
      const qualification = await educationService.createQualification(qualificationData);
      res.json(qualification);
    } catch (error) {
      console.error("Error creating qualification:", error);
      res.status(500).json({ message: "Failed to create qualification" });
    }
  });

  app.get('/api/education/qualifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const qualifications = await educationService.getUserQualifications(userId);
      res.json(qualifications);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      res.status(500).json({ message: "Failed to fetch qualifications" });
    }
  });

  app.patch('/api/education/qualifications/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can verify qualifications" });
      }
      const qualification = await educationService.verifyQualification(req.params.id, req.user.claims.sub);
      res.json(qualification);
    } catch (error) {
      console.error("Error verifying qualification:", error);
      res.status(500).json({ message: "Failed to verify qualification" });
    }
  });

  // Government programmes endpoints
  app.post('/api/education/programmes', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create programmes" });
      }
      const programme = await educationService.createGovernmentProgramme(req.body);
      res.json(programme);
    } catch (error) {
      console.error("Error creating programme:", error);
      res.status(500).json({ message: "Failed to create programme" });
    }
  });

  app.get('/api/education/programmes', isAuthenticated, async (req, res) => {
    try {
      const { type, sector, location } = req.query;
      const programmes = await educationService.getAvailableProgrammes(
        type as string,
        sector as string,
        location as string
      );
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.post('/api/education/programmes/:id/apply', isAuthenticated, async (req: any, res) => {
    try {
      const applicationData = {
        ...req.body,
        userId: req.user.claims.sub,
        programmeId: req.params.id,
      };
      const participation = await educationService.applyToProgram(applicationData);
      res.json(participation);
    } catch (error: any) {
      console.error("Error applying to programme:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/education/participations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const participations = await educationService.getUserProgrammeParticipations(userId);
      res.json(participations);
    } catch (error) {
      console.error("Error fetching participations:", error);
      res.status(500).json({ message: "Failed to fetch participations" });
    }
  });

  app.patch('/api/education/participations/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { progressPercentage, assessmentResults } = req.body;
      const participation = await educationService.updateParticipationProgress(
        req.params.id,
        progressPercentage,
        assessmentResults
      );
      res.json(participation);
    } catch (error) {
      console.error("Error updating participation progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Skills framework endpoints
  app.post('/api/education/skills', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create skills" });
      }
      const skill = await educationService.createSkill(req.body);
      res.json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.get('/api/education/skills', isAuthenticated, async (req, res) => {
    try {
      const skills = await educationService.getSkillsFramework();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/education/user-skills', isAuthenticated, async (req: any, res) => {
    try {
      const skillData = {
        ...req.body,
        userId: req.user.claims.sub,
        assessedBy: req.user.claims.sub,
      };
      const userSkill = await educationService.assessUserSkill(skillData);
      res.json(userSkill);
    } catch (error) {
      console.error("Error assessing user skill:", error);
      res.status(500).json({ message: "Failed to assess skill" });
    }
  });

  app.get('/api/education/user-skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const skills = await educationService.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching user skills:", error);
      res.status(500).json({ message: "Failed to fetch user skills" });
    }
  });

  app.patch('/api/education/user-skills/:id/endorse', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only supervisors can endorse skills" });
      }
      const skill = await educationService.endorseSkill(req.params.id, req.user.claims.sub);
      res.json(skill);
    } catch (error) {
      console.error("Error endorsing skill:", error);
      res.status(500).json({ message: "Failed to endorse skill" });
    }
  });

  // Development plans endpoints
  app.post('/api/education/development-plans', isAuthenticated, async (req: any, res) => {
    try {
      const planData = {
        ...req.body,
        userId: req.user.claims.sub,
        assignedBy: req.user.claims.sub,
      };
      const plan = await educationService.createDevelopmentPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating development plan:", error);
      res.status(500).json({ message: "Failed to create development plan" });
    }
  });

  app.get('/api/education/development-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const plans = await educationService.getUserDevelopmentPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching development plans:", error);
      res.status(500).json({ message: "Failed to fetch development plans" });
    }
  });

  app.patch('/api/education/development-plans/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { progressPercentage } = req.body;
      const plan = await educationService.updateDevelopmentPlanProgress(req.params.id, progressPercentage);
      res.json(plan);
    } catch (error) {
      console.error("Error updating development plan progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Learning pathways endpoints
  app.post('/api/education/pathways', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create learning pathways" });
      }
      const pathway = await educationService.createLearningPathway(req.body);
      res.json(pathway);
    } catch (error) {
      console.error("Error creating learning pathway:", error);
      res.status(500).json({ message: "Failed to create learning pathway" });
    }
  });

  app.get('/api/education/pathways', isAuthenticated, async (req, res) => {
    try {
      const { industry, careerLevel } = req.query;
      const pathways = await educationService.getLearningPathways(
        industry as string,
        careerLevel as string
      );
      res.json(pathways);
    } catch (error) {
      console.error("Error fetching learning pathways:", error);
      res.status(500).json({ message: "Failed to fetch learning pathways" });
    }
  });

  app.post('/api/education/pathways/:id/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const progress = await educationService.enrollInPathway(req.user.claims.sub, req.params.id);
      res.json(progress);
    } catch (error: any) {
      console.error("Error enrolling in pathway:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/education/pathway-progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { completedSteps } = req.body;
      const progress = await educationService.updatePathwayProgress(req.params.id, completedSteps);
      res.json(progress);
    } catch (error) {
      console.error("Error updating pathway progress:", error);
      res.status(500).json({ message: "Failed to update pathway progress" });
    }
  });

  // Education providers endpoints
  app.post('/api/education/providers', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can add education providers" });
      }
      const provider = await educationService.addEducationProvider(req.body);
      res.json(provider);
    } catch (error) {
      console.error("Error adding education provider:", error);
      res.status(500).json({ message: "Failed to add education provider" });
    }
  });

  app.get('/api/education/providers', isAuthenticated, async (req, res) => {
    try {
      const providers = await educationService.getEducationProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching education providers:", error);
      res.status(500).json({ message: "Failed to fetch education providers" });
    }
  });

  app.post('/api/education/providers/:id/sync', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can sync provider data" });
      }
      await educationService.syncProviderData(req.params.id);
      res.json({ message: "Provider data synchronized successfully" });
    } catch (error: any) {
      console.error("Error syncing provider data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Education analytics endpoint
  app.get('/api/education/metrics', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view education metrics" });
      }
      const metrics = await educationService.getEducationMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching education metrics:", error);
      res.status(500).json({ message: "Failed to fetch education metrics" });
    }
  });

  // Initialize education system
  app.post('/api/education/initialize', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can initialize education system" });
      }
      
      await Promise.all([
        educationService.syncGovernmentProgrammes(),
        educationService.initializeSkillsFramework()
      ]);
      
      res.json({ message: "Education system initialized successfully" });
    } catch (error) {
      console.error("Error initializing education system:", error);
      res.status(500).json({ message: "Failed to initialize education system" });
    }
  });

  // Government & Social Benefits API Routes
  const { governmentService } = await import('./services/government-service');

  // Universal Credit endpoints
  app.post('/api/government/universal-credit', isAuthenticated, async (req: any, res) => {
    try {
      const claimData = {
        ...req.body,
        userId: req.user.claims.sub,
      };
      const claim = await governmentService.createUniversalCreditClaim(claimData);
      res.json(claim);
    } catch (error) {
      console.error("Error creating UC claim:", error);
      res.status(500).json({ message: "Failed to create Universal Credit claim" });
    }
  });

  app.get('/api/government/universal-credit', isAuthenticated, async (req: any, res) => {
    try {
      const claim = await governmentService.getUniversalCreditClaim(req.user.claims.sub);
      res.json(claim);
    } catch (error) {
      console.error("Error fetching UC claim:", error);
      res.status(500).json({ message: "Failed to fetch Universal Credit claim" });
    }
  });

  app.patch('/api/government/universal-credit/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Validate government claim update data
      const updateSchema = z.object({
        status: z.string().optional(),
        amount: z.number().optional(),
        nextPaymentDate: z.string().optional(),
        notes: z.string().optional()
      }).strict();
      const updateData = updateSchema.parse(req.body);
      const updatedClaim = await governmentService.updateUniversalCreditClaim(req.params.id, updateData as any);
      res.json(updatedClaim);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating UC claim:", error);
      res.status(500).json({ message: "Failed to update Universal Credit claim" });
    }
  });

  // Social Benefits endpoints
  app.post('/api/government/benefits', isAuthenticated, async (req: any, res) => {
    try {
      const benefitData = {
        ...req.body,
        userId: req.user.claims.sub,
      };
      const benefit = await governmentService.createSocialBenefit(benefitData);
      res.json(benefit);
    } catch (error) {
      console.error("Error creating benefit:", error);
      res.status(500).json({ message: "Failed to create benefit claim" });
    }
  });

  app.get('/api/government/benefits', isAuthenticated, async (req: any, res) => {
    try {
      const benefits = await governmentService.getUserBenefits(req.user.claims.sub);
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching benefits:", error);
      res.status(500).json({ message: "Failed to fetch benefits" });
    }
  });

  app.patch('/api/government/benefits/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const benefit = await governmentService.updateBenefitStatus(req.params.id, status);
      res.json(benefit);
    } catch (error) {
      console.error("Error updating benefit status:", error);
      res.status(500).json({ message: "Failed to update benefit status" });
    }
  });

  // Payment history endpoints
  app.post('/api/government/payments', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can record payments" });
      }
      const payment = await governmentService.recordBenefitPayment(req.body);
      res.json(payment);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  app.get('/api/government/payments', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const payments = await governmentService.getUserPaymentHistory(
        req.user.claims.sub,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  app.get('/api/government/payments/monthly/:month', isAuthenticated, async (req: any, res) => {
    try {
      const total = await governmentService.calculateMonthlyBenefitTotal(
        req.user.claims.sub,
        req.params.month
      );
      res.json({ month: req.params.month, total });
    } catch (error) {
      console.error("Error calculating monthly total:", error);
      res.status(500).json({ message: "Failed to calculate monthly total" });
    }
  });

  // Work search compliance endpoints
  app.patch('/api/government/work-search/:id/compliance', isAuthenticated, async (req: any, res) => {
    try {
      const { activitiesCompleted } = req.body;
      const requirement = await governmentService.updateWorkSearchCompliance(
        req.params.id,
        activitiesCompleted
      );
      res.json(requirement);
    } catch (error) {
      console.error("Error updating compliance:", error);
      res.status(500).json({ message: "Failed to update work search compliance" });
    }
  });

  // Government communications endpoints
  app.get('/api/government/communications', isAuthenticated, async (req: any, res) => {
    try {
      const { unreadOnly } = req.query;
      const communications = await governmentService.getUserCommunications(
        req.user.claims.sub,
        unreadOnly === 'true'
      );
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.patch('/api/government/communications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const communication = await governmentService.markCommunicationRead(req.params.id);
      res.json(communication);
    } catch (error) {
      console.error("Error marking communication read:", error);
      res.status(500).json({ message: "Failed to mark communication as read" });
    }
  });

  // Social reports endpoints
  app.post('/api/government/reports/uc-summary', isAuthenticated, async (req: any, res) => {
    try {
      const report = await governmentService.generateUniversalCreditSummary(req.user.claims.sub);
      res.json(report);
    } catch (error: any) {
      console.error("Error generating UC summary:", error);
      res.status(500).json({ message: error.message || "Failed to generate UC summary" });
    }
  });

  app.post('/api/government/reports/benefit-breakdown', isAuthenticated, async (req: any, res) => {
    try {
      const report = await governmentService.generateBenefitBreakdown(req.user.claims.sub);
      res.json(report);
    } catch (error) {
      console.error("Error generating benefit breakdown:", error);
      res.status(500).json({ message: "Failed to generate benefit breakdown" });
    }
  });

  app.post('/api/government/reports/earnings-impact', isAuthenticated, async (req: any, res) => {
    try {
      const { earnings } = req.body;
      const report = await governmentService.generateEarningsImpactReport(req.user.claims.sub, earnings);
      res.json(report);
    } catch (error: any) {
      console.error("Error generating earnings impact report:", error);
      res.status(500).json({ message: error.message || "Failed to generate earnings impact report" });
    }
  });

  // Government sync and dashboard
  app.post('/api/government/sync', isAuthenticated, async (req: any, res) => {
    try {
      const result = await governmentService.syncWithGovernmentAPIs(req.user.claims.sub);
      res.json(result);
    } catch (error: any) {
      console.error("Error syncing with government APIs:", error);
      res.status(500).json({ message: error.message || "Failed to sync with government systems" });
    }
  });

  app.get('/api/government/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await governmentService.getDashboardStats(req.user.claims.sub);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Admin endpoints for government management
  app.get('/api/admin/government/api-logs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view API logs" });
      }
      
      const { userId, startDate, endDate } = req.query;
      const logs = await governmentService.getApiLogs(
        userId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching API logs:", error);
      res.status(500).json({ message: "Failed to fetch API logs" });
    }
  });

  // Learning Management System API Routes
  const { learningManagementService } = await import('./services/learning-management-service');

  // Course Management Routes
  app.get('/api/courses/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const course = await learningManagementService.getCourseWithContent(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses/:courseId/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const enrollment = await learningManagementService.enrollUserInCourse(
        req.user.claims.sub,
        req.params.courseId
      );
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.get('/api/courses/:courseId/learning-path', isAuthenticated, async (req: any, res) => {
    try {
      const learningPath = await learningManagementService.getLearningPath(
        req.user.claims.sub,
        req.params.courseId
      );
      res.json(learningPath);
    } catch (error) {
      console.error("Error fetching learning path:", error);
      res.status(500).json({ message: "Failed to fetch learning path" });
    }
  });

  // Lesson Management Routes
  app.post('/api/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const lesson = await learningManagementService.createLesson(req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.put('/api/lessons/:lessonId', isAuthenticated, async (req: any, res) => {
    try {
      // Validate lesson update data
      const lessonSchema = z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        courseId: z.string().optional(),
        order: z.number().optional(),
        duration: z.number().optional()
      }).strict();
      const updateData = lessonSchema.parse(req.body);
      const lesson = await learningManagementService.updateLesson(req.params.lessonId, updateData);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete('/api/lessons/:lessonId', isAuthenticated, async (req: any, res) => {
    try {
      const success = await learningManagementService.deleteLesson(req.params.lessonId);
      if (!success) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  app.post('/api/lessons/:lessonId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const progress = await learningManagementService.updateLessonProgress(
        req.user.claims.sub,
        req.params.lessonId,
        req.body
      );
      
      // Check if course is completed
      const { db } = await import('./db');
      const { lessons } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, req.params.lessonId));
      if (lesson) {
        await learningManagementService.checkCourseCompletion(req.user.claims.sub, lesson.courseId);
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update lesson progress" });
    }
  });

  // Quiz Management Routes
  app.post('/api/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const quiz = await learningManagementService.createQuiz(req.body);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.post('/api/quizzes/:quizId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const question = await learningManagementService.addQuizQuestion({
        quizId: req.params.quizId,
        ...req.body
      });
      res.json(question);
    } catch (error) {
      console.error("Error adding quiz question:", error);
      res.status(500).json({ message: "Failed to add quiz question" });
    }
  });

  app.get('/api/quizzes/:quizId', isAuthenticated, async (req: any, res) => {
    try {
      const quiz = await learningManagementService.getQuizWithQuestions(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Remove correct answers from questions for students
      const sanitizedQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          correctAnswers: undefined, // Hide correct answers
          explanation: undefined // Hide explanations until after submission
        }))
      };
      
      res.json(sanitizedQuiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post('/api/quizzes/:quizId/submit', isAuthenticated, async (req: any, res) => {
    try {
      const result = await learningManagementService.submitQuiz(req.user.claims.sub, {
        quizId: req.params.quizId,
        ...req.body
      });
      
      // Check if course is completed after quiz submission
      const quiz = await learningManagementService.getQuizWithQuestions(req.params.quizId);
      if (quiz?.courseId) {
        await learningManagementService.checkCourseCompletion(req.user.claims.sub, quiz.courseId);
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: error.message || "Failed to submit quiz" });
    }
  });

  // Learning Analytics Routes
  app.get('/api/learning/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await learningManagementService.getUserLearningStats(req.user.claims.sub);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching learning stats:", error);
      res.status(500).json({ message: "Failed to fetch learning statistics" });
    }
  });

  app.post('/api/learning/track-activity', isAuthenticated, async (req: any, res) => {
    try {
      await learningManagementService.trackLearningActivity(req.user.claims.sub, req.body);
      res.json({ message: "Activity tracked successfully" });
    } catch (error) {
      console.error("Error tracking learning activity:", error);
      res.status(500).json({ message: "Failed to track learning activity" });
    }
  });

  // Certificate Management Routes
  app.post('/api/courses/:courseId/certificate', isAuthenticated, async (req: any, res) => {
    try {
      const certificate = await learningManagementService.generateCertificate(
        req.user.claims.sub,
        req.params.courseId
      );
      res.json(certificate);
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: error.message || "Failed to generate certificate" });
    }
  });

  app.get('/api/certificates/verify/:verificationCode', async (req, res) => {
    try {
      const certificate = await learningManagementService.verifyCertificate(req.params.verificationCode);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found or invalid" });
      }
      res.json(certificate);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });

  app.post('/api/certificates/:certificateId/revoke', isAuthenticated, async (req: any, res) => {
    try {
      // Only admins can revoke certificates
      if (!req.user.claims.sub || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const success = await learningManagementService.revokeCertificate(
        req.params.certificateId,
        req.body.reason || 'Revoked by administrator'
      );
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json({ message: "Certificate revoked successfully" });
    } catch (error) {
      console.error("Error revoking certificate:", error);
      res.status(500).json({ message: "Failed to revoke certificate" });
    }
  });

  // Achievement Routes
  app.get('/api/learning/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await learningManagementService.getUserLearningStats(req.user.claims.sub);
      res.json(stats.achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Course Discovery Routes
  app.get('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { courses } = await import('@shared/schema');
      const allCourses = await db.select().from(courses);
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Learning Leaderboard Route
  app.get('/api/learning/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      // This would be implemented to show top learners by points, course completions, etc.
      // For now, return a placeholder
      res.json({
        topLearners: [],
        userRank: null,
        categories: ['points', 'courses_completed', 'quiz_scores', 'streak']
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Karma Coins API Routes
  
  // Get karma stats for current user
  app.get('/api/karma/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getKarmaStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Failed to fetch karma stats:', error);
      res.status(500).json({ message: "Failed to fetch karma stats" });
    }
  });

  // Get available karma activities
  app.get('/api/karma/activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getKarmaActivities();
      res.json(activities);
    } catch (error) {
      logger.error('Failed to fetch karma activities:', error);
      res.status(500).json({ message: "Failed to fetch karma activities" });
    }
  });

  // Claim activity reward
  app.post('/api/karma/claim-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { activityId } = req.body;
      
      if (!activityId) {
        return res.status(400).json({ message: 'Activity ID is required' });
      }
      
      const result = await storage.claimKarmaActivity(userId, activityId);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Failed to claim activity' });
      }
      
      res.json(result);
    } catch (error) {
      logger.error('Failed to claim activity reward:', error);
      res.status(500).json({ message: "Failed to claim activity reward" });
    }
  });

  // Get available rewards
  app.get('/api/karma/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userBalance = user?.karmaCoins || 0;
      
      const rewards = await storage.getKarmaRewards();
      
      // Add canClaim flag based on user balance
      const rewardsWithClaimStatus = rewards.map(reward => ({
        ...reward,
        canClaim: userBalance >= reward.cost
      }));
      
      res.json(rewardsWithClaimStatus);
    } catch (error) {
      logger.error('Failed to fetch karma rewards:', error);
      res.status(500).json({ message: "Failed to fetch karma rewards" });
    }
  });

  // Redeem reward
  app.post('/api/karma/redeem-reward', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rewardId } = req.body;
      
      if (!rewardId) {
        return res.status(400).json({ message: 'Reward ID is required' });
      }
      
      const result = await storage.redeemKarmaReward(userId, rewardId);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Failed to redeem reward' });
      }
      
      res.json(result);
    } catch (error) {
      logger.error('Failed to redeem reward:', error);
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });

  // Get karma transaction history
  app.get('/api/karma/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = (req.query.period as string) || 'month';
      
      const transactions = await storage.getKarmaTransactions(userId, period);
      res.json(transactions);
    } catch (error) {
      logger.error('Failed to fetch karma transactions:', error);
      res.status(500).json({ message: "Failed to fetch karma transactions" });
    }
  });

  // Get karma leaderboard
  app.get('/api/karma/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getKarmaLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      logger.error('Failed to fetch karma leaderboard:', error);
      res.status(500).json({ message: "Failed to fetch karma leaderboard" });
    }
  });

  // Get karma trends
  app.get('/api/karma/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = (req.query.period as string) || 'month';
      
      const transactions = await storage.getKarmaTransactions(userId, period);
      
      // Aggregate transactions by date
      const trendsMap = new Map<string, { earned: number; spent: number }>();
      
      transactions.forEach(tx => {
        const date = new Date(tx.createdAt).toISOString().split('T')[0];
        const existing = trendsMap.get(date) || { earned: 0, spent: 0 };
        
        if (tx.type === 'earned') {
          existing.earned += tx.amount;
        } else if (tx.type === 'spent') {
          existing.spent += tx.amount;
        }
        
        trendsMap.set(date, existing);
      });
      
      // Convert to array and calculate running balance
      const user = await storage.getUser(userId);
      let currentBalance = user?.karmaCoins || 0;
      
      const trends = Array.from(trendsMap.entries())
        .map(([date, { earned, spent }]) => ({
          date,
          earned,
          spent,
          balance: 0 // Will be calculated in reverse
        }))
        .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending
      
      // Calculate balances in reverse (from current to past)
      for (let i = 0; i < trends.length; i++) {
        trends[i].balance = currentBalance;
        currentBalance = currentBalance - trends[i].earned + trends[i].spent;
      }
      
      // Reverse to show chronological order
      trends.reverse();
      
      res.json(trends);
    } catch (error) {
      logger.error('Failed to fetch karma trends:', error);
      res.status(500).json({ message: "Failed to fetch karma trends" });
    }
  });

  // 360-Degree Feedback System Routes
  const { performanceReviewService } = await import('./services/performance-review-service');

  // Initialize default competencies
  try {
    await performanceReviewService.initializeDefaultCompetencies();
  } catch (error) {
    console.error("Error initializing competencies:", error);
  }

  // Review Cycles Management
  app.post('/api/360/cycles', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create review cycles" });
      }
      const cycle = await performanceReviewService.createReviewCycle(req.body);
      res.json(cycle);
    } catch (error: any) {
      console.error("Error creating review cycle:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/cycles', isAuthenticated, async (req, res) => {
    try {
      const cycles = await performanceReviewService.getActiveReviewCycles();
      res.json(cycles);
    } catch (error: any) {
      console.error("Error fetching review cycles:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/cycles/:id', isAuthenticated, async (req, res) => {
    try {
      const cycle = await performanceReviewService.getReviewCycle(req.params.id);
      if (!cycle) {
        return res.status(404).json({ message: "Review cycle not found" });
      }
      res.json(cycle);
    } catch (error: any) {
      console.error("Error fetching review cycle:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Performance Reviews Management
  app.post('/api/360/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewData = {
        ...req.body,
        revieweeId: req.body.revieweeId || req.user.claims.sub
      };
      const review = await performanceReviewService.createPerformanceReview(reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/my-reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await performanceReviewService.getUserReviews(userId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/to-review', isAuthenticated, async (req: any, res) => {
    try {
      const participantId = req.user.claims.sub;
      const reviews = await performanceReviewService.getReviewsForParticipant(participantId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching reviews to complete:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/:id', isAuthenticated, async (req, res) => {
    try {
      const review = await performanceReviewService.getReviewDetails(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error: any) {
      console.error("Error fetching review details:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Review Participants Management
  app.post('/api/360/reviews/:reviewId/participants', isAuthenticated, async (req: any, res) => {
    try {
      const { participantIds, participantType } = req.body;
      const participants = await performanceReviewService.inviteReviewParticipants(
        req.params.reviewId,
        participantIds,
        participantType
      );
      res.json(participants);
    } catch (error: any) {
      console.error("Error inviting participants:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/360/reviews/:reviewId/participants/:participantId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const participant = await performanceReviewService.updateParticipantStatus(
        req.params.participantId,
        req.params.reviewId,
        status
      );
      res.json(participant);
    } catch (error: any) {
      console.error("Error updating participant status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Competencies Management
  app.post('/api/360/competencies', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create competencies" });
      }
      const competency = await performanceReviewService.createCompetency(req.body);
      res.json(competency);
    } catch (error: any) {
      console.error("Error creating competency:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/competencies', isAuthenticated, async (req, res) => {
    try {
      const competencies = await performanceReviewService.getActiveCompetencies();
      res.json(competencies);
    } catch (error: any) {
      console.error("Error fetching competencies:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Review Responses Management
  app.post('/api/360/reviews/:reviewId/responses', isAuthenticated, async (req: any, res) => {
    try {
      const responseData = {
        ...req.body,
        reviewId: req.params.reviewId,
        participantId: req.user.claims.sub
      };
      const response = await performanceReviewService.submitReviewResponse(responseData);
      res.json(response);
    } catch (error: any) {
      console.error("Error submitting review response:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/:reviewId/responses', isAuthenticated, async (req, res) => {
    try {
      const responses = await performanceReviewService.getReviewResponses(req.params.reviewId);
      res.json(responses);
    } catch (error: any) {
      console.error("Error fetching review responses:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/:reviewId/my-responses', isAuthenticated, async (req: any, res) => {
    try {
      const responses = await performanceReviewService.getUserReviewResponses(
        req.user.claims.sub,
        req.params.reviewId
      );
      res.json(responses);
    } catch (error: any) {
      console.error("Error fetching user responses:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Goals Management
  app.post('/api/360/reviews/:reviewId/goals', isAuthenticated, async (req: any, res) => {
    try {
      const goalData = {
        ...req.body,
        reviewId: req.params.reviewId
      };
      const goal = await performanceReviewService.createReviewGoal(goalData);
      res.json(goal);
    } catch (error: any) {
      console.error("Error creating review goal:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/360/goals/:goalId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { progress } = req.body;
      const goal = await performanceReviewService.updateGoalProgress(req.params.goalId, progress);
      res.json(goal);
    } catch (error: any) {
      console.error("Error updating goal progress:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/reviews/:reviewId/goals', isAuthenticated, async (req, res) => {
    try {
      const goals = await performanceReviewService.getReviewGoals(req.params.reviewId);
      res.json(goals);
    } catch (error: any) {
      console.error("Error fetching review goals:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics and Reporting
  app.post('/api/360/analytics/:cycleId/:userId', isAuthenticated, async (req, res) => {
    try {
      const analytics = await performanceReviewService.generateReviewAnalytics(
        req.params.cycleId,
        req.params.userId
      );
      res.json(analytics);
    } catch (error: any) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/stats', isAuthenticated, async (req, res) => {
    try {
      const { cycleId } = req.query;
      const stats = await performanceReviewService.getReviewStats(cycleId as string);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/360/competency-analysis/:cycleId', isAuthenticated, async (req, res) => {
    try {
      const analysis = await performanceReviewService.getCompetencyAnalysis(req.params.cycleId);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error fetching competency analysis:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced AI Assistant Routes
  const { aiService } = await import('./services/ai-service');

  // AI Chat Assistant
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, context, sessionId, conversationHistory } = req.body;
      const response = await aiService.processChat(message, context, sessionId, conversationHistory);
      res.json(response);
    } catch (error: any) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Real-time Metrics
  app.get('/api/ai/realtime-metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await aiService.getRealtimeMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching realtime metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Alerts
  app.get('/api/ai/alerts', isAuthenticated, async (req, res) => {
    try {
      const alerts = await aiService.generateAIAlerts();
      res.json(alerts);
    } catch (error: any) {
      console.error("Error generating AI alerts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Insights
  app.get('/api/ai/insights/realtime', isAuthenticated, async (req, res) => {
    try {
      const insights = await aiService.generateAIInsights();
      res.json(insights);
    } catch (error: any) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Automation Rules
  app.get('/api/ai/automation/rules', isAuthenticated, async (req, res) => {
    try {
      const rules = await aiService.getAutomationRules();
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/ai/automation/rules', isAuthenticated, async (req: any, res) => {
    try {
      // Create new automation rule
      const rule = req.body;
      // In real implementation, save to database
      res.json({ success: true, rule });
    } catch (error: any) {
      console.error("Error creating automation rule:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/ai/automation/rules/:ruleId/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const { ruleId } = req.params;
      const { isActive } = req.body;
      // In real implementation, update database
      res.json({ success: true, ruleId, isActive });
    } catch (error: any) {
      console.error("Error toggling automation rule:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Automation Executions
  app.get('/api/ai/automation/executions', isAuthenticated, async (req, res) => {
    try {
      // Mock execution data
      const executions = [
        {
          id: 'exec1',
          ruleId: 'rule1',
          ruleName: 'Auto Schedule Optimization',
          status: 'completed',
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
          result: { optimized: true, efficiency_gain: '8%' },
          logs: ['Detected efficiency drop', 'Running optimization', 'Schedule updated', 'Notifications sent']
        }
      ];
      res.json(executions);
    } catch (error: any) {
      console.error("Error fetching automation executions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Performance Coaching
  app.get('/api/ai/performance/insights/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const insights = await aiService.generatePerformanceInsights(req.params.employeeId);
      res.json(insights);
    } catch (error: any) {
      console.error("Error generating performance insights:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/ai/performance/goals/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const goals = await aiService.generatePersonalGoals(req.params.employeeId);
      res.json(goals);
    } catch (error: any) {
      console.error("Error generating personal goals:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/ai/performance/coaching/:employeeId', isAuthenticated, async (req, res) => {
    try {
      // Mock coaching session data
      const sessions = [
        {
          id: 'session1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          topic: 'Communication Skills Enhancement',
          insights: ['Active listening development area', 'Email clarity improvement needed'],
          actions: ['Practice meeting summaries', 'Use bullet points in emails'],
          progress: 75,
          nextSession: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ];
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching coaching sessions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/ai/performance/coaching/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { employee, topic } = req.body;
      // Generate new coaching session
      const session = {
        id: `session_${Date.now()}`,
        employee,
        topic,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'scheduled'
      };
      res.json({ success: true, session });
    } catch (error: any) {
      console.error("Error generating coaching session:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/issues/alerts', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const alerts = await storage.getIssueAlerts(status);
      res.json(alerts);
    } catch (error: any) {
      console.error("Error fetching issue alerts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/issues/alerts/:alertId/recommendations', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const recommendations = await storage.getRecommendationsByAlert(req.params.alertId);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/issues/alerts/:alertId/resolve', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.id || req.session?.user?.id || 'demo-user';
      await storage.updateIssueAlert(req.params.alertId, {
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date()
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/issues/alerts/:alertId/dismiss', requireAuth, async (req: any, res) => {
    try {
      await storage.updateIssueAlert(req.params.alertId, {
        status: 'dismissed'
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/issues/actions', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.id || req.session?.user?.id || 'demo-user';
      const { alertId, recommendationId, actionType } = req.body;
      
      const actionExecutionService = createActionExecutionService(storage);
      const executionResult = await actionExecutionService.executeAction(
        actionType,
        recommendationId,
        alertId,
        userId
      );
      
      if (!executionResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: executionResult.error 
        });
      }
      
      res.json(executionResult.action);
    } catch (error: any) {
      console.error("Error creating action:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/issues/alerts/:alertId/actions', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const actions = await storage.getActionsByAlert(req.params.alertId);
      res.json(actions);
    } catch (error: any) {
      console.error("Error fetching actions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/issues/detect/run', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.id || req.session?.user?.id || 'demo-user';
      const user = await storage.getUser(userId);
      
      if (user && user.role !== 'admin' && user.role !== 'client') {
        return res.status(403).json({ message: 'Admin or client access required' });
      }

      const { IssueDetectionService } = await import('./services/issue-detection-service');
      const detectionService = new IssueDetectionService(storage);
      
      const jobs = await storage.getJobs();
      const payments = await storage.getPayments();
      
      const results = await detectionService.detectAllIssues({
        jobs,
        payments,
        userRole: user?.role
      });

      res.json({ 
        success: true, 
        detectedIssues: results.length,
        critical: results.filter(r => r.alert.severity === 'critical').length,
        high: results.filter(r => r.alert.severity === 'high').length
      });
    } catch (error: any) {
      console.error("Error running issue detection:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Marketing Automation API Routes
  const { marketingService } = await import('./services/marketing-service');

  app.get('/api/marketing/campaigns', isAuthenticatedOrDemo, async (req: any, res) => {
    try {
      const campaigns = await marketingService.getCampaigns();
      res.json(campaigns);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/marketing/campaigns', requireAuth, async (req: any, res) => {
    try {
      const campaign = await marketingService.createCampaign(req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/campaigns/:id', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const campaign = await marketingService.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error: any) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/marketing/campaigns/:id', requireAuth, async (req, res) => {
    try {
      // Validate campaign update data
      const campaignSchema = z.object({
        name: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        budget: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }).strict();
      const updateData = campaignSchema.parse(req.body);
      const campaign = await marketingService.updateCampaign(req.params.id, updateData as any);
      res.json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/marketing/campaigns/:id', requireAuth, async (req, res) => {
    try {
      await marketingService.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/email-templates', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const templates = await marketingService.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/marketing/email-templates', requireAuth, async (req, res) => {
    try {
      const template = await marketingService.createEmailTemplate(req.body);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/marketing/email-templates/:id', requireAuth, async (req, res) => {
    try {
      // Validate template update data
      const templateSchema = z.object({
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional()
      }).strict();
      const updateData = templateSchema.parse(req.body);
      const template = await marketingService.updateEmailTemplate(req.params.id, updateData);
      res.json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating email template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/marketing/campaigns/:id/send', requireAuth, async (req, res) => {
    try {
      const { templateId, recipients } = req.body;
      const sends = await marketingService.sendEmailCampaign(req.params.id, templateId, recipients);
      res.json(sends);
    } catch (error: any) {
      console.error("Error sending email campaign:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/campaigns/:id/sends', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const sends = await marketingService.getEmailCampaignSends(req.params.id);
      res.json(sends);
    } catch (error: any) {
      console.error("Error fetching campaign sends:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/social-posts', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const posts = await marketingService.getSocialPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching social posts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/marketing/social-posts', requireAuth, async (req, res) => {
    try {
      const post = await marketingService.createSocialPost(req.body);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating social post:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/marketing/social-posts/:id', requireAuth, async (req, res) => {
    try {
      // Validate social post update data
      const postSchema = z.object({
        platform: z.string().optional(),
        content: z.string().optional(),
        scheduledFor: z.string().optional(),
        status: z.string().optional()
      }).strict();
      const updateData = postSchema.parse(req.body);
      const post = await marketingService.updateSocialPost(req.params.id, updateData as any);
      res.json(post);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid social post data", errors: error.errors });
      }
      console.error("Error updating social post:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/metrics', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const metrics = await marketingService.getCampaignMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching marketing metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/marketing/lead-sources', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const sources = await marketingService.getLeadSources();
      res.json(sources);
    } catch (error: any) {
      console.error("Error fetching lead sources:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/marketing/lead-sources', requireAuth, async (req, res) => {
    try {
      const source = await marketingService.createLeadSource(req.body);
      res.json(source);
    } catch (error: any) {
      console.error("Error creating lead source:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // CRM Lead Management API Routes
  const { crmService } = await import('./services/crm-service');

  app.get('/api/crm/leads', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const leads = await crmService.getLeads();
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/crm/leads', requireAuth, async (req, res) => {
    try {
      const { insertCrmLeadSchema } = await import('@shared/schema');
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await crmService.createLead(leadData);
      res.json(lead);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/crm/leads/:id', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const lead = await crmService.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/crm/leads/:id', requireAuth, async (req, res) => {
    try {
      const leadSchema = z.object({
        companyName: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        estimatedValue: z.number().optional(),
        notes: z.string().optional(),
        lastContactedAt: z.string().optional()
      }).strict();
      const updateData = leadSchema.parse(req.body);
      const lead = await crmService.updateLead(req.params.id, updateData as any);
      res.json(lead);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/crm/leads/:id', requireAuth, async (req, res) => {
    try {
      await crmService.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/crm/leads/status/:status', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const leads = await crmService.getLeadsByStatus(req.params.status);
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching leads by status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/crm/stats', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const stats = await crmService.getLeadStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching CRM stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Business Development API Routes
  const { businessDevelopmentService } = await import('./services/business-development-service');

  app.get('/api/business-development/partnerships', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const partnerships = await businessDevelopmentService.getPartnerships();
      res.json(partnerships);
    } catch (error: any) {
      console.error("Error fetching partnerships:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/business-development/partnerships', requireAuth, async (req, res) => {
    try {
      const partnership = await businessDevelopmentService.createPartnership(req.body);
      res.json(partnership);
    } catch (error: any) {
      console.error("Error creating partnership:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/business-development/partnerships/:id', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const partnership = await businessDevelopmentService.getPartnership(req.params.id);
      if (!partnership) {
        return res.status(404).json({ message: "Partnership not found" });
      }
      res.json(partnership);
    } catch (error: any) {
      console.error("Error fetching partnership:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/business-development/partnerships/:id', requireAuth, async (req, res) => {
    try {
      // Validate partnership update data
      const partnershipSchema = z.object({
        partnerName: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        value: z.number().optional(),
        startDate: z.string().optional()
      }).strict();
      const updateData = partnershipSchema.parse(req.body);
      const partnership = await businessDevelopmentService.updatePartnership(req.params.id, updateData as any);
      res.json(partnership);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid partnership data", errors: error.errors });
      }
      console.error("Error updating partnership:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/business-development/partnerships/:id', requireAuth, async (req, res) => {
    try {
      await businessDevelopmentService.deletePartnership(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting partnership:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/business-development/market-analysis', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const analyses = await businessDevelopmentService.getMarketAnalyses();
      res.json(analyses);
    } catch (error: any) {
      console.error("Error fetching market analyses:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/business-development/market-analysis', requireAuth, async (req, res) => {
    try {
      const analysis = await businessDevelopmentService.createMarketAnalysis(req.body);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error creating market analysis:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/business-development/market-analysis/:id', requireAuth, async (req, res) => {
    try {
      // Validate market analysis update data
      const analysisSchema = z.object({
        market: z.string().optional(),
        findings: z.string().optional(),
        opportunities: z.array(z.string()).optional(),
        threats: z.array(z.string()).optional()
      }).strict();
      const updateData = analysisSchema.parse(req.body);
      const analysis = await businessDevelopmentService.updateMarketAnalysis(req.params.id, updateData);
      res.json(analysis);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid analysis data", errors: error.errors });
      }
      console.error("Error updating market analysis:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/business-development/strategic-plans', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const plans = await businessDevelopmentService.getStrategicPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching strategic plans:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/business-development/strategic-plans', requireAuth, async (req, res) => {
    try {
      const plan = await businessDevelopmentService.createStrategicPlan(req.body);
      res.json(plan);
    } catch (error: any) {
      console.error("Error creating strategic plan:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/business-development/strategic-plans/:id', requireAuth, async (req, res) => {
    try {
      // Validate strategic plan update data
      const planSchema = z.object({
        title: z.string().optional(),
        objectives: z.array(z.string()).optional(),
        timeline: z.string().optional(),
        budget: z.number().optional(),
        status: z.string().optional()
      }).strict();
      const updateData = planSchema.parse(req.body);
      const plan = await businessDevelopmentService.updateStrategicPlan(req.params.id, updateData as any);
      res.json(plan);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid plan data", errors: error.errors });
      }
      console.error("Error updating strategic plan:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/business-development/growth-metrics', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const { metricType, startDate, endDate } = req.query;
      const metrics = await businessDevelopmentService.getGrowthMetrics(
        undefined,
        metricType as any,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching growth metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/business-development/growth-metrics', requireAuth, async (req, res) => {
    try {
      const metric = await businessDevelopmentService.recordGrowthMetric(req.body);
      res.json(metric);
    } catch (error: any) {
      console.error("Error recording growth metric:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/business-development/metrics/summary', isAuthenticatedOrDemo, async (req, res) => {
    try {
      const partnershipMetrics = await businessDevelopmentService.getPartnershipMetrics();
      const growthSummary = await businessDevelopmentService.getGrowthSummary();
      const planSummary = await businessDevelopmentService.getStrategicPlanSummary();
      
      res.json({
        partnerships: partnershipMetrics,
        growth: growthSummary,
        strategicPlans: planSummary
      });
    } catch (error: any) {
      console.error("Error fetching business development summary:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize notification service with WebSocket server
  notificationService.initialize(httpServer);
  
  // Initialize real-time notification service
  realTimeNotificationService.initialize(httpServer);

  // Initialize advanced WebSocket features
  const initAdvancedWebSocket = async () => {
    try {
      const { advancedNotificationService } = await import('./advanced-notifications');
      advancedNotificationService.initializeWebSocket(httpServer);
    } catch (error) {
      logger.error('Advanced WebSocket initialization error:', error);
    }
  };
  
  initAdvancedWebSocket();
  
  // Initialize issue detection scheduler conditionally
  const isDevelopment = app.get("env") === "development";
  const enableIssueDetection = process.env.ENABLE_ISSUE_DETECTION === 'true' || (!isDevelopment && process.env.ENABLE_ISSUE_DETECTION !== 'false');
  
  if (enableIssueDetection) {
    const issueDetectionScheduler = createIssueDetectionScheduler(storage);
    issueDetectionScheduler.start(30); // Run detection every 30 minutes
    logger.info('✅ Issue detection scheduler started');
  } else {
    logger.info('⏸️  Issue detection scheduler disabled (set ENABLE_ISSUE_DETECTION=true to enable)');
  }
  
  return httpServer;
}
