import logger from './utils/logger';
import crypto from 'crypto';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { storage } from './storage';

export interface SecurityConfig {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  ipWhitelist: string[];
  deviceTracking: boolean;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'permission_violation' | 'data_access' | 'system_breach';
  userId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

export interface TwoFactorSetup {
  userId: string;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  lastUsed?: Date;
}

export class SecurityManager {
  private config: SecurityConfig = {
    twoFactorRequired: false,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    ipWhitelist: [],
    deviceTracking: true
  };

  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private activeSessions: Map<string, { userId: string; lastActivity: Date }> = new Map();

  constructor() {
    this.startSecurityMonitoring();
  }

  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    request: { ip?: string; userAgent?: string } = {},
    resourceId?: string
  ): Promise<void> {
    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: request.ip || 'unknown',
      userAgent: request.userAgent || 'unknown',
      timestamp: new Date(),
      severity: this.calculateSeverity(action, resource)
    };

    try {
      // Audit logs table not in schema - using logger instead
      logger.info('Audit Event:', auditEntry);
      
      // Check for suspicious patterns
      await this.analyzeSuspiciousActivity(userId, action, resource);
    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  private calculateSeverity(action: string, resource: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical actions
    if (action.includes('delete') && ['user', 'payment', 'organization'].includes(resource)) {
      return 'critical';
    }
    
    // High severity
    if (['login', 'logout', 'permission_change', 'data_export'].includes(action)) {
      return 'high';
    }
    
    // Medium severity
    if (['create', 'update'].includes(action)) {
      return 'medium';
    }
    
    // Low severity for read operations
    return 'low';
  }

  async createSecurityEvent(
    type: SecurityEvent['type'],
    description: string,
    severity: SecurityEvent['severity'],
    metadata: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    const event: Omit<SecurityEvent, 'id'> = {
      type,
      userId,
      description,
      severity,
      metadata,
      timestamp: new Date(),
      resolved: false
    };

    try {
      // Security events table not in schema - using logger instead
      logger.warn('Security Event:', event);
      
      // Alert on high/critical events
      if (severity === 'high' || severity === 'critical') {
        await this.alertSecurityTeam(event);
      }
    } catch (error) {
      logger.error('Failed to create security event:', error);
    }
  }

  async checkLoginAttempts(identifier: string): Promise<boolean> {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return true;

    // Reset if last attempt was more than 15 minutes ago
    if (Date.now() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
      this.loginAttempts.delete(identifier);
      return true;
    }

    return attempts.count < this.config.maxLoginAttempts;
  }

  async recordLoginAttempt(identifier: string, success: boolean, userId?: string): Promise<void> {
    if (success) {
      this.loginAttempts.delete(identifier);
      return;
    }

    const current = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    current.count++;
    current.lastAttempt = new Date();
    this.loginAttempts.set(identifier, current);

    // Log security event for failed attempts
    if (current.count >= 3) {
      await this.createSecurityEvent(
        'failed_login',
        `Multiple failed login attempts from ${identifier}`,
        'medium',
        { identifier, attemptCount: current.count },
        userId
      );
    }
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = crypto.randomBytes(20).toString('hex');
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Two-factor auth table not in schema - would store in database
    logger.info(`2FA setup for user ${userId}`);

    // Generate QR code URL (would use qr code library in real implementation)
    const qrCode = `otpauth://totp/Kin2%20Workforce:${userId}?secret=${secret}&issuer=Kin2%20Workforce`;

    await this.logAuditEvent(
      userId,
      'setup_2fa',
      'security',
      { enabled: false },
      {},
      userId
    );

    return { secret, qrCode, backupCodes };
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    // Two-factor auth table not in schema - stubbed implementation
    logger.info(`2FA enabled for user ${userId}`);
    
    await this.logAuditEvent(
      userId,
      'enable_2fa',
      'security',
      { enabled: true },
      {},
      userId
    );

    return true;
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    // Two-factor auth table not in schema - stubbed implementation
    // In production, would verify against stored secret
    logger.info(`2FA verification attempt for user ${userId}`);
    return true;
  }

  private verifyTwoFactorToken(secret: string, token: string): boolean {
    // Simple TOTP implementation (would use proper library in production)
    const time = Math.floor(Date.now() / 1000 / 30);
    const hash = crypto.createHmac('sha1', Buffer.from(secret, 'hex'))
      .update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'))
      .digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) | 
                 ((hash[offset + 1] & 0xff) << 16) | 
                 ((hash[offset + 2] & 0xff) << 8) | 
                 (hash[offset + 3] & 0xff);
    
    const otp = (code % 1000000).toString().padStart(6, '0');
    return otp === token;
  }

  async validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const requirements = this.config.passwordRequirements;

    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requirements.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) return false;

      const userRole = user[0].role;
      
      // Define role-based permissions
      const permissions = this.getRolePermissions(userRole);
      const hasPermission = permissions[resource]?.includes(action) || false;

      // Log permission check
      await this.logAuditEvent(
        userId,
        'permission_check',
        'security',
        { resource, action, granted: hasPermission },
        {},
        resource
      );

      if (!hasPermission) {
        await this.createSecurityEvent(
          'permission_violation',
          `User attempted unauthorized action: ${action} on ${resource}`,
          'medium',
          { resource, action },
          userId
        );
      }

      return hasPermission;
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }

  private getRolePermissions(role: string): Record<string, string[]> {
    switch (role) {
      case 'admin':
        return {
          users: ['create', 'read', 'update', 'delete'],
          jobs: ['create', 'read', 'update', 'delete'],
          payments: ['create', 'read', 'update', 'delete'],
          reports: ['create', 'read', 'update', 'delete'],
          settings: ['create', 'read', 'update', 'delete']
        };
      case 'client':
        return {
          jobs: ['create', 'read', 'update'],
          payments: ['read'],
          reports: ['read'],
          workers: ['read']
        };
      case 'worker':
        return {
          jobs: ['read'],
          timesheets: ['create', 'read', 'update'],
          shifts: ['read', 'update'],
          profile: ['read', 'update']
        };
      default:
        return {};
    }
  }

  private async analyzeSuspiciousActivity(userId: string, action: string, resource: string): Promise<void> {
    // Audit logs table not in schema - would analyze activity patterns
    logger.info(`Analyzing activity for user ${userId}: ${action} on ${resource}`);
  }

  private async alertSecurityTeam(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    // Implementation would send alerts to security team
    console.log(`🚨 Security Alert [${event.severity.toUpperCase()}]: ${event.description}`);
  }

  private startSecurityMonitoring(): void {
    // Clean up old login attempts every hour
    setInterval(() => {
      const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour ago
      for (const [key, attempts] of Array.from(this.loginAttempts.entries())) {
        if (attempts.lastAttempt.getTime() < cutoff) {
          this.loginAttempts.delete(key);
        }
      }
    }, 60 * 60 * 1000);

    // Session cleanup
    setInterval(() => {
      const cutoff = Date.now() - this.config.sessionTimeout;
      for (const [sessionId, session] of Array.from(this.activeSessions.entries())) {
        if (session.lastActivity.getTime() < cutoff) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  async getSecurityDashboard(): Promise<{
    activeThreats: number;
    recentEvents: SecurityEvent[];
    systemHealth: string;
    recommendations: string[];
  }> {
    // Security events table not in schema - returning mock data
    const recentEvents: SecurityEvent[] = [];
    const activeThreats = 0;

    const recommendations = [];
    if (activeThreats > 0) {
      recommendations.push('Review and resolve active high-severity security events');
    }
    recommendations.push('Regular security audit recommended');
    recommendations.push('Enable two-factor authentication for all admin users');

    return {
      activeThreats,
      recentEvents,
      systemHealth: activeThreats === 0 ? 'secure' : 'attention_required',
      recommendations
    };
  }
}

export const securityManager = new SecurityManager();