import { db } from './db';
import { jobs, users, shifts } from '@shared/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { AIService } from './ai';
import { storage } from './storage';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
}

export interface AutomationTrigger {
  type: 'schedule' | 'event' | 'threshold';
  config: any;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface AutomationAction {
  type: 'assign_worker' | 'send_notification' | 'create_shift' | 'update_status' | 'send_email';
  config: any;
}

export class AutomationEngine {
  private aiService = new AIService();
  private rules: Map<string, AutomationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.startScheduler();
  }

  private initializeDefaultRules() {
    // Auto-assign high-priority jobs
    this.addRule({
      id: 'auto-assign-urgent',
      name: 'Auto-assign urgent jobs',
      trigger: {
        type: 'event',
        config: { event: 'job_created', priority: 'high' }
      },
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'status', operator: 'equals', value: 'active' }
      ],
      actions: [
        { type: 'assign_worker', config: { strategy: 'best_match' } },
        { type: 'send_notification', config: { type: 'worker_assignment' } }
      ],
      isActive: true,
      createdAt: new Date()
    });

    // Shift reminder notifications
    this.addRule({
      id: 'shift-reminders',
      name: 'Send shift reminders',
      trigger: {
        type: 'schedule',
        config: { cron: '0 8 * * *' } // Daily at 8 AM
      },
      conditions: [],
      actions: [
        { type: 'send_notification', config: { type: 'shift_reminder', hours_before: 24 } }
      ],
      isActive: true,
      createdAt: new Date()
    });

    // Automatic shift creation for recurring jobs
    this.addRule({
      id: 'create-recurring-shifts',
      name: 'Create shifts for recurring jobs',
      trigger: {
        type: 'schedule',
        config: { cron: '0 0 * * 0' } // Weekly on Sunday
      },
      conditions: [
        { field: 'jobType', operator: 'equals', value: 'recurring' },
        { field: 'status', operator: 'equals', value: 'active' }
      ],
      actions: [
        { type: 'create_shift', config: { weeks_ahead: 2 } }
      ],
      isActive: true,
      createdAt: new Date()
    });

    // Worker utilization monitoring
    this.addRule({
      id: 'low-utilization-alert',
      name: 'Alert for low worker utilization',
      trigger: {
        type: 'threshold',
        config: { metric: 'worker_utilization', threshold: 50, period: '7d' }
      },
      conditions: [
        { field: 'utilization_rate', operator: 'less_than', value: 50 }
      ],
      actions: [
        { type: 'send_notification', config: { type: 'utilization_alert', recipients: ['admin'] } }
      ],
      isActive: true,
      createdAt: new Date()
    });
  }

  addRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  async executeRule(ruleId: string, context?: any): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.isActive) return false;

    try {
      // Check conditions
      const conditionsMet = await this.checkConditions(rule.conditions, context);
      if (!conditionsMet) return false;

      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(action, context);
      }

      // Update last run timestamp
      rule.lastRun = new Date();
      this.rules.set(ruleId, rule);

      console.log(`✅ Automation rule '${rule.name}' executed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to execute automation rule '${rule.name}':`, error);
      return false;
    }
  }

  private async checkConditions(conditions: AutomationCondition[], context: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const value = this.getContextValue(context, condition.field);
      const passed = this.evaluateCondition(value, condition.operator, condition.value);
      if (!passed) return false;
    }

    return true;
  }

  private getContextValue(context: any, field: string): any {
    if (!context) return null;
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'contains':
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());
      default:
        return false;
    }
  }

  private async executeAction(action: AutomationAction, context?: any): Promise<void> {
    switch (action.type) {
      case 'assign_worker':
        await this.assignWorkerAction(action.config, context);
        break;
      case 'send_notification':
        await this.sendNotificationAction(action.config, context);
        break;
      case 'create_shift':
        await this.createShiftAction(action.config, context);
        break;
      case 'update_status':
        await this.updateStatusAction(action.config, context);
        break;
      case 'send_email':
        await this.sendEmailAction(action.config, context);
        break;
      default:
        console.warn(`Unknown automation action type: ${action.type}`);
    }
  }

  private async assignWorkerAction(config: any, context: any): Promise<void> {
    if (!context?.job) return;

    const job = context.job;
    const workers = await db.select().from(users).where(eq(users.role, 'worker'));
    
    if (config.strategy === 'best_match') {
      const matches = await this.aiService.generateJobMatch(job, workers);
      if (matches.length > 0) {
        const bestMatch = matches[0];
        // Update job with assigned worker
        await storage.updateJob(job.id, { assignedWorkerId: bestMatch.workerId });
      }
    }
  }

  private async sendNotificationAction(config: any, context: any): Promise<void> {
    if (config.type === 'shift_reminder') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingShifts = await db.select()
        .from(shifts)
        .where(
          and(
            gte(shifts.startTime, tomorrow),
            lte(shifts.startTime, new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000))
          )
        );

      for (const shift of upcomingShifts) {
        if (shift.workerId) {
          await storage.createNotification({
            userId: shift.workerId,
            type: 'reminder',
            title: 'Upcoming Shift Reminder',
            message: `You have a shift tomorrow from ${shift.startTime} to ${shift.endTime}`,
            data: { shiftId: shift.id }
          });
        }
      }
    }
  }

  private async createShiftAction(config: any, context: any): Promise<void> {
    if (!context?.job) return;

    const job = context.job;
    if (job.jobType === 'recurring') {
      const weeksAhead = config.weeks_ahead || 2;
      
      for (let week = 1; week <= weeksAhead; week++) {
        const shiftDate = new Date();
        shiftDate.setDate(shiftDate.getDate() + (week * 7));
        
        await storage.createShift({
          title: `${job.title} - Week ${week}`,
          jobId: job.id,
          startTime: shiftDate,
          endTime: new Date(shiftDate.getTime() + 8 * 60 * 60 * 1000), // 8 hour shift
          status: 'published'
        });
      }
    }
  }

  private async updateStatusAction(config: any, context: any): Promise<void> {
    if (context?.jobId && config.status) {
      await storage.updateJob(context.jobId, { status: config.status });
    }
  }

  private async sendEmailAction(config: any, context: any): Promise<void> {
    // Email integration would be implemented here
    console.log(`📧 Email would be sent: ${config.template} to ${config.recipients}`);
  }

  private startScheduler(): void {
    // Run scheduled rules every minute
    setInterval(async () => {
      const now = new Date();
      
      for (const rule of Array.from(this.rules.values())) {
        if (rule.trigger.type === 'schedule') {
          const shouldRun = this.shouldRunScheduledRule(rule, now);
          if (shouldRun) {
            await this.executeRule(rule.id);
          }
        }
      }
    }, 60000); // Check every minute
  }

  private shouldRunScheduledRule(rule: AutomationRule, now: Date): boolean {
    if (!rule.lastRun) return true;
    
    const { cron } = rule.trigger.config;
    
    // Simple cron implementation for common patterns
    if (cron === '0 8 * * *') { // Daily at 8 AM
      return now.getHours() === 8 && now.getMinutes() === 0 && 
             (!rule.lastRun || rule.lastRun.getDate() !== now.getDate());
    }
    
    if (cron === '0 0 * * 0') { // Weekly on Sunday
      return now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0 &&
             (!rule.lastRun || now.getTime() - rule.lastRun.getTime() > 6 * 24 * 60 * 60 * 1000);
    }

    return false;
  }

  async triggerEvent(eventType: string, data: any): Promise<void> {
    for (const rule of Array.from(this.rules.values())) {
      if (rule.trigger.type === 'event' && rule.trigger.config.event === eventType) {
        await this.executeRule(rule.id, data);
      }
    }
  }

  async checkThresholds(): Promise<void> {
    for (const rule of Array.from(this.rules.values())) {
      if (rule.trigger.type === 'threshold') {
        const { metric, threshold, period } = rule.trigger.config;
        const value = await this.getMetricValue(metric, period);
        
        if (this.evaluateCondition(value, 'less_than', threshold)) {
          await this.executeRule(rule.id, { [metric]: value });
        }
      }
    }
  }

  private async getMetricValue(metric: string, period: string): Promise<number> {
    // Implement metric calculation based on type
    switch (metric) {
      case 'worker_utilization':
        // Calculate worker utilization rate
        return 65; // Placeholder
      default:
        return 0;
    }
  }
}

export const automationEngine = new AutomationEngine();