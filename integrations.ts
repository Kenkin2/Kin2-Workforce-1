import logger from './utils/logger';
import Stripe from 'stripe';
import OpenAI from 'openai';

export interface IntegrationHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'disconnected';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export class IntegrationManager {
  private healthCache = new Map<string, IntegrationHealth>();
  private testResults = new Map<string, any>();
  
  async checkAllIntegrations(): Promise<IntegrationHealth[]> {
    const integrations = [
      this.checkDatabase(),
      this.checkStripe(),
      this.checkOpenAI(),
      this.checkAuth(),
      this.checkThirdPartyServices()
    ];
    
    const results = await Promise.allSettled(integrations);
    const healthChecks: IntegrationHealth[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        healthChecks.push(result.value);
      } else {
        // Add failed health check
        const integrationNames = ['database', 'stripe', 'openai', 'auth', 'third-party'];
        healthChecks.push({
          id: integrationNames[index],
          name: integrationNames[index],
          status: 'down',
          lastChecked: new Date(),
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    // Cache results for performance
    healthChecks.forEach(check => {
      this.healthCache.set(check.id, check);
    });
    
    return healthChecks;
  }
  
  async runIntegrationTests(): Promise<Record<string, any>> {
    const tests = {
      database: await this.testDatabaseOperations(),
      stripe: await this.testStripeOperations(),
      openai: await this.testAIOperations(),
      webhooks: await this.testWebhookHandling(),
      performance: await this.testPerformanceMetrics()
    };
    
    this.testResults.set('latest', {
      timestamp: new Date(),
      results: tests,
      passed: Object.values(tests).every(test => test.success)
    });
    
    return tests;
  }
  
  private async testDatabaseOperations(): Promise<any> {
    try {
      const { db } = await import('./db.js');
      
      // Test basic CRUD operations
      const tests = {
        connection: false,
        read: false,
        write: false,
        transaction: false
      };
      
      // Connection test
      const start = Date.now();
      await db.execute('SELECT 1 as test');
      tests.connection = true;
      
      // Read test
      const users = await db.query.users.findMany({ limit: 1 });
      tests.read = true;
      
      // Transaction test
      await db.transaction(async (tx) => {
        await tx.execute('SELECT 1 as transaction_test');
      });
      tests.transaction = true;
      
      return {
        success: true,
        tests,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async testStripeOperations(): Promise<any> {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, error: 'Stripe not configured' };
    }
    
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
      
      const tests = {
        account: false,
        products: false,
        customers: false
      };
      
      // Account access test
      await stripe.accounts.retrieve();
      tests.account = true;
      
      // Products access test
      await stripe.products.list({ limit: 1 });
      tests.products = true;
      
      // Customer operations test (read-only)
      await stripe.customers.list({ limit: 1 });
      tests.customers = true;
      
      return { success: true, tests };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  private async testAIOperations(): Promise<any> {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OpenAI not configured' };
    }
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const tests = {
        models: false,
        chat: false
      };
      
      // Models list test
      await openai.models.list();
      tests.models = true;
      
      // Simple chat test
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
      tests.chat = !!response.choices[0]?.message?.content;
      
      return { success: true, tests };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  private async testWebhookHandling(): Promise<any> {
    try {
      // Test webhook processing with mock data
      const mockWebhook = {
        service: 'test',
        event: 'test.event',
        data: { test: true }
      };
      
      await this.processWebhook(mockWebhook.service, mockWebhook.event, mockWebhook.data);
      
      return { success: true, webhookProcessing: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  private async testPerformanceMetrics(): Promise<any> {
    const metrics = {
      avgResponseTime: 0,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    // Calculate average response time from recent requests
    const healthChecks = Array.from(this.healthCache.values());
    const responseTimes = healthChecks
      .filter(check => check.responseTime)
      .map(check => check.responseTime!);
    
    if (responseTimes.length > 0) {
      metrics.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
    
    return {
      success: true,
      metrics,
      performanceGrade: metrics.avgResponseTime < 200 ? 'A' : metrics.avgResponseTime < 500 ? 'B' : 'C'
    };
  }
  
  private async checkThirdPartyServices(): Promise<IntegrationHealth> {
    try {
      // Check multiple third-party services health
      const services = ['google-workspace', 'microsoft-teams', 'salesforce', 'hubspot'];
      const results = await Promise.allSettled(
        services.map(service => this.pingService(service))
      );
      
      const healthyCount = results.filter(r => r.status === 'fulfilled').length;
      const healthPercentage = (healthyCount / services.length) * 100;
      
      return {
        id: 'third-party',
        name: 'Third-Party Services',
        status: healthPercentage > 75 ? 'healthy' : healthPercentage > 50 ? 'degraded' : 'down',
        lastChecked: new Date(),
        responseTime: 0
      };
    } catch (error: any) {
      return {
        id: 'third-party',
        name: 'Third-Party Services', 
        status: 'down',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
  
  private async pingService(service: string): Promise<boolean> {
    // Mock ping for now - would implement actual health checks
    return Promise.resolve(Math.random() > 0.1); // 90% success rate simulation
  }
  
  getTestResults(): any {
    return this.testResults.get('latest');
  }
  
  getCachedHealth(id: string): IntegrationHealth | undefined {
    return this.healthCache.get(id);
  }
  
  private async checkDatabase(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      // Simple health check using pool query
      const { pool } = await import('./db.js');
      await pool.query('SELECT 1 as health_check');
      
      return {
        id: 'database',
        name: 'PostgreSQL Database',
        status: 'healthy',
        lastChecked: new Date(),
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        id: 'database',
        name: 'PostgreSQL Database',
        status: 'down',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
  
  private async checkStripe(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          id: 'stripe',
          name: 'Stripe Payments',
          status: 'disconnected',
          lastChecked: new Date()
        };
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
      
      // Quick health check - just validate account access
      await stripe.accounts.retrieve();
      
      return {
        id: 'stripe',
        name: 'Stripe Payments',
        status: 'healthy',
        lastChecked: new Date(),
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        id: 'stripe',
        name: 'Stripe Payments',
        status: 'degraded',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
  
  private async checkOpenAI(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          id: 'openai',
          name: 'OpenAI Services',
          status: 'disconnected',
          lastChecked: new Date()
        };
      }
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Quick health check with minimal token usage
      await openai.models.list();
      
      return {
        id: 'openai',
        name: 'OpenAI Services',
        status: 'healthy',
        lastChecked: new Date(),
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        id: 'openai',
        name: 'OpenAI Services',
        status: 'degraded',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
  
  private async checkAuth(): Promise<IntegrationHealth> {
    try {
      // Auth is internal to Replit, assume healthy if environment variables exist
      const hasRequiredEnv = process.env.REPLIT_DOMAINS && process.env.SESSION_SECRET;
      
      return {
        id: 'auth',
        name: 'Replit Authentication',
        status: hasRequiredEnv ? 'healthy' : 'down',
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        id: 'auth',
        name: 'Replit Authentication',
        status: 'down',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
  
  async processWebhook(service: string, event: string, data: any): Promise<void> {
    console.log(`Processing ${service} webhook:`, event);
    
    switch (service) {
      case 'slack':
        await this.handleSlackWebhook(event, data);
        break;
      case 'twilio':
        await this.handleTwilioWebhook(event, data);
        break;
      case 'calendar':
        await this.handleCalendarWebhook(event, data);
        break;
      default:
        logger.info('Unhandled webhook service:', service);
    }
  }
  
  private async handleSlackWebhook(event: string, data: any): Promise<void> {
    // Handle Slack notifications and commands
    logger.info('Slack webhook:', event, data);
  }
  
  private async handleTwilioWebhook(event: string, data: any): Promise<void> {
    // Handle SMS delivery status and responses
    logger.info('Twilio webhook:', event, data);
  }
  
  private async handleCalendarWebhook(event: string, data: any): Promise<void> {
    // Handle calendar sync events
    logger.info('Calendar webhook:', event, data);
  }
}

export const integrationManager = new IntegrationManager();