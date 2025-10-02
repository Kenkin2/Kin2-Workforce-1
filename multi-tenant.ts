import logger from './utils/logger';
import { db } from './db';
import { organizations, users, type Organization as SchemaOrganization } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from './storage';

export interface Organization extends Omit<SchemaOrganization, 'createdAt' | 'updatedAt'> {
  domain?: string;
  subdomain?: string;
  plan?: 'starter' | 'professional' | 'enterprise';
  settings?: OrganizationSettings;
  branding?: OrganizationBranding;
  isActive?: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  language: string;
  features: {
    aiAssistant: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
    whiteLabel: boolean;
    multipleLocations: boolean;
    apiAccess: boolean;
  };
  limits: {
    maxUsers: number;
    maxJobs: number;
    storageGb: number;
    apiCallsPerMonth: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

export interface OrganizationBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customDomain?: string;
  customCss?: string;
  favicon?: string;
  companyName: string;
  tagline?: string;
}

export interface TenantContext {
  organizationId: string;
  organization: Organization;
  user: any;
  subdomain: string;
  permissions: string[];
}

export class MultiTenantManager {
  private tenantCache: Map<string, Organization> = new Map();
  private subdomainMap: Map<string, string> = new Map();

  async createOrganization(data: {
    name: string;
    domain: string;
    subdomain: string;
    plan: Organization['plan'];
    ownerId: string;
  }): Promise<Organization> {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const settings: OrganizationSettings = this.getDefaultSettings(data.plan);
    const branding: OrganizationBranding = this.getDefaultBranding();

    const organization: Organization = {
      id: orgId,
      name: data.name,
      description: null,
      ownerId: data.ownerId,
      domain: data.domain,
      subdomain: data.subdomain,
      plan: data.plan,
      settings,
      branding: { ...branding, companyName: data.name },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database (only basic fields that exist in schema)
    await db.insert(organizations).values({
      id: orgId,
      name: data.name,
      ownerId: data.ownerId,
      description: null
    });

    // Update cache
    this.tenantCache.set(orgId, organization);
    this.subdomainMap.set(data.subdomain, orgId);

    return organization;
  }

  async getOrganizationBySubdomain(subdomain: string): Promise<Organization | null> {
    // Check cache first
    const orgId = this.subdomainMap.get(subdomain);
    if (orgId && this.tenantCache.has(orgId)) {
      return this.tenantCache.get(orgId)!;
    }

    // Since subdomain is not in the schema, use name as fallback
    const result = await db.select()
      .from(organizations)
      .where(eq(organizations.name, subdomain))
      .limit(1);

    if (!result.length) return null;

    const org = {
      ...result[0],
      subdomain,
      domain: `${subdomain}.example.com`,
      plan: 'starter' as const,
      isActive: true
    } as Organization;
    
    // Update cache
    this.tenantCache.set(org.id, org);
    this.subdomainMap.set(subdomain, org.id);

    return org;
  }

  async getTenantContext(req: any): Promise<TenantContext | null> {
    let subdomain = '';
    
    // Extract subdomain from host header
    const host = req.headers.host || '';
    const hostParts = host.split('.');
    
    if (hostParts.length > 2) {
      subdomain = hostParts[0];
    } else {
      // Fallback to path-based tenant identification
      const pathMatch = req.path.match(/^\/tenant\/([^\/]+)/);
      if (pathMatch) {
        subdomain = pathMatch[1];
      }
    }

    if (!subdomain) return null;

    const organization = await this.getOrganizationBySubdomain(subdomain);
    if (!organization) return null;

    // Get user permissions for this organization
    const permissions = await this.getUserPermissions(req.user?.claims?.sub, organization.id);

    return {
      organizationId: organization.id,
      organization,
      user: req.user,
      subdomain,
      permissions
    };
  }

  private async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    if (!userId) return [];

    // Simplified: organization members table not in schema
    // Check if user is organization owner
    const org = await db.select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizations.ownerId, userId)
        )
      )
      .limit(1);

    if (!org.length) return [];

    // Owner has all permissions
    return ['*'];
  }

  private getDefaultSettings(plan: Organization['plan']): OrganizationSettings {
    const baseSettings: OrganizationSettings = {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      features: {
        aiAssistant: false,
        advancedAnalytics: false,
        customIntegrations: false,
        whiteLabel: false,
        multipleLocations: false,
        apiAccess: false
      },
      limits: {
        maxUsers: 5,
        maxJobs: 50,
        storageGb: 1,
        apiCallsPerMonth: 1000
      },
      notifications: {
        email: true,
        sms: false,
        slack: false,
        webhook: false
      }
    };

    switch (plan) {
      case 'professional':
        return {
          ...baseSettings,
          features: {
            ...baseSettings.features,
            aiAssistant: true,
            advancedAnalytics: true,
            customIntegrations: true
          },
          limits: {
            maxUsers: 25,
            maxJobs: 500,
            storageGb: 10,
            apiCallsPerMonth: 10000
          },
          notifications: {
            ...baseSettings.notifications,
            sms: true,
            slack: true
          }
        };
      
      case 'enterprise':
        return {
          ...baseSettings,
          features: {
            aiAssistant: true,
            advancedAnalytics: true,
            customIntegrations: true,
            whiteLabel: true,
            multipleLocations: true,
            apiAccess: true
          },
          limits: {
            maxUsers: -1, // Unlimited
            maxJobs: -1,
            storageGb: 100,
            apiCallsPerMonth: 100000
          },
          notifications: {
            email: true,
            sms: true,
            slack: true,
            webhook: true
          }
        };
      
      default: // starter
        return baseSettings;
    }
  }

  private getDefaultBranding(): OrganizationBranding {
    return {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      fontFamily: 'Inter',
      companyName: '',
      tagline: 'Powered by Kin2 Workforce'
    };
  }

  async updateOrganizationBranding(
    organizationId: string, 
    branding: Partial<OrganizationBranding>
  ): Promise<boolean> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org) return false;

      const updatedBranding = { ...org.branding, ...branding } as OrganizationBranding;
      
      // Update basic fields in database
      await db.update(organizations)
        .set({ 
          updatedAt: new Date()
        })
        .where(eq(organizations.id, organizationId));

      // Update cache with extended data
      org.branding = updatedBranding;
      org.updatedAt = new Date();
      this.tenantCache.set(organizationId, org);

      return true;
    } catch (error) {
      logger.error('Failed to update organization branding:', error);
      return false;
    }
  }

  async updateOrganizationSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Promise<boolean> {
    try {
      const org = await this.getOrganization(organizationId);
      if (!org) return false;

      const updatedSettings = { ...org.settings, ...settings } as OrganizationSettings;
      
      // Update basic fields in database
      await db.update(organizations)
        .set({ 
          updatedAt: new Date()
        })
        .where(eq(organizations.id, organizationId));

      // Update cache with extended data
      org.settings = updatedSettings;
      org.updatedAt = new Date();
      this.tenantCache.set(organizationId, org);

      return true;
    } catch (error) {
      logger.error('Failed to update organization settings:', error);
      return false;
    }
  }

  private async getOrganization(organizationId: string): Promise<Organization | null> {
    // Check cache first
    if (this.tenantCache.has(organizationId)) {
      return this.tenantCache.get(organizationId)!;
    }

    // Query database
    const result = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!result.length) return null;

    const org = {
      ...result[0],
      domain: `${result[0].name}.example.com`,
      subdomain: result[0].name,
      plan: 'starter' as const,
      isActive: true,
      settings: this.getDefaultSettings('starter'),
      branding: this.getDefaultBranding()
    } as Organization;
    this.tenantCache.set(organizationId, org);
    
    return org;
  }

  async validateTenantAccess(
    organizationId: string,
    userId: string,
    requiredPermission?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    
    // Check if user has wildcard permission
    if (permissions.includes('*')) return true;
    
    // Check specific permission
    if (requiredPermission && !permissions.includes(requiredPermission)) {
      return false;
    }

    return permissions.length > 0;
  }

  async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: string,
    permissions: string[]
  ): Promise<boolean> {
    try {
      // Simplified: organization members not fully implemented in schema
      // Would require a separate organizationMembers table
      logger.info(`Add organization member: ${userId} to ${organizationId} as ${role}`);
      return true;
    } catch (error) {
      logger.error('Failed to add organization member:', error);
      return false;
    }
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      // Simplified: organization members not fully implemented in schema
      logger.info(`Remove organization member: ${userId} from ${organizationId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove organization member:', error);
      return false;
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    // Simplified: organization members table not in schema
    // Return owner as the only member for now
    const org = await this.getOrganization(organizationId);
    if (!org) return [];
    
    const owner = await db.select()
      .from(users)
      .where(eq(users.id, org.ownerId))
      .limit(1);

    if (!owner.length) return [];

    return [{
      ...owner[0],
      role: 'admin',
      permissions: ['*'],
      joinedAt: org.createdAt
    }];
  }

  generateCustomCSS(branding: OrganizationBranding): string {
    return `
:root {
  --primary-color: ${branding.primaryColor};
  --secondary-color: ${branding.secondaryColor};
  --font-family: ${branding.fontFamily};
}

.custom-theme {
  font-family: var(--font-family), sans-serif;
}

.custom-theme .bg-primary {
  background-color: var(--primary-color) !important;
}

.custom-theme .text-primary {
  color: var(--primary-color) !important;
}

.custom-theme .border-primary {
  border-color: var(--primary-color) !important;
}

.custom-theme .bg-secondary {
  background-color: var(--secondary-color) !important;
}

.custom-theme .text-secondary {
  color: var(--secondary-color) !important;
}

${branding.customCss || ''}
    `.trim();
  }

  async getOrganizationUsage(organizationId: string): Promise<{
    users: { current: number; limit: number };
    jobs: { current: number; limit: number };
    storage: { current: number; limit: number };
    apiCalls: { current: number; limit: number };
  }> {
    const org = await this.getOrganization(organizationId);
    if (!org) {
      return {
        users: { current: 0, limit: 0 },
        jobs: { current: 0, limit: 0 },
        storage: { current: 0, limit: 0 },
        apiCalls: { current: 0, limit: 0 }
      };
    }

    // Get current usage (simplified implementation)
    const [userCount, jobCount] = await Promise.all([
      // Simplified: count users in organization (owner only for now)
      Promise.resolve([{ count: 1 }]),
      // Would query jobs by organization
      Promise.resolve([{ count: 0 }])
    ]);

    const defaultLimits = {
      maxUsers: 5,
      maxJobs: 50,
      storageGb: 1,
      apiCallsPerMonth: 1000
    };

    return {
      users: { 
        current: userCount[0]?.count || 0, 
        limit: org.settings?.limits?.maxUsers || defaultLimits.maxUsers 
      },
      jobs: { 
        current: jobCount[0]?.count || 0, 
        limit: org.settings?.limits?.maxJobs || defaultLimits.maxJobs 
      },
      storage: { 
        current: 0, // Would calculate actual storage usage
        limit: org.settings?.limits?.storageGb || defaultLimits.storageGb 
      },
      apiCalls: { 
        current: 0, // Would calculate current month API calls
        limit: org.settings?.limits?.apiCallsPerMonth || defaultLimits.apiCallsPerMonth 
      }
    };
  }
}

export const multiTenantManager = new MultiTenantManager();