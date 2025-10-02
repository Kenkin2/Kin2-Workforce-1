import { Request, Response } from 'express';
import { storage } from './storage';
import crypto from 'crypto';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  organizationId: string;
  permissions: APIPermission[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface APIPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
  conditions?: any;
}

export interface ThirdPartyApp {
  id: string;
  name: string;
  description: string;
  developer: string;
  category: 'productivity' | 'analytics' | 'communication' | 'automation' | 'integration';
  version: string;
  permissions: APIPermission[];
  webhookEndpoints: string[];
  documentation: string;
  status: 'approved' | 'pending' | 'rejected';
  installs: number;
  rating: number;
  reviews: AppReview[];
  pricing: {
    model: 'free' | 'one-time' | 'subscription';
    price?: number;
    currency?: string;
  };
  createdAt: Date;
}

export interface AppReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  organizationId: string;
  appId?: string;
  timestamp: Date;
  delivered: boolean;
  attempts: number;
}

class APIMarketplaceService {
  private apiKeys = new Map<string, APIKey>();
  private apps = new Map<string, ThirdPartyApp>();
  private webhookQueue: WebhookEvent[] = [];

  // API Key Management
  async generateAPIKey(organizationId: string, name: string, permissions: APIPermission[]): Promise<APIKey> {
    const keyId = crypto.randomUUID();
    const apiKey = this.generateSecureKey();
    const apiSecret = this.generateSecureKey();

    const newAPIKey: APIKey = {
      id: keyId,
      name,
      key: apiKey,
      secret: apiSecret,
      organizationId,
      permissions,
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
      },
      isActive: true,
      createdAt: new Date(),
    };

    this.apiKeys.set(keyId, newAPIKey);
    console.log(`🔑 API key generated for organization ${organizationId}: ${name}`);
    
    return newAPIKey;
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    const apiKeyEntry = Array.from(this.apiKeys.values())
      .find(k => k.key === key && k.isActive);

    if (apiKeyEntry) {
      apiKeyEntry.lastUsed = new Date();
      return apiKeyEntry;
    }

    return null;
  }

  async revokeAPIKey(keyId: string): Promise<void> {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey) {
      apiKey.isActive = false;
      console.log(`🔑 API key revoked: ${keyId}`);
    }
  }

  // Third-Party App Management
  async registerApp(appData: Omit<ThirdPartyApp, 'id' | 'installs' | 'rating' | 'reviews' | 'createdAt'>): Promise<ThirdPartyApp> {
    const app: ThirdPartyApp = {
      ...appData,
      id: crypto.randomUUID(),
      installs: 0,
      rating: 0,
      reviews: [],
      createdAt: new Date(),
    };

    this.apps.set(app.id, app);
    console.log(`📱 Third-party app registered: ${app.name} by ${app.developer}`);
    
    return app;
  }

  async getMarketplaceApps(category?: string): Promise<ThirdPartyApp[]> {
    const apps = Array.from(this.apps.values())
      .filter(app => app.status === 'approved')
      .filter(app => !category || app.category === category)
      .sort((a, b) => b.rating - a.rating);

    return apps;
  }

  async installApp(appId: string, organizationId: string): Promise<void> {
    const app = this.apps.get(appId);
    if (!app) {
      throw new Error('App not found');
    }

    // Create API key for the app
    await this.generateAPIKey(organizationId, `App: ${app.name}`, app.permissions);
    
    app.installs += 1;
    console.log(`📦 App installed: ${app.name} for organization ${organizationId}`);
  }

  async uninstallApp(appId: string, organizationId: string): Promise<void> {
    console.log(`🗑️ App uninstalled: ${appId} for organization ${organizationId}`);
  }

  // Webhook Management
  async registerWebhook(appId: string, endpoint: string, events: string[]): Promise<void> {
    console.log(`🔗 Webhook registered for app ${appId}: ${endpoint} (events: ${events.join(', ')})`);
  }

  async triggerWebhook(event: Omit<WebhookEvent, 'id' | 'delivered' | 'attempts'>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: crypto.randomUUID(),
      delivered: false,
      attempts: 0,
    };

    this.webhookQueue.push(webhookEvent);
    await this.processWebhookQueue();
  }

  private async processWebhookQueue(): Promise<void> {
    const pendingEvents = this.webhookQueue.filter(e => !e.delivered && e.attempts < 3);
    
    for (const event of pendingEvents) {
      try {
        // Mock webhook delivery
        console.log(`📡 Delivering webhook: ${event.type} for organization ${event.organizationId}`);
        event.delivered = true;
        event.attempts += 1;
      } catch (error) {
        event.attempts += 1;
        console.error(`Webhook delivery failed for event ${event.id}:`, error);
      }
    }
  }

  // Developer Documentation
  generateAPIDocumentation(): any {
    return {
      version: '1.0.0',
      title: 'Kin2 Workforce API',
      description: 'Comprehensive workforce management API for developers',
      baseURL: 'https://api.kin2workforce.com/v1',
      authentication: {
        type: 'Bearer Token',
        description: 'Include your API key in the Authorization header',
        example: 'Authorization: Bearer your-api-key-here',
      },
      endpoints: [
        {
          path: '/jobs',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Manage job postings and assignments',
          permissions: ['jobs:read', 'jobs:write'],
          examples: {
            GET: '/api/v1/jobs?status=active&limit=20',
            POST: '/api/v1/jobs',
          },
        },
        {
          path: '/workers',
          methods: ['GET', 'POST', 'PUT'],
          description: 'Manage worker profiles and availability',
          permissions: ['workers:read', 'workers:write'],
        },
        {
          path: '/analytics',
          methods: ['GET'],
          description: 'Access workforce analytics and insights',
          permissions: ['analytics:read'],
        },
        {
          path: '/webhooks',
          methods: ['POST'],
          description: 'Register webhook endpoints for real-time updates',
          permissions: ['webhooks:write'],
        },
      ],
      rateLimits: {
        default: '100 requests/minute, 5000 requests/hour',
        premium: '500 requests/minute, 25000 requests/hour',
        enterprise: 'Custom limits available',
      },
      webhooks: {
        events: [
          'job.created',
          'job.updated',
          'job.completed',
          'shift.started',
          'shift.completed',
          'payment.processed',
          'worker.assigned',
        ],
        format: 'JSON',
        security: 'HMAC-SHA256 signature verification',
      },
    };
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // SDK Generation
  async generateSDK(language: 'javascript' | 'python' | 'php' | 'ruby'): Promise<string> {
    switch (language) {
      case 'javascript':
        return `
// Kin2 Workforce JavaScript SDK
class Kin2WorkforceAPI {
  constructor(apiKey, baseURL = 'https://api.kin2workforce.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async getJobs(filters = {}) {
    return this.makeRequest('/jobs?' + new URLSearchParams(filters));
  }

  async createJob(jobData) {
    return this.makeRequest('/jobs', 'POST', jobData);
  }

  async getWorkers() {
    return this.makeRequest('/workers');
  }

  async getAnalytics() {
    return this.makeRequest('/analytics');
  }
}

module.exports = Kin2WorkforceAPI;
        `;
      default:
        return `// SDK for ${language} coming soon...`;
    }
  }
}

export const apiMarketplaceService = new APIMarketplaceService();