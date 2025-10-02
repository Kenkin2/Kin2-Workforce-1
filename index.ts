import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { applicationInitializer } from "./initialization";
import logger from './utils/logger';
import { generalLimiter } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { generateCsrfToken, validateCsrfToken, getCsrfToken } from './middleware/csrf';
import { validateAndNormalizeEnv } from './utils/env-validator';
import healthRouter from './routes/health';

// Validate environment variables on startup
validateAndNormalizeEnv();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Health check endpoints (no auth required, before rate limiting for accurate checks)
app.use(healthRouter);

// Apply rate limiting after health checks to prevent false negatives in monitoring
app.use(generalLimiter);
app.use(generateCsrfToken);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Run comprehensive initialization
    const initResults = await applicationInitializer.initialize();
    
    // Check if initialization was successful
    if (!applicationInitializer.isHealthy()) {
      const failures = applicationInitializer.getFailures();
      throw new Error(`Critical initialization failures: ${failures.map(f => f.component).join(', ')}`);
    }
    
    // CSRF token endpoint (must be before routes and CSRF validation)
    app.get('/api/csrf-token', getCsrfToken);
    
    // Apply CSRF validation to all API routes (except GET)
    app.use('/api', validateCsrfToken);
    
    // Register routes with authentication and middleware
    const server = await registerRoutes(app);

    // Initialize heavy background services conditionally based on environment
    const isDevelopment = app.get("env") === "development";
    const enableWorkflowEngine = process.env.ENABLE_WORKFLOW_ENGINE === 'true' || (!isDevelopment && process.env.ENABLE_WORKFLOW_ENGINE !== 'false');
    const enableBillingAutomation = process.env.ENABLE_BILLING_AUTOMATION === 'true' || (!isDevelopment && process.env.ENABLE_BILLING_AUTOMATION !== 'false');
    const enableGDPRAutomation = process.env.ENABLE_GDPR_AUTOMATION === 'true' || (!isDevelopment && process.env.ENABLE_GDPR_AUTOMATION !== 'false');

    // Initialize workflow automation engine
    if (enableWorkflowEngine) {
      const { workflowEngine } = await import('./workflow-automation.js');
      workflowEngine.startEngine();
      logger.info('✅ Workflow automation engine started');
    } else {
      logger.info('⏸️  Workflow automation engine disabled (set ENABLE_WORKFLOW_ENGINE=true to enable)');
    }

    // Initialize GDPR automated processes
    const { gdprService } = await import('./gdpr.js');
    
    // Initialize automated billing service
    const { pricingService } = await import('./services/pricing-service.js');
    const { billingAutomation } = await import('./services/billing-automation.js');
    
    // Setup default pricing plans (always needed)
    await pricingService.initializeDefaultPlans();
    
    // Start automated billing conditionally
    if (enableBillingAutomation) {
      billingAutomation.startAutomation();
      logger.info('✅ Automated billing service started');
    } else {
      logger.info('⏸️  Automated billing service disabled (set ENABLE_BILLING_AUTOMATION=true to enable)');
    }
    
    // Schedule daily data retention cleanup at 2 AM
    if (enableGDPRAutomation) {
      const scheduleRetentionCleanup = () => {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(2, 0, 0, 0); // 2 AM
        
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1); // Next day if already past 2 AM
        }
        
        const timeUntilNextRun = nextRun.getTime() - now.getTime();
        
        setTimeout(async () => {
          try {
            logger.info('Running automated GDPR data retention cleanup');
            const result = await gdprService.processDataRetention();
            logger.info('GDPR cleanup completed', { deletedRecords: result.deleted });
            if (result.errors.length > 0) {
              logger.error('GDPR cleanup errors', { errors: result.errors });
            }
          } catch (error: any) {
            logger.error('GDPR retention cleanup failed', { error: error?.message });
          }
          
          // Schedule next run
          scheduleRetentionCleanup();
        }, timeUntilNextRun);
        
        logger.info('Next GDPR retention cleanup scheduled', { scheduledFor: nextRun.toISOString() });
      };
      
      // Start the scheduler
      scheduleRetentionCleanup();
      logger.info('✅ GDPR automation service started');
    } else {
      logger.info('⏸️  GDPR automation service disabled (set ENABLE_GDPR_AUTOMATION=true to enable)');
    }

    // Setup Vite development server or static serving BEFORE 404 handler
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Development environment configured');
    } else {
      serveStatic(app);
      log('Production static serving configured');
    }

    // 404 handler for undefined routes (must be after Vite setup)
    app.use(notFoundHandler);
    
    // Global error handler (must be last middleware)
    app.use(errorHandler);

    // Start the server
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 Kin2 Workforce Platform serving on port ${port}`);
      
      // Display initialization summary
      const results = applicationInitializer.getResults();
      const successCount = results.filter(r => r.success).length;
      const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
      
      log(`✅ Startup complete: ${successCount}/${results.length} components (${totalTime}ms total)`);
      
      if (!applicationInitializer.isHealthy()) {
        log('⚠️  Some non-critical components failed - check logs above');
      }
    });
    
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
})();
