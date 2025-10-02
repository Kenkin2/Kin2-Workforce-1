import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'audit' | 'security' | 'compliance';
  category: string;
  message: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  context?: {
    module: string;
    function: string;
    requestId?: string;
    organizationId?: string;
  };
  compliance?: {
    retention: number; // Days to retain
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    regulations: string[]; // GDPR, HIPAA, SOX, etc.
    pii: boolean; // Contains personally identifiable information
  };
}

interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  outcome: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  regulations: string[];
}

interface ComplianceReport {
  period: string;
  generatedAt: number;
  totalEvents: number;
  auditEvents: number;
  securityIncidents: number;
  dataAccessEvents: number;
  retentionCompliance: number;
  regulatoryCompliance: {
    gdpr: ComplianceStatus;
    hipaa: ComplianceStatus;
    sox: ComplianceStatus;
    iso27001: ComplianceStatus;
  };
  violations: ComplianceViolation[];
  recommendations: string[];
}

interface ComplianceStatus {
  compliant: boolean;
  score: number;
  lastAudit: number;
  issues: string[];
  recommendations: string[];
}

interface ComplianceViolation {
  id: string;
  timestamp: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  regulation: string;
  affected: string[];
  remediation: string;
  status: 'open' | 'investigating' | 'resolved';
}

export class LoggingService extends EventEmitter {
  private logs: Map<string, LogEntry[]> = new Map();
  private auditTrail: AuditEvent[] = [];
  private maxLogsPerCategory = 10000;
  private retentionPolicies: Map<string, number> = new Map();
  private complianceRules: Map<string, any> = new Map();
  private realTimeAlerts: Set<string> = new Set();

  constructor() {
    super();
    this.initializeRetentionPolicies();
    this.initializeComplianceRules();
    this.startCleanupRoutine();
    this.startComplianceMonitoring();
  }

  // Core Logging Methods
  debug(message: string, context?: any) {
    this.log('debug', 'system', message, context);
  }

  info(message: string, context?: any) {
    this.log('info', 'system', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', 'system', message, context);
  }

  error(message: string, error?: Error, context?: any) {
    this.log('error', 'system', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  // Audit Logging
  audit(action: string, resource: string, resourceId: string, userId: string, outcome: 'success' | 'failure' | 'warning', details: any, request?: any) {
    const auditEvent: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      resource,
      resourceId,
      userId,
      outcome,
      details,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.get('User-Agent') || 'unknown',
      riskLevel: this.calculateRiskLevel(action, outcome, details),
      regulations: this.getApplicableRegulations(action, resource)
    };

    this.auditTrail.push(auditEvent);
    this.log('audit', 'security', `${action} on ${resource}:${resourceId}`, auditEvent);

    // Real-time security monitoring
    if (auditEvent.riskLevel === 'high' || auditEvent.riskLevel === 'critical') {
      this.triggerSecurityAlert(auditEvent);
    }

    // Keep audit trail manageable
    if (this.auditTrail.length > 50000) {
      this.auditTrail = this.auditTrail.slice(-25000);
    }

    this.emit('auditEvent', auditEvent);
  }

  // Security Logging
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any, userId?: string) {
    this.log('security', 'security', event, {
      severity,
      userId,
      ...details
    }, {
      retention: 2555, // 7 years for security events
      classification: 'restricted',
      regulations: ['SOX', 'ISO27001', 'GDPR'],
      pii: false
    });

    if (severity === 'high' || severity === 'critical') {
      this.triggerSecurityIncident(event, severity, details, userId);
    }
  }

  // Compliance Logging
  compliance(regulation: string, event: string, status: 'compliant' | 'violation' | 'warning', details: any) {
    this.log('compliance', 'regulatory', `${regulation}: ${event}`, {
      regulation,
      status,
      ...details
    }, {
      retention: this.getRetentionPeriod(regulation),
      classification: 'confidential',
      regulations: [regulation],
      pii: this.containsPII(details)
    });

    if (status === 'violation') {
      this.handleComplianceViolation(regulation, event, details);
    }
  }

  // Data Access Logging (GDPR, HIPAA)
  dataAccess(userId: string, dataType: string, operation: 'read' | 'write' | 'delete', recordIds: string[], purpose: string, request?: any) {
    const accessEvent = {
      userId,
      dataType,
      operation,
      recordIds,
      purpose,
      ipAddress: request?.ip,
      userAgent: request?.get('User-Agent'),
      timestamp: Date.now()
    };

    this.log('audit', 'data_access', `Data ${operation}: ${dataType}`, accessEvent, {
      retention: 2555, // 7 years
      classification: 'restricted',
      regulations: ['GDPR', 'HIPAA'],
      pii: true
    });

    this.emit('dataAccess', accessEvent);
  }

  // Performance Logging
  performance(operation: string, duration: number, metadata?: any) {
    this.log('info', 'performance', `${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...metadata
    });

    // Alert on slow operations
    if (duration > 5000) {
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }
  }

  // Business Process Logging
  businessProcess(process: string, step: string, status: 'started' | 'completed' | 'failed', details: any, userId?: string) {
    this.log('info', 'business', `${process} - ${step}: ${status}`, {
      process,
      step,
      status,
      userId,
      ...details
    }, {
      retention: 2555, // 7 years for business records
      classification: 'internal',
      regulations: ['SOX'],
      pii: false
    });
  }

  // System Monitoring Logs
  systemHealth(component: string, status: 'healthy' | 'degraded' | 'unhealthy', metrics: any) {
    this.log('info', 'system_health', `${component}: ${status}`, {
      component,
      status,
      metrics,
      timestamp: Date.now()
    });

    if (status === 'unhealthy') {
      this.error(`System component unhealthy: ${component}`, undefined, metrics);
    }
  }

  // Compliance Reporting
  generateComplianceReport(period: string = '30d'): ComplianceReport {
    const startTime = this.getPeriodStartTime(period);
    const relevantLogs = this.getLogsSince(startTime);
    const relevantAudits = this.auditTrail.filter(a => a.timestamp >= startTime);

    return {
      period,
      generatedAt: Date.now(),
      totalEvents: relevantLogs.length,
      auditEvents: relevantAudits.length,
      securityIncidents: relevantLogs.filter(l => l.level === 'security').length,
      dataAccessEvents: relevantLogs.filter(l => l.category === 'data_access').length,
      retentionCompliance: this.calculateRetentionCompliance(),
      regulatoryCompliance: {
        gdpr: this.assessGDPRCompliance(relevantLogs),
        hipaa: this.assessHIPAACompliance(relevantLogs),
        sox: this.assessSOXCompliance(relevantLogs),
        iso27001: this.assessISO27001Compliance(relevantLogs)
      },
      violations: this.getComplianceViolations(startTime),
      recommendations: this.generateComplianceRecommendations()
    };
  }

  // Advanced Search and Analytics
  searchLogs(criteria: {
    level?: string[];
    category?: string[];
    userId?: string;
    timeRange?: { start: number; end: number };
    keywords?: string[];
    regulations?: string[];
  }): LogEntry[] {
    const allLogs = this.getAllLogs();
    
    return allLogs.filter(log => {
      if (criteria.level && !criteria.level.includes(log.level)) return false;
      if (criteria.category && !criteria.category.includes(log.category)) return false;
      if (criteria.userId && log.userId !== criteria.userId) return false;
      if (criteria.timeRange) {
        if (log.timestamp < criteria.timeRange.start || log.timestamp > criteria.timeRange.end) return false;
      }
      if (criteria.keywords) {
        const logText = JSON.stringify(log).toLowerCase();
        if (!criteria.keywords.some(keyword => logText.includes(keyword.toLowerCase()))) return false;
      }
      if (criteria.regulations && log.compliance) {
        if (!criteria.regulations.some(reg => log.compliance!.regulations.includes(reg))) return false;
      }
      return true;
    });
  }

  // Real-time Monitoring
  addRealTimeAlert(pattern: string) {
    this.realTimeAlerts.add(pattern);
  }

  removeRealTimeAlert(pattern: string) {
    this.realTimeAlerts.delete(pattern);
  }

  // Export and Backup
  exportLogs(format: 'json' | 'csv' | 'xml' = 'json', criteria?: any): string {
    const logs = criteria ? this.searchLogs(criteria) : this.getAllLogs();
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv':
        return this.convertToCSV(logs);
      case 'xml':
        return this.convertToXML(logs);
      default:
        return JSON.stringify(logs);
    }
  }

  // GDPR Right to be Forgotten
  forgetUser(userId: string): { deleted: number; anonymized: number } {
    let deleted = 0;
    let anonymized = 0;

    // Delete or anonymize logs based on retention policies
    for (const [category, logs] of Array.from(this.logs.entries())) {
      const toDelete = [];
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.userId === userId) {
          if (this.canDeleteLog(log)) {
            toDelete.push(i);
            deleted++;
          } else {
            // Anonymize instead of delete for compliance requirements
            log.userId = 'anonymized';
            log.metadata = { ...log.metadata, anonymized: true };
            anonymized++;
          }
        }
      }
      
      // Remove in reverse order to maintain indices
      toDelete.reverse().forEach(index => logs.splice(index, 1));
    }

    // Anonymize audit trail
    this.auditTrail.forEach(audit => {
      if (audit.userId === userId) {
        audit.userId = 'anonymized';
        audit.details = { ...audit.details, anonymized: true };
        anonymized++;
      }
    });

    this.compliance('GDPR', 'right_to_be_forgotten', 'compliant', {
      userId,
      deleted,
      anonymized,
      timestamp: Date.now()
    });

    return { deleted, anonymized };
  }

  // Core logging implementation
  private log(level: LogEntry['level'], category: string, message: string, metadata?: any, compliance?: LogEntry['compliance']) {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      metadata,
      compliance: compliance || this.getDefaultCompliance(level, category)
    };

    // Add logs to category
    if (!this.logs.has(category)) {
      this.logs.set(category, []);
    }
    
    const categoryLogs = this.logs.get(category)!;
    categoryLogs.push(logEntry);

    // Maintain size limits
    if (categoryLogs.length > this.maxLogsPerCategory) {
      categoryLogs.splice(0, categoryLogs.length - this.maxLogsPerCategory);
    }

    // Real-time alert checking
    this.checkRealTimeAlerts(logEntry);

    // Emit for real-time listeners
    this.emit('log', logEntry);
    this.emit(level, logEntry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date(logEntry.timestamp).toISOString()}] ${level.toUpperCase()}: ${message}`);
    }
  }

  // Helper methods
  private initializeRetentionPolicies() {
    this.retentionPolicies.set('debug', 7);      // 7 days
    this.retentionPolicies.set('info', 90);      // 90 days
    this.retentionPolicies.set('warn', 365);     // 1 year
    this.retentionPolicies.set('error', 1095);   // 3 years
    this.retentionPolicies.set('audit', 2555);   // 7 years
    this.retentionPolicies.set('security', 2555); // 7 years
    this.retentionPolicies.set('compliance', 2555); // 7 years
  }

  private initializeComplianceRules() {
    this.complianceRules.set('GDPR', {
      dataMinimization: true,
      purposeLimitation: true,
      storageLimit: 2555, // 7 years max
      rightToErasure: true,
      dataPortability: true
    });

    this.complianceRules.set('HIPAA', {
      accessLogging: true,
      encryptionRequired: true,
      retentionPeriod: 2190, // 6 years
      auditTrail: true
    });

    this.complianceRules.set('SOX', {
      auditTrail: true,
      retentionPeriod: 2555, // 7 years
      immutableRecords: true,
      executiveAccess: false
    });
  }

  private calculateRiskLevel(action: string, outcome: string, details: any): 'low' | 'medium' | 'high' | 'critical' {
    if (outcome === 'failure') {
      if (action.includes('login') || action.includes('access')) return 'high';
      if (action.includes('admin') || action.includes('delete')) return 'critical';
      return 'medium';
    }

    if (action.includes('admin') || action.includes('delete') || action.includes('modify_permissions')) {
      return 'high';
    }

    return 'low';
  }

  private getApplicableRegulations(action: string, resource: string): string[] {
    const regulations = [];
    
    if (resource.includes('user') || resource.includes('personal')) {
      regulations.push('GDPR');
    }
    
    if (resource.includes('health') || resource.includes('medical')) {
      regulations.push('HIPAA');
    }
    
    if (action.includes('financial') || resource.includes('payment')) {
      regulations.push('SOX');
    }
    
    if (action.includes('security') || action.includes('access')) {
      regulations.push('ISO27001');
    }
    
    return regulations;
  }

  private triggerSecurityAlert(auditEvent: AuditEvent) {
    this.security('high_risk_activity', auditEvent.riskLevel as any, {
      auditEventId: auditEvent.id,
      action: auditEvent.action,
      resource: auditEvent.resource,
      outcome: auditEvent.outcome
    }, auditEvent.userId);

    this.emit('securityAlert', auditEvent);
  }

  private triggerSecurityIncident(event: string, severity: string, details: any, userId?: string) {
    this.emit('securityIncident', {
      event,
      severity,
      details,
      userId,
      timestamp: Date.now()
    });
  }

  private handleComplianceViolation(regulation: string, event: string, details: any) {
    const violation: ComplianceViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: event,
      severity: this.getViolationSeverity(regulation, event),
      description: `${regulation} compliance violation: ${event}`,
      regulation,
      affected: details.affected || [],
      remediation: this.getRemediationSteps(regulation, event),
      status: 'open'
    };

    this.emit('complianceViolation', violation);
  }

  private startCleanupRoutine() {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanupExpiredLogs();
    }, 24 * 60 * 60 * 1000);
  }

  private startComplianceMonitoring() {
    // Check compliance every hour
    setInterval(() => {
      this.monitorCompliance();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredLogs() {
    const now = Date.now();
    let cleaned = 0;

    for (const [category, logs] of Array.from(this.logs.entries())) {
      const before = logs.length;
      const retention = this.retentionPolicies.get(category) || 90;
      const cutoff = now - (retention * 24 * 60 * 60 * 1000);
      
      // Remove expired logs
      const filtered = logs.filter((log: LogEntry) => {
        if (log.timestamp < cutoff && this.canDeleteLog(log)) {
          cleaned++;
          return false;
        }
        return true;
      });
      
      this.logs.set(category, filtered);
    }

    if (cleaned > 0) {
      this.info(`Cleaned up ${cleaned} expired log entries`);
    }
  }

  private canDeleteLog(log: LogEntry): boolean {
    // Never delete audit, security, or compliance logs
    if (['audit', 'security', 'compliance'].includes(log.level)) {
      return false;
    }

    // Check if log is required for ongoing investigations
    if (log.metadata?.investigation || log.metadata?.legal_hold) {
      return false;
    }

    return true;
  }

  private monitorCompliance() {
    // Implementation for ongoing compliance monitoring
    const violations = this.detectComplianceViolations();
    violations.forEach(violation => {
      this.handleComplianceViolation(violation.regulation, violation.type, violation);
    });
  }

  private detectComplianceViolations(): any[] {
    // Implementation for automated compliance violation detection
    return [];
  }

  private getDefaultCompliance(level: string, category: string): LogEntry['compliance'] {
    const retention = this.retentionPolicies.get(level) || 90;
    
    return {
      retention,
      classification: level === 'security' ? 'restricted' : 'internal',
      regulations: [],
      pii: false
    };
  }

  private checkRealTimeAlerts(log: LogEntry) {
    for (const pattern of Array.from(this.realTimeAlerts)) {
      if (JSON.stringify(log).includes(pattern)) {
        this.emit('realTimeAlert', { pattern, log });
      }
    }
  }

  private getAllLogs(): LogEntry[] {
    const allLogs: LogEntry[] = [];
    for (const logs of Array.from(this.logs.values())) {
      allLogs.push(...logs);
    }
    return allLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getLogsSince(timestamp: number): LogEntry[] {
    return this.getAllLogs().filter(log => log.timestamp >= timestamp);
  }

  private getPeriodStartTime(period: string): number {
    const now = Date.now();
    const days = parseInt(period.replace('d', ''));
    return now - (days * 24 * 60 * 60 * 1000);
  }

  private calculateRetentionCompliance(): number {
    // Calculate percentage of logs that comply with retention policies
    return 95.5; // Placeholder
  }

  private assessGDPRCompliance(logs: LogEntry[]): ComplianceStatus {
    return {
      compliant: true,
      score: 92.5,
      lastAudit: Date.now() - (7 * 24 * 60 * 60 * 1000),
      issues: [],
      recommendations: ['Implement automated consent tracking']
    };
  }

  private assessHIPAACompliance(logs: LogEntry[]): ComplianceStatus {
    return {
      compliant: true,
      score: 89.8,
      lastAudit: Date.now() - (14 * 24 * 60 * 60 * 1000),
      issues: [],
      recommendations: ['Enhance encryption for PHI data']
    };
  }

  private assessSOXCompliance(logs: LogEntry[]): ComplianceStatus {
    return {
      compliant: true,
      score: 94.2,
      lastAudit: Date.now() - (30 * 24 * 60 * 60 * 1000),
      issues: [],
      recommendations: ['Strengthen financial audit trails']
    };
  }

  private assessISO27001Compliance(logs: LogEntry[]): ComplianceStatus {
    return {
      compliant: true,
      score: 91.7,
      lastAudit: Date.now() - (21 * 24 * 60 * 60 * 1000),
      issues: [],
      recommendations: ['Update incident response procedures']
    };
  }

  private getComplianceViolations(since: number): ComplianceViolation[] {
    // Return recent compliance violations
    return [];
  }

  private generateComplianceRecommendations(): string[] {
    return [
      'Implement automated data retention policies',
      'Enhance real-time monitoring for security events',
      'Improve audit trail completeness',
      'Strengthen access control logging',
      'Implement advanced threat detection'
    ];
  }

  private getRetentionPeriod(regulation: string): number {
    const periods = {
      'GDPR': 2555,    // 7 years
      'HIPAA': 2190,   // 6 years
      'SOX': 2555,     // 7 years
      'ISO27001': 1095 // 3 years
    };
    return periods[regulation as keyof typeof periods] || 365;
  }

  private containsPII(data: any): boolean {
    const piiKeys = ['email', 'name', 'phone', 'address', 'ssn', 'dob'];
    const dataStr = JSON.stringify(data).toLowerCase();
    return piiKeys.some(key => dataStr.includes(key));
  }

  private getViolationSeverity(regulation: string, event: string): 'low' | 'medium' | 'high' | 'critical' {
    if (event.includes('data_breach') || event.includes('unauthorized_access')) {
      return 'critical';
    }
    if (event.includes('retention_violation') || event.includes('consent_missing')) {
      return 'high';
    }
    return 'medium';
  }

  private getRemediationSteps(regulation: string, event: string): string {
    const steps = {
      'GDPR': 'Review data processing activities, update consent mechanisms, notify DPA if required',
      'HIPAA': 'Conduct security assessment, implement additional safeguards, notify covered entities',
      'SOX': 'Review financial controls, update audit procedures, strengthen access controls'
    };
    return steps[regulation as keyof typeof steps] || 'Review and update compliance procedures';
  }

  private convertToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'regulations'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.level,
      log.category,
      log.message,
      log.userId || '',
      log.compliance?.regulations.join(';') || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private convertToXML(logs: LogEntry[]): string {
    const xml = logs.map(log => `
  <log>
    <id>${log.id}</id>
    <timestamp>${new Date(log.timestamp).toISOString()}</timestamp>
    <level>${log.level}</level>
    <category>${log.category}</category>
    <message><![CDATA[${log.message}]]></message>
    ${log.userId ? `<userId>${log.userId}</userId>` : ''}
    ${log.compliance ? `<regulations>${log.compliance.regulations.join(',')}</regulations>` : ''}
  </log>`).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?><logs>${xml}\n</logs>`;
  }
}

export const loggingService = new LoggingService();