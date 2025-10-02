import { Router } from "express";
import type { Express } from "express";
import { isAuthenticated, isAuthenticatedOrDemo } from "../middleware/auth-guards";
import { asyncHandler, AuthorizationError, ExternalServiceError } from "../middleware/error-handler";
import { cacheMiddleware, invalidateOnMutation, CacheDomains, CacheTTL } from "../middleware/cache";
import logger from "../utils/logger";

export function registerComplianceRoutes(app: Express, services: {
  regulatoryComplianceService: any;
  loggingService: any;
  storage: any;
}) {
  const { regulatoryComplianceService, loggingService, storage } = services;

  // Compliance Overview
  app.get('/api/compliance/overview', 
    isAuthenticatedOrDemo,
    cacheMiddleware({ domain: CacheDomains.COMPLIANCE, ttl: CacheTTL.MEDIUM }),
    asyncHandler(async (req, res) => {
      const report = await regulatoryComplianceService.generateComplianceReport();
      res.json({
        totalRegulations: report.summary.totalRegulations,
        compliantRegulations: report.summary.compliantRegulations,
        partialCompliance: report.summary.partialCompliance,
        nonCompliantRegulations: report.summary.nonCompliantRegulations,
        overallScore: report.summary.overallScore,
        activeIncidents: report.summary.activeIncidents,
        pendingAssessments: 3,
        dataRetentionCompliance: 94.5
      });
    })
  );

  // Get Regulations
  app.get('/api/compliance/regulations', 
    isAuthenticatedOrDemo,
    cacheMiddleware({ domain: CacheDomains.COMPLIANCE, ttl: CacheTTL.LONG }),
    asyncHandler(async (req, res) => {
      const regulations = regulatoryComplianceService.getRegulations();
      const assessments = regulatoryComplianceService.getAssessments();
      
      const regulationsWithStatus = regulations.map((reg: any) => {
        const latestAssessment = assessments
          .filter((a: any) => a.regulationId === reg.id)
          .sort((a: any, b: any) => b.assessmentDate - a.assessmentDate)[0];
        
        return {
          id: reg.id,
          name: reg.name,
          description: reg.description,
          jurisdiction: reg.jurisdiction,
          status: latestAssessment?.status || 'non_compliant',
          score: latestAssessment?.overallScore || 0,
          lastAssessed: latestAssessment?.assessmentDate || Date.now() - 86400000,
          nextAssessment: latestAssessment?.nextAssessment || Date.now() + 86400000,
          gaps: latestAssessment?.gaps.length || 0,
          incidents: 0,
          keyRequirements: reg.keyRequirements.length
        };
      });
      
      res.json(regulationsWithStatus);
    })
  );

  // Get Incidents
  app.get('/api/compliance/incidents', 
    isAuthenticatedOrDemo,
    cacheMiddleware({ domain: CacheDomains.COMPLIANCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const incidents = regulatoryComplianceService.getIncidents('open');
      res.json(incidents);
    })
  );

  // Get Audit Logs
  app.get('/api/compliance/audit-logs',
    isAuthenticatedOrDemo,
    cacheMiddleware({ domain: CacheDomains.COMPLIANCE, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const { timeRange = '30d' } = req.query;
      const logs = loggingService.searchLogs({
        level: ['audit', 'security', 'compliance'],
        timeRange: {
          start: Date.now() - 30 * 24 * 60 * 60 * 1000,
          end: Date.now()
        }
      });
      
      res.json(logs.slice(0, 100));
    })
  );

  // Conduct Assessment
  app.post('/api/compliance/assess/:regulationId',
    isAuthenticated,
    invalidateOnMutation({ domains: ['COMPLIANCE'] }),
    asyncHandler(async (req, res) => {
      const { regulationId } = req.params;
      const assessment = await regulatoryComplianceService.conductAssessment(regulationId);
      res.json(assessment);
    })
  );

  // Export Compliance Report
  app.post('/api/compliance/export',
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { regulation, timeRange, format } = req.body;
      const report = await regulatoryComplianceService.generateComplianceReport(regulation);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${Date.now()}.json"`);
      res.json(report);
    })
  );

  // Report Incident
  app.post('/api/compliance/incident',
    isAuthenticated,
    invalidateOnMutation({ domains: ['COMPLIANCE'] }),
    asyncHandler(async (req: any, res) => {
      const incident = regulatoryComplianceService.reportIncident(req.body);
      
      loggingService.security('compliance_incident', incident.severity as any, {
        incidentId: incident.id,
        regulation: incident.regulation,
        type: incident.type
      }, req.user?.claims?.sub);
      
      res.json(incident);
    })
  );

  // Log Data Access
  app.post('/api/log/data-access',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { dataType, operation, recordIds, purpose } = req.body;
      
      loggingService.dataAccess(
        req.user.claims.sub,
        dataType,
        operation,
        recordIds,
        purpose,
        req
      );
      
      res.json({ logged: true });
    })
  );

  // Forget User (GDPR Right to be Forgotten)
  app.post('/api/compliance/forget-user/:userId',
    isAuthenticated,
    invalidateOnMutation({ domains: ['COMPLIANCE'], userIdFrom: 'params' }),
    asyncHandler(async (req: any, res) => {
      const { userId } = req.params;
      const currentUser = req.user.claims.sub;
      
      const user = await storage.getUser(currentUser);
      if (user?.role !== 'admin' && currentUser !== userId) {
        throw new AuthorizationError('Only admins or the user themselves can request data deletion');
      }
      
      const result = loggingService.forgetUser(userId);
      
      loggingService.compliance('GDPR', 'right_to_be_forgotten_executed', 'compliant', {
        userId,
        requestedBy: currentUser,
        deleted: result.deleted,
        anonymized: result.anonymized
      });
      
      res.json(result);
    })
  );

  logger.info('✅ Compliance routes registered');
}
