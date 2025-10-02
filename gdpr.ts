import logger from './utils/logger';
import { db } from './db.js';
import { storage } from './storage.js';
import {
  gdprConsents,
  gdprDataRequests,
  gdprDataProcessingLogs,
  gdprCookieConsents,
  gdprDataRetention,
  users,
  jobs,
  shifts,
  timesheets,
  payments,
  type GdprConsent,
  type GdprDataRequest,
  type GdprCookieConsent,
  type InsertGdprConsent,
  type InsertGdprDataRequest,
  type InsertGdprDataProcessingLog,
  type InsertGdprCookieConsent,
} from '@shared/schema';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';

export interface ConsentOptions {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface DataExportResult {
  personal_data: {
    profile: any;
    jobs: any[];
    shifts: any[];
    timesheets: any[];
    payments: any[];
  };
  consent_history: any[];
  processing_logs: any[];
  export_generated_at: string;
  data_retention_info: string;
}

export class GDPRService {
  // Cookie Consent Management
  async recordCookieConsent(params: {
    userId?: string;
    sessionId?: string;
    consents: ConsentOptions;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<GdprCookieConsent> {
    const { userId, sessionId, consents, ipAddress, userAgent } = params;

    // Expire old consents
    if (userId) {
      await db.update(gdprCookieConsents)
        .set({ expiresAt: new Date() })
        .where(and(
          eq(gdprCookieConsents.userId, userId),
          isNull(gdprCookieConsents.expiresAt)
        ));
    }

    const [consent] = await db.insert(gdprCookieConsents).values({
      userId,
      sessionId,
      necessary: consents.necessary,
      analytics: consents.analytics,
      marketing: consents.marketing,
      functional: consents.functional,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    }).returning();

    // Log the consent action
    if (userId) {
      await this.logDataProcessing({
        userId,
        activity: 'data_processing',
        dataTypes: ['cookie_preferences'],
        purpose: 'Cookie consent management and user preference tracking',
        legalBasis: 'consent',
        ipAddress,
        userAgent,
        requestedBy: 'user',
      });
    }

    return consent;
  }

  async getCookieConsent(userId?: string, sessionId?: string): Promise<GdprCookieConsent | null> {
    const query = userId 
      ? eq(gdprCookieConsents.userId, userId)
      : eq(gdprCookieConsents.sessionId, sessionId!);

    const [consent] = await db.select()
      .from(gdprCookieConsents)
      .where(and(
        query,
        isNull(gdprCookieConsents.expiresAt)
      ))
      .orderBy(gdprCookieConsents.createdAt)
      .limit(1);

    return consent || null;
  }

  // Data Subject Rights
  async submitDataRequest(params: {
    userId: string;
    requestType: 'access' | 'portability' | 'rectification' | 'erasure' | 'restrict_processing' | 'object_processing';
    requestDetails?: any;
    verificationMethod?: string;
  }): Promise<GdprDataRequest> {
    const { userId, requestType, requestDetails, verificationMethod } = params;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [request] = await db.insert(gdprDataRequests).values({
      userId,
      requestType,
      requestDetails,
      dueDate,
      verificationMethod,
      verifiedAt: new Date(), // Auto-verify for authenticated users
    }).returning();

    // Log the request
    await this.logDataProcessing({
      userId,
      activity: 'data_access',
      dataTypes: ['personal_data'],
      purpose: `GDPR ${requestType} request submitted`,
      legalBasis: 'legal_obligation',
      requestedBy: 'user',
    });

    // Auto-process certain request types
    if (requestType === 'access' || requestType === 'portability') {
      setTimeout(() => this.processDataRequest(request.id), 1000);
    }

    return request;
  }

  async processDataRequest(requestId: string): Promise<void> {
    const [request] = await db.select().from(gdprDataRequests).where(eq(gdprDataRequests.id, requestId));
    if (!request) return;

    try {
      await db.update(gdprDataRequests)
        .set({ status: 'in_progress' })
        .where(eq(gdprDataRequests.id, requestId));

      let responseData: any = {};

      switch (request.requestType) {
        case 'access':
        case 'portability':
          responseData = await this.exportUserData(request.userId);
          break;
        case 'erasure':
          await this.deleteUserData(request.userId);
          responseData = { message: 'User data has been permanently deleted' };
          break;
        case 'rectification':
          responseData = { message: 'Data rectification request received. Please contact support with specific changes needed.' };
          break;
        default:
          responseData = { message: 'Request processed successfully' };
      }

      await db.update(gdprDataRequests)
        .set({
          status: 'completed',
          responseData,
          completedAt: new Date(),
        })
        .where(eq(gdprDataRequests.id, requestId));

      // Log completion
      await this.logDataProcessing({
        userId: request.userId,
        activity: request.requestType === 'erasure' ? 'data_deletion' : 'data_export',
        dataTypes: ['personal_data'],
        purpose: `GDPR ${request.requestType} request completed`,
        legalBasis: 'legal_obligation',
        requestedBy: 'system',
      });

    } catch (error) {
      logger.error('Error processing GDPR request:', error);
      await db.update(gdprDataRequests)
        .set({
          status: 'rejected',
          rejectionReason: 'Technical error during processing',
        })
        .where(eq(gdprDataRequests.id, requestId));
    }
  }

  async exportUserData(userId: string): Promise<DataExportResult> {
    // Get user profile
    const user = await storage.getUser(userId);
    
    // Get user's jobs, shifts, timesheets, payments
    const userJobs = await db.select().from(jobs).where(eq(jobs.clientId, userId));
    const userShifts = await db.select().from(shifts).where(eq(shifts.workerId, userId));
    const userTimesheets = await db.select().from(timesheets).where(eq(timesheets.workerId, userId));
    const userPayments = await db.select().from(payments).where(eq(payments.workerId, userId));

    // Get consent history
    const consentHistory = await db.select().from(gdprConsents).where(eq(gdprConsents.userId, userId));
    
    // Get processing logs
    const processingLogs = await db.select()
      .from(gdprDataProcessingLogs)
      .where(eq(gdprDataProcessingLogs.userId, userId));

    return {
      personal_data: {
        profile: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          karmaCoins: user.karmaCoins,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } : null,
        jobs: userJobs,
        shifts: userShifts,
        timesheets: userTimesheets,
        payments: userPayments,
      },
      consent_history: consentHistory,
      processing_logs: processingLogs,
      export_generated_at: new Date().toISOString(),
      data_retention_info: 'Data is retained according to our retention policy. Contact support for specific retention periods.',
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Log before deletion
    await this.logDataProcessing({
      userId,
      activity: 'data_deletion',
      dataTypes: ['personal_data', 'job_data', 'payment_data', 'timesheet_data'],
      purpose: 'GDPR erasure request - complete data deletion',
      legalBasis: 'legal_obligation',
      requestedBy: 'user',
    });

    // Delete in order to respect foreign key constraints
    await db.delete(timesheets).where(eq(timesheets.workerId, userId));
    await db.delete(payments).where(eq(payments.workerId, userId));
    await db.delete(shifts).where(eq(shifts.workerId, userId));
    await db.delete(jobs).where(eq(jobs.clientId, userId));
    await db.delete(gdprConsents).where(eq(gdprConsents.userId, userId));
    await db.delete(gdprCookieConsents).where(eq(gdprCookieConsents.userId, userId));
    
    // Finally delete user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Data Processing Logging
  async logDataProcessing(params: InsertGdprDataProcessingLog): Promise<void> {
    await db.insert(gdprDataProcessingLogs).values({
      ...params,
      completedAt: new Date(),
    });
  }

  // Automated Data Retention
  async processDataRetention(): Promise<{ deleted: number; errors: string[] }> {
    const retentionPolicies = await db.select().from(gdprDataRetention).where(eq(gdprDataRetention.isActive, true));
    
    let totalDeleted = 0;
    const errors: string[] = [];

    for (const policy of retentionPolicies) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

        if (policy.autoDelete) {
          let deletedCount = 0;

          // Handle different table types
          switch (policy.tableName) {
            case 'gdpr_data_processing_logs':
              const deletedLogs = await db.delete(gdprDataProcessingLogs)
                .where(lte(gdprDataProcessingLogs.createdAt, cutoffDate))
                .returning();
              deletedCount = deletedLogs.length;
              break;
            case 'gdpr_cookie_consents':
              const deletedConsents = await db.delete(gdprCookieConsents)
                .where(lte(gdprCookieConsents.createdAt, cutoffDate))
                .returning();
              deletedCount = deletedConsents.length;
              break;
            // Add more table handling as needed
          }

          if (deletedCount > 0) {
            console.log(`🗑️ GDPR: Deleted ${deletedCount} records from ${policy.tableName} (retention: ${policy.retentionPeriodDays} days)`);
            totalDeleted += deletedCount;
          }

          // Update last processed time
          await db.update(gdprDataRetention)
            .set({ lastProcessedAt: new Date() })
            .where(eq(gdprDataRetention.id, policy.id));
        }
      } catch (error) {
        const errorMsg = `Error processing retention for ${policy.tableName}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { deleted: totalDeleted, errors };
  }

  // Compliance Reporting
  async generateComplianceReport(startDate: Date, endDate: Date) {
    const dataRequests = await db.select()
      .from(gdprDataRequests)
      .where(and(
        lte(gdprDataRequests.createdAt, endDate),
        gte(gdprDataRequests.createdAt, startDate)
      ));

    const processingLogs = await db.select()
      .from(gdprDataProcessingLogs)
      .where(and(
        lte(gdprDataProcessingLogs.createdAt, endDate),
        gte(gdprDataProcessingLogs.createdAt, startDate)
      ));

    return {
      period: { start: startDate, end: endDate },
      summary: {
        total_data_requests: dataRequests.length,
        completed_requests: dataRequests.filter(r => r.status === 'completed').length,
        pending_requests: dataRequests.filter(r => r.status === 'pending').length,
        processing_activities: processingLogs.length,
      },
      request_breakdown: {
        access: dataRequests.filter(r => r.requestType === 'access').length,
        portability: dataRequests.filter(r => r.requestType === 'portability').length,
        erasure: dataRequests.filter(r => r.requestType === 'erasure').length,
        rectification: dataRequests.filter(r => r.requestType === 'rectification').length,
      },
      processing_activities: processingLogs.reduce((acc, log) => {
        acc[log.activity] = (acc[log.activity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      compliance_status: 'compliant', // Could be calculated based on response times, etc.
    };
  }

  // Get user's privacy dashboard data
  async getUserPrivacyData(userId: string) {
    const [cookieConsent] = await db.select()
      .from(gdprCookieConsents)
      .where(and(
        eq(gdprCookieConsents.userId, userId),
        isNull(gdprCookieConsents.expiresAt)
      ))
      .orderBy(gdprCookieConsents.createdAt)
      .limit(1);

    const dataRequests = await db.select()
      .from(gdprDataRequests)
      .where(eq(gdprDataRequests.userId, userId))
      .orderBy(gdprDataRequests.createdAt);

    const consents = await db.select()
      .from(gdprConsents)
      .where(eq(gdprConsents.userId, userId))
      .orderBy(gdprConsents.createdAt);

    return {
      cookie_preferences: cookieConsent || {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      },
      data_requests: dataRequests,
      consents: consents,
      last_updated: new Date().toISOString(),
    };
  }
}

export const gdprService = new GDPRService();