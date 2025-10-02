import logger from '../utils/logger';
import OpenAI from 'openai';
import type { IStorage } from '../storage';
import type { 
  IssueAlert, 
  InsertIssueAlert, 
  IssueRecommendation, 
  InsertIssueRecommendation,
  Job,
  Shift,
  Payment,
  SocialReport
} from '../../shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface DetectionContext {
  jobs?: Job[];
  shifts?: Shift[];
  payments?: Payment[];
  complianceReports?: SocialReport[];
  userRole?: string;
}

interface IssueDetectionResult {
  alert: InsertIssueAlert;
  recommendations: InsertIssueRecommendation[];
}

export class IssueDetectionService {
  constructor(private storage: IStorage) {}

  async detectAllIssues(context: DetectionContext): Promise<IssueDetectionResult[]> {
    const results: IssueDetectionResult[] = [];

    const ruleBasedIssues = await this.detectRuleBasedIssues(context);
    results.push(...ruleBasedIssues);

    const aiIssues = await this.detectAIIssues(context);
    results.push(...aiIssues);

    return results;
  }

  private async detectRuleBasedIssues(context: DetectionContext): Promise<IssueDetectionResult[]> {
    const issues: IssueDetectionResult[] = [];

    if (context.shifts) {
      issues.push(...this.detectUnderStaffing(context.shifts));
      issues.push(...this.detectSchedulingConflicts(context.shifts));
    }

    if (context.payments) {
      issues.push(...this.detectPaymentDelays(context.payments));
    }

    if (context.complianceReports) {
      issues.push(...this.detectComplianceBreaches(context.complianceReports));
    }

    if (context.jobs) {
      issues.push(...this.detectResourceShortages(context.jobs));
    }

    return issues;
  }

  private detectUnderStaffing(shifts: Shift[]): IssueDetectionResult[] {
    const issues: IssueDetectionResult[] = [];
    
    const publishedShifts = shifts.filter(s => s.status === 'published');
    
    for (const shift of publishedShifts) {
      const assignedWorkers = shift.workerId ? 1 : 0;
      
      if (assignedWorkers === 0) {
        issues.push({
          alert: {
            title: `Unassigned Shift: Worker needed`,
            description: `Shift "${shift.title}" on ${shift.startTime} has no assigned worker.`,
            issueType: 'understaffing',
            severity: 'high',
            status: 'active',
            confidence: '100.00',
            affectedModule: 'shifts',
            affectedEntityType: 'shift',
            affectedEntityId: shift.id,
            detectionMethod: 'rule_based',
            metadata: {
              assignedWorkers,
              shiftDate: shift.startTime
            }
          },
          recommendations: [
            {
              alertId: '',
              title: 'Auto-notify available workers',
              description: `Send immediate notifications to available workers matching the required skills.`,
              recommendationType: 'automated_action',
              priority: 1,
              confidence: '90.00',
              estimatedImpact: 'high',
              requiredPermissions: ['manage_shifts', 'notify_workers'],
              automatable: true,
              actionMetadata: {
                action: 'notify_workers',
                shiftId: shift.id
              },
              estimatedDuration: 5
            },
            {
              alertId: '',
              title: 'Broadcast to worker pool',
              description: 'Send push notification to all available workers in the area.',
              recommendationType: 'notification',
              priority: 2,
              confidence: '85.00',
              estimatedImpact: 'high',
              requiredPermissions: ['manage_shifts'],
              automatable: true,
              actionMetadata: {
                action: 'broadcast_shift',
                shiftId: shift.id
              },
              estimatedDuration: 2
            }
          ]
        });
      }
    }
    
    return issues;
  }

  private detectSchedulingConflicts(shifts: Shift[]): IssueDetectionResult[] {
    const issues: IssueDetectionResult[] = [];
    
    const activeShifts = shifts.filter(s => s.status !== 'cancelled');
    
    for (let i = 0; i < activeShifts.length; i++) {
      for (let j = i + 1; j < activeShifts.length; j++) {
        const shift1 = activeShifts[i];
        const shift2 = activeShifts[j];
        
        const start1 = new Date(shift1.startTime);
        const end1 = new Date(shift1.endTime);
        const start2 = new Date(shift2.startTime);
        const end2 = new Date(shift2.endTime);
        
        if (start1 < end2 && start2 < end1) {
          issues.push({
            alert: {
              title: 'Scheduling Conflict Detected',
              description: `Shifts "${shift1.title}" and "${shift2.title}" have overlapping times.`,
              issueType: 'scheduling_conflict',
              severity: 'medium',
              status: 'active',
              confidence: '98.00',
              affectedModule: 'scheduling',
              affectedEntityType: 'shift',
              affectedEntityId: shift1.id,
              detectionMethod: 'rule_based',
              metadata: {
                shift1Id: shift1.id,
                shift2Id: shift2.id,
                overlap: { start: start2, end: end1 }
              }
            },
            recommendations: [
              {
                alertId: '',
                title: 'Reschedule conflicting shift',
                description: `Automatically reschedule "${shift2.title}" to the next available time slot.`,
                recommendationType: 'automated_action',
                priority: 1,
                confidence: '85.00',
                estimatedImpact: 'medium',
                requiredPermissions: ['manage_shifts'],
                automatable: true,
                actionMetadata: {
                  action: 'reschedule_shift',
                  shiftId: shift2.id
                },
                estimatedDuration: 3
              }
            ]
          });
        }
      }
    }
    
    return issues;
  }

  private detectPaymentDelays(payments: Payment[]): IssueDetectionResult[] {
    const issues: IssueDetectionResult[] = [];
    const now = new Date();
    
    for (const payment of payments) {
      if (payment.status === 'pending' && payment.createdAt) {
        const daysSinceCreated = Math.floor((now.getTime() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceCreated > 7) {
          const severity = daysSinceCreated > 30 ? 'critical' : daysSinceCreated > 14 ? 'high' : 'medium';
          
          issues.push({
            alert: {
              title: `Payment Delay: ${daysSinceCreated} days overdue`,
              description: `Payment of $${payment.amount} to worker ${payment.workerId} has been pending for ${daysSinceCreated} days.`,
              issueType: 'payment_delay',
              severity,
              status: 'active',
              confidence: '100.00',
              affectedModule: 'payments',
              affectedEntityType: 'payment',
              affectedEntityId: payment.id,
              detectionMethod: 'rule_based',
              metadata: {
                amount: payment.amount,
                daysPending: daysSinceCreated,
                workerId: payment.workerId
              }
            },
            recommendations: [
              {
                alertId: '',
                title: 'Process payment immediately',
                description: 'Automatically process the pending payment through Stripe.',
                recommendationType: 'automated_action',
                priority: 1,
                confidence: '95.00',
                estimatedImpact: 'high',
                requiredPermissions: ['manage_payments'],
                automatable: true,
                actionMetadata: {
                  action: 'process_payment',
                  paymentId: payment.id
                },
                estimatedDuration: 5
              },
              {
                alertId: '',
                title: 'Notify worker about delay',
                description: 'Send automated notification to the worker explaining the delay and expected resolution.',
                recommendationType: 'notification',
                priority: 2,
                confidence: '90.00',
                estimatedImpact: 'medium',
                requiredPermissions: ['send_notifications'],
                automatable: true,
                actionMetadata: {
                  action: 'send_notification',
                  workerId: payment.workerId,
                  type: 'payment_delay'
                },
                estimatedDuration: 1
              }
            ]
          });
        }
      }
    }
    
    return issues;
  }

  private detectComplianceBreaches(complianceRecords: SocialReport[]): IssueDetectionResult[] {
    const issues: IssueDetectionResult[] = [];
    
    for (const record of complianceRecords) {
      if (record.complianceStatus === 'non_compliant' || record.complianceStatus === 'at_risk') {
        const severity = record.complianceStatus === 'non_compliant' ? 'critical' : 'high';
        
        issues.push({
          alert: {
            title: `Compliance Breach: ${record.title}`,
            description: record.description || `Compliance requirement "${record.title}" is not met.`,
            issueType: 'compliance_breach',
            severity,
            status: 'active',
            confidence: '100.00',
            affectedModule: 'compliance',
            affectedEntityType: 'compliance',
            affectedEntityId: record.id,
            detectionMethod: 'rule_based',
            metadata: {
              reportType: record.reportType,
              complianceStatus: record.complianceStatus
            }
          },
          recommendations: [
            {
              alertId: '',
              title: 'Generate compliance report',
              description: 'Automatically generate required compliance documentation and submit for review.',
              recommendationType: 'automated_action',
              priority: 1,
              confidence: '85.00',
              estimatedImpact: 'high',
              requiredPermissions: ['manage_compliance'],
              automatable: true,
              actionMetadata: {
                action: 'generate_compliance_report',
                reportId: record.id
              },
              estimatedDuration: 15
            },
            {
              alertId: '',
              title: 'Assign compliance officer',
              description: 'Escalate to a compliance officer for immediate review and action.',
              recommendationType: 'escalation',
              priority: 2,
              confidence: '90.00',
              estimatedImpact: 'high',
              requiredPermissions: ['manage_users'],
              automatable: false,
              actionMetadata: {
                action: 'assign_officer',
                reportId: record.id
              },
              estimatedDuration: 30
            }
          ]
        });
      }
    }
    
    return issues;
  }

  private detectResourceShortages(jobs: Job[]): IssueDetectionResult[] {
    const issues: IssueDetectionResult[] = [];
    
    const activeJobs = jobs.filter(j => j.status === 'active');
    
    for (const job of activeJobs) {
      const daysOpen = job.createdAt 
        ? Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (daysOpen > 14) {
        issues.push({
          alert: {
            title: `Long-Open Job: ${daysOpen} days unfilled`,
            description: `Job "${job.title}" has been open for ${daysOpen} days without being filled. This may indicate difficulty finding qualified workers.`,
            issueType: 'resource_shortage',
            severity: daysOpen > 30 ? 'high' : 'medium',
            status: 'active',
            confidence: '85.00',
            affectedModule: 'jobs',
            affectedEntityType: 'job',
            affectedEntityId: job.id,
            detectionMethod: 'rule_based',
            metadata: {
              daysOpen,
              jobType: job.jobType
            }
          },
          recommendations: [
            {
              alertId: '',
              title: 'Increase job visibility',
              description: `Promote this job posting to reach more potential workers.`,
              recommendationType: 'automated_action',
              priority: 1,
              confidence: '80.00',
              estimatedImpact: 'medium',
              requiredPermissions: ['manage_jobs'],
              automatable: true,
              actionMetadata: {
                action: 'promote_job',
                jobId: job.id
              },
              estimatedDuration: 5
            },
            {
              alertId: '',
              title: 'Adjust job requirements',
              description: 'Consider broadening the job requirements or increasing compensation to attract more candidates.',
              recommendationType: 'policy_change',
              priority: 2,
              confidence: '70.00',
              estimatedImpact: 'high',
              requiredPermissions: ['manage_jobs'],
              automatable: false,
              actionMetadata: {
                action: 'review_requirements',
                jobId: job.id
              },
              estimatedDuration: 30
            }
          ]
        });
      }
    }
    
    return issues;
  }

  private async detectAIIssues(context: DetectionContext): Promise<IssueDetectionResult[]> {
    try {
      const analysisPrompt = this.buildAIAnalysisPrompt(context);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an intelligent workforce management analyst. Analyze the provided data and identify potential issues, inefficiencies, or risks that may not be obvious from simple rules. Focus on patterns, trends, and nuanced problems."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse) {
        return this.parseAIResponse(aiResponse);
      }
      
      return [];
    } catch (error) {
      logger.error('AI issue detection error:', error);
      return [];
    }
  }

  private buildAIAnalysisPrompt(context: DetectionContext): string {
    const parts: string[] = [];
    
    parts.push("Analyze the following workforce data and identify potential issues:");
    
    if (context.jobs && context.jobs.length > 0) {
      parts.push(`\nJobs (${context.jobs.length} total):`);
      parts.push(JSON.stringify(context.jobs.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        status: j.status,
        jobType: j.jobType
      }))));
    }
    
    if (context.shifts && context.shifts.length > 0) {
      parts.push(`\nShifts (${context.shifts.length} total):`);
      parts.push(JSON.stringify(context.shifts.slice(0, 5).map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime
      }))));
    }
    
    if (context.payments && context.payments.length > 0) {
      parts.push(`\nPayments (${context.payments.length} total):`);
      parts.push(JSON.stringify(context.payments.slice(0, 5).map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt
      }))));
    }
    
    parts.push("\nProvide your analysis in JSON format with the following structure:");
    parts.push('{"issues": [{"title": "Issue title", "description": "Detailed description", "issueType": "skill_gap|performance_issue|other", "severity": "critical|high|medium|low", "confidence": "0-100", "recommendations": [{"title": "Recommendation title", "description": "Action to take", "automatable": true|false}]}]}');
    
    return parts.join('\n');
  }

  private parseAIResponse(response: string): IssueDetectionResult[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];
      
      const parsed = JSON.parse(jsonMatch[0]);
      const results: IssueDetectionResult[] = [];
      
      if (parsed.issues && Array.isArray(parsed.issues)) {
        for (const issue of parsed.issues) {
          const alert: InsertIssueAlert = {
            title: issue.title || 'AI-Detected Issue',
            description: issue.description || '',
            issueType: this.mapIssueType(issue.issueType),
            severity: issue.severity || 'medium',
            status: 'active',
            confidence: issue.confidence?.toString() || '70.00',
            affectedModule: 'general',
            detectionMethod: 'ai_powered',
            metadata: { aiAnalysis: issue }
          };
          
          const recommendations: InsertIssueRecommendation[] = [];
          
          if (issue.recommendations && Array.isArray(issue.recommendations)) {
            for (let i = 0; i < issue.recommendations.length; i++) {
              const rec = issue.recommendations[i];
              recommendations.push({
                alertId: '',
                title: rec.title || 'AI Recommendation',
                description: rec.description || '',
                recommendationType: 'workflow_adjustment',
                priority: i + 1,
                confidence: '75.00',
                estimatedImpact: 'medium',
                automatable: rec.automatable || false,
                actionMetadata: rec
              });
            }
          }
          
          results.push({ alert, recommendations });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      return [];
    }
  }

  private mapIssueType(type: string): 'understaffing' | 'compliance_breach' | 'payment_delay' | 'scheduling_conflict' | 'skill_gap' | 'performance_issue' | 'resource_shortage' | 'budget_overrun' | 'safety_concern' | 'other' {
    const typeMap: Record<string, 'understaffing' | 'compliance_breach' | 'payment_delay' | 'scheduling_conflict' | 'skill_gap' | 'performance_issue' | 'resource_shortage' | 'budget_overrun' | 'safety_concern' | 'other'> = {
      'skill_gap': 'skill_gap',
      'performance_issue': 'performance_issue',
      'understaffing': 'understaffing',
      'compliance_breach': 'compliance_breach',
      'payment_delay': 'payment_delay',
      'scheduling_conflict': 'scheduling_conflict',
      'resource_shortage': 'resource_shortage',
      'budget_overrun': 'budget_overrun',
      'safety_concern': 'safety_concern'
    };
    
    return typeMap[type] || 'other';
  }

  async storeDetectedIssues(results: IssueDetectionResult[]): Promise<IssueAlert[]> {
    const storedAlerts: IssueAlert[] = [];
    
    for (const result of results) {
      const alert = await this.storage.createIssueAlert(result.alert);
      
      for (const rec of result.recommendations) {
        rec.alertId = alert.id;
        await this.storage.createIssueRecommendation(rec);
      }
      
      storedAlerts.push(alert);
    }
    
    return storedAlerts;
  }

  async runScheduledDetection(): Promise<void> {
    try {
      const jobs: Job[] = [];
      const shifts: Shift[] = [];
      const payments: Payment[] = [];
      const complianceReports: SocialReport[] = [];
      
      const context: DetectionContext = {
        jobs,
        shifts,
        payments,
        complianceReports
      };
      
      const issues = await this.detectAllIssues(context);
      
      if (issues.length > 0) {
        await this.storeDetectedIssues(issues);
        console.log(`Detected and stored ${issues.length} issues`);
      }
    } catch (error) {
      logger.error('Scheduled issue detection failed:', error);
    }
  }
}
