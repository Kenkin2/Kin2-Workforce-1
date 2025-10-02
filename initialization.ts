import { db } from "./db";
import { storage } from "./storage";
import Stripe from "stripe";
import logger from './utils/logger';

export interface InitializationResult {
  success: boolean;
  component: string;
  duration: number;
  error?: Error;
}

export class ApplicationInitializer {
  private results: InitializationResult[] = [];
  private startTime = Date.now();

  async initialize(): Promise<InitializationResult[]> {
    logger.info('Starting Kin2 Workforce Platform initialization');

    // Phase 1: Core Infrastructure (Sequential - Dependencies)
    await this.runPhase('Core Infrastructure', [
      { name: 'Database Connection', fn: () => this.initializeDatabase() },
      { name: 'Storage Interface', fn: () => this.validateStorage() }
    ]);

    // Phase 2: External Services (Parallel - Independent)
    await this.runPhaseParallel('External Services', [
      { name: 'Stripe Integration', fn: () => this.validateStripe() },
      { name: 'Environment Variables', fn: () => this.validateEnvironment() }
    ]);

    // Phase 3: Application Services (Sequential - Order matters)
    await this.runPhase('Application Services', [
      { name: 'Schema Validation', fn: () => this.validateSchema() },
      { name: 'Sample Data Check', fn: () => this.ensureSampleData() }
    ]);

    const totalTime = Date.now() - this.startTime;
    console.log(`\n✅ Initialization completed in ${totalTime}ms`);
    console.log(`📊 Components initialized: ${this.results.filter(r => r.success).length}/${this.results.length}`);
    
    const failures = this.results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log(`❌ Failed components: ${failures.map(f => f.component).join(', ')}`);
    }

    return this.results;
  }

  private async runPhase(phaseName: string, tasks: Array<{ name: string; fn: () => Promise<void> }>): Promise<void> {
    console.log(`📋 Phase: ${phaseName}`);
    for (const task of tasks) {
      await this.executeTask(task.name, task.fn);
    }
    logger.info('');
  }

  private async runPhaseParallel(phaseName: string, tasks: Array<{ name: string; fn: () => Promise<void> }>): Promise<void> {
    console.log(`📋 Phase: ${phaseName} (Parallel)`);
    const promises = tasks.map(task => this.executeTask(task.name, task.fn));
    await Promise.allSettled(promises);
    logger.info('');
  }

  private async executeTask(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      console.log(`  ✅ ${name} (${duration}ms)`);
      this.results.push({ success: true, component: name, duration });
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${name} failed (${duration}ms): ${errorMessage}`);
      this.results.push({ 
        success: false, 
        component: name, 
        duration, 
        error: error as Error 
      });
      
      // Only throw for critical components
      if (this.isCriticalComponent(name)) {
        throw error;
      }
    }
  }

  private isCriticalComponent(name: string): boolean {
    const critical = ['Database Connection', 'Storage Interface', 'Environment Variables'];
    return critical.includes(name);
  }

  private async initializeDatabase(): Promise<void> {
    // Test database connection with timeout
    const connectionPromise = db.execute('SELECT 1 as health_check');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
  }

  private async validateStorage(): Promise<void> {
    // Test storage interface with actual query
    const stats = await storage.getDashboardStats();
    if (typeof stats.activeJobs !== 'number') {
      throw new Error('Storage interface validation failed');
    }
  }

  private async validateStripe(): Promise<void> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Just validate the key format - don't make external API calls during startup
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('Invalid Stripe secret key format');
    }
    
    // Stripe will be validated on first use instead of during initialization
    logger.info('✓ Stripe key format validated (live validation deferred to first use)');
  }

  private async validateEnvironment(): Promise<void> {
    const required = [
      'DATABASE_URL',
      'REPLIT_DOMAINS'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Warn about optional but recommended env vars
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('⚠️  STRIPE_SECRET_KEY not configured - payment features will be disabled');
    }
    if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
      logger.warn('⚠️  VITE_STRIPE_PUBLIC_KEY not configured - client-side Stripe features will be disabled');
    }
  }

  private async validateSchema(): Promise<void> {
    // Validate database schema by checking key tables exist
    try {
      await Promise.all([
        db.execute('SELECT 1 FROM users LIMIT 1'),
        db.execute('SELECT 1 FROM jobs LIMIT 1'),
        db.execute('SELECT 1 FROM sessions LIMIT 1')
      ]);
    } catch (error) {
      throw new Error('Database schema validation failed - run migrations');
    }
  }

  private async ensureSampleData(): Promise<void> {
    // Check if we have minimum required data
    const stats = await storage.getDashboardStats();
    
    // In development, ensure we have some courses for the learning system
    if (process.env.NODE_ENV === 'development') {
      const courses = await storage.getCourses();
      if (courses.length === 0) {
        logger.info('  ℹ️  No courses found - sample data may be needed for full functionality');
      }
    }
  }

  getResults(): InitializationResult[] {
    return this.results;
  }

  getFailures(): InitializationResult[] {
    return this.results.filter(r => !r.success);
  }

  isHealthy(): boolean {
    const criticalFailures = this.getFailures().filter(f => 
      this.isCriticalComponent(f.component)
    );
    return criticalFailures.length === 0;
  }
}

export const applicationInitializer = new ApplicationInitializer();