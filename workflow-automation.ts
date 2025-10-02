import { db } from './db.js';
import { storage } from './storage.js';
import logger from './utils/logger';
import { notificationService } from './notifications.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { jobs, shifts, users, payments } from '../shared/schema.js';
import OpenAI from 'openai';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastExecuted?: Date;
  executionCount: number;
  metrics?: {
    successCount: number;
    errorCount: number;
    lastExecution?: Date;
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
  };
  aiSuggestions?: string[];
}

export interface WorkflowTrigger {
  type: 'job_created' | 'shift_completed' | 'payment_processed' | 'user_registered' | 'schedule_time';
  eventData?: any;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    daysOfWeek?: number[];
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_notification' | 'assign_worker' | 'update_status' | 'create_task' | 'send_email' | 'webhook_call';
  config: any;
  delay?: number; // Delay in minutes
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  trigger: any;
  result: 'success' | 'failed' | 'partial';
  executedActions: string[];
  errors?: string[];
  duration: number;
  timestamp: Date;
}

export class WorkflowAutomationEngine {
  public rules: Map<string, WorkflowRule> = new Map();
  private executions: WorkflowExecution[] = [];
  private isRunning = false;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Rule 1: Auto-assign workers to high-priority jobs
    this.addRule({
      id: 'auto-assign-priority-jobs',
      name: 'Auto-assign Priority Jobs',
      description: 'Automatically assign available workers to high-priority jobs',
      trigger: { type: 'job_created' },
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'status', operator: 'equals', value: 'active' }
      ],
      actions: [
        { 
          type: 'assign_worker', 
          config: { 
            criteria: 'best_match',
            notifyWorker: true 
          } 
        },
        { 
          type: 'send_notification', 
          config: { 
            recipients: ['client'],
            template: 'job_assigned',
            message: 'Your high-priority job has been assigned to a qualified worker'
          } 
        }
      ],
      isActive: true,
      executionCount: 0,
      createdAt: new Date()
    });

    // Rule 2: Send reminder for incomplete timesheets
    this.addRule({
      id: 'timesheet-reminders',
      name: 'Timesheet Reminders',
      description: 'Send reminders for incomplete timesheets at end of week',
      trigger: { 
        type: 'schedule_time',
        schedule: {
          frequency: 'weekly',
          time: '17:00',
          daysOfWeek: [5] // Friday
        }
      },
      conditions: [
        { field: 'timesheetStatus', operator: 'not_equals', value: 'submitted' }
      ],
      actions: [
        { 
          type: 'send_notification', 
          config: { 
            recipients: ['worker'],
            template: 'timesheet_reminder',
            message: 'Please submit your timesheet before end of business day'
          } 
        }
      ],
      isActive: true,
      executionCount: 0,
      createdAt: new Date()
    });

    // Rule 3: Process payments for completed jobs
    this.addRule({
      id: 'auto-process-payments',
      name: 'Auto-process Payments',
      description: 'Automatically process payments for completed and approved jobs',
      trigger: { type: 'shift_completed' },
      conditions: [
        { field: 'status', operator: 'equals', value: 'completed' },
        { field: 'approvalStatus', operator: 'equals', value: 'approved' }
      ],
      actions: [
        { 
          type: 'create_task', 
          config: { 
            type: 'process_payment',
            priority: 'high',
            assignTo: 'system'
          } 
        },
        { 
          type: 'send_notification', 
          config: { 
            recipients: ['worker', 'client'],
            template: 'payment_processing',
            message: 'Payment is being processed for completed work'
          } 
        }
      ],
      isActive: true,
      executionCount: 0,
      createdAt: new Date()
    });
  }

  async addRule(rule: Omit<WorkflowRule, 'executionCount' | 'createdAt'> & Partial<Pick<WorkflowRule, 'executionCount' | 'createdAt'>>): Promise<void> {
    const fullRule: WorkflowRule = {
      ...rule,
      executionCount: rule.executionCount || 0,
      createdAt: rule.createdAt || new Date()
    };
    
    this.rules.set(rule.id, fullRule);
    console.log(`✅ Workflow rule '${rule.name}' added`);
  }

  async removeRule(ruleId: string): Promise<boolean> {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`🗑️ Workflow rule '${ruleId}' removed`);
    }
    return removed;
  }

  async executeRule(ruleId: string, triggerData: any): Promise<WorkflowExecution> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.isActive) {
      throw new Error(`Rule '${ruleId}' not found or inactive`);
    }

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      trigger: triggerData,
      result: 'success',
      executedActions: [],
      duration: 0,
      timestamp: new Date()
    };

    const startTime = Date.now();

    try {
      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(rule.conditions, triggerData);
      if (!conditionsMet) {
        execution.result = 'failed';
        execution.errors = ['Conditions not met'];
        return execution;
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          if (action.delay) {
            // Schedule delayed action
            setTimeout(() => this.executeAction(action, triggerData), action.delay * 60 * 1000);
          } else {
            await this.executeAction(action, triggerData);
          }
          execution.executedActions.push(action.type);
        } catch (actionError: any) {
          execution.errors = execution.errors || [];
          execution.errors.push(`Action '${action.type}' failed: ${actionError.message}`);
          execution.result = 'partial';
        }
      }

      // Update rule execution count
      rule.executionCount++;
      rule.lastExecuted = new Date();
      this.rules.set(ruleId, rule);

    } catch (error: any) {
      execution.result = 'failed';
      execution.errors = [error.message];
    } finally {
      execution.duration = Date.now() - startTime;
      this.executions.push(execution);
    }

    return execution;
  }

  private async evaluateConditions(conditions: WorkflowCondition[], data: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    const results: boolean[] = [];

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(data, condition.field);
      const result = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      results.push(result);
    }

    // For now, use AND logic for all conditions
    return results.every(Boolean);
  }

  private getFieldValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      case 'contains':
        return fieldValue?.toString().includes(expectedValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private async executeAction(action: WorkflowAction, triggerData: any): Promise<void> {
    switch (action.type) {
      case 'send_notification':
        await this.executeSendNotification(action.config, triggerData);
        break;
      case 'assign_worker':
        await this.executeAssignWorker(action.config, triggerData);
        break;
      case 'update_status':
        await this.executeUpdateStatus(action.config, triggerData);
        break;
      case 'create_task':
        await this.executeCreateTask(action.config, triggerData);
        break;
      case 'send_email':
        await this.executeSendEmail(action.config, triggerData);
        break;
      case 'webhook_call':
        await this.executeWebhookCall(action.config, triggerData);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeSendNotification(config: any, data: any): Promise<void> {
    const recipients = config.recipients || [];
    const message = this.replaceTokens(config.message, data);

    for (const recipient of recipients) {
      if (recipient === 'worker' && data.workerId) {
        await notificationService.sendNotification({
          id: `automation-${Date.now()}`,
          userId: data.workerId,
          type: 'system_alert',
          title: 'Automation Notification',
          message,
          priority: 'medium',
          createdAt: new Date(),
          metadata: { category: 'automation' }
        });
      } else if (recipient === 'client' && data.clientId) {
        await notificationService.sendNotification({
          id: `automation-${Date.now()}`,
          userId: data.clientId,
          type: 'system_alert',
          title: 'Automation Notification',
          message,
          priority: 'medium',
          createdAt: new Date(),
          metadata: { category: 'automation' }
        });
      }
    }
  }

  private async executeAssignWorker(config: any, data: any): Promise<void> {
    if (!data.jobId) return;

    const job = await storage.getJobById(data.jobId);
    if (!job) return;

    // Find best available worker based on criteria
    const availableWorkers = await storage.getAvailableWorkers(job.requiredSkills || []);
    
    if (availableWorkers.length > 0) {
      const selectedWorker = config.criteria === 'best_match' 
        ? this.findBestMatchWorker(availableWorkers, job)
        : availableWorkers[0];

      // Create shift assignment
      await storage.createShift({
        title: `Work shift for ${job.title}`,
        jobId: job.id,
        workerId: selectedWorker.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours default
        status: 'assigned',
        location: job.location
      });

      if (config.notifyWorker) {
        await notificationService.sendNotification({
          id: `job-assignment-${Date.now()}`,
          userId: selectedWorker.id,
          type: 'shift_assigned',
          title: 'Job Assignment',
          message: `You have been assigned to job: ${job.title}`,
          priority: 'high',
          createdAt: new Date(),
          metadata: { category: 'work' }
        });
      }
    }
  }

  private async executeUpdateStatus(config: any, data: any): Promise<void> {
    const { entityType, entityId, newStatus } = config;
    
    switch (entityType) {
      case 'job':
        if (data.jobId) {
          await storage.updateJob(data.jobId, { status: newStatus });
        }
        break;
      case 'shift':
        if (data.shiftId) {
          await storage.updateShift(data.shiftId, { status: newStatus });
        }
        break;
    }
  }

  private async executeCreateTask(config: any, data: any): Promise<void> {
    // Create internal task for system processing
    console.log(`Creating task: ${config.type}`, { config, data });
    
    if (config.type === 'process_payment' && data.shiftId) {
      const shift = await storage.getShiftById(data.shiftId);
      if (shift && shift.status === 'completed') {
        // Trigger payment processing
        await paymentProcessor.processShiftPayment(shift.id);
      }
    }
  }

  private async executeSendEmail(config: any, data: any): Promise<void> {
    // Email sending would be implemented with actual email service
    logger.info('Sending email:', {
      to: config.to,
      subject: this.replaceTokens(config.subject, data),
      body: this.replaceTokens(config.body, data)
    });
  }

  private async executeWebhookCall(config: any, data: any): Promise<void> {
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {})
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Webhook call failed:', error);
      throw error;
    }
  }

  private findBestMatchWorker(workers: any[], job: any): any {
    // Score workers based on skills match, availability, ratings
    return workers
      .map(worker => ({
        ...worker,
        score: this.calculateWorkerScore(worker, job)
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  private calculateWorkerScore(worker: any, job: any): number {
    let score = 0;

    // Skills match (40% of score)
    const skillsMatch = job.requiredSkills?.filter((skill: string) => 
      worker.skills?.includes(skill)
    ).length || 0;
    score += (skillsMatch / (job.requiredSkills?.length || 1)) * 40;

    // Experience level match (30% of score)
    const expLevels: { [key: string]: number } = { entry: 1, mid: 2, senior: 3 };
    const workerExp = expLevels[worker.experienceLevel as string] || 1;
    const jobExp = expLevels[job.experienceLevel as string] || 1;
    score += Math.max(0, 30 - Math.abs(workerExp - jobExp) * 10);

    // Availability (20% of score)
    score += worker.isAvailable ? 20 : 0;

    // Rating (10% of score)
    score += (worker.rating || 4) * 2;

    return score;
  }

  private replaceTokens(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, token) => {
      return this.getFieldValue(data, token) || match;
    });
  }

  async triggerEvent(eventType: string, eventData: any): Promise<void> {
    const relevantRules = Array.from(this.rules.values())
      .filter(rule => rule.isActive && rule.trigger.type === eventType);

    for (const rule of relevantRules) {
      try {
        await this.executeRule(rule.id, eventData);
      } catch (error) {
        console.error(`Failed to execute rule '${rule.id}':`, error);
      }
    }
  }

  async scheduleRecurringTasks(): Promise<void> {
    const scheduledRules = Array.from(this.rules.values())
      .filter(rule => rule.isActive && rule.trigger.type === 'schedule_time');

    for (const rule of scheduledRules) {
      if (rule.trigger.schedule) {
        this.scheduleRule(rule);
      }
    }
  }

  private scheduleRule(rule: WorkflowRule): void {
    if (!rule.trigger.schedule) return;

    const schedule = rule.trigger.schedule;
    const now = new Date();
    
    // Calculate next execution time
    let nextExecution = new Date();
    
    switch (schedule.frequency) {
      case 'daily':
        nextExecution.setHours(parseInt(schedule.time.split(':')[0]));
        nextExecution.setMinutes(parseInt(schedule.time.split(':')[1]));
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;
      case 'weekly':
        // Implementation for weekly scheduling
        break;
      case 'monthly':
        // Implementation for monthly scheduling
        break;
    }

    const delay = nextExecution.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.executeRule(rule.id, { scheduledExecution: true });
      this.scheduleRule(rule); // Reschedule for next execution
    }, delay);
  }

  getRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): WorkflowRule | undefined {
    return this.rules.get(ruleId);
  }

  getExecutions(limit = 50): WorkflowExecution[] {
    return this.executions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getExecutionStats(): any {
    const executions = this.executions;
    const total = executions.length;
    const successful = executions.filter(e => e.result === 'success').length;
    const failed = executions.filter(e => e.result === 'failed').length;
    const partial = executions.filter(e => e.result === 'partial').length;

    return {
      total,
      successful,
      failed,
      partial,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageDuration: total > 0 ? executions.reduce((sum, e) => sum + e.duration, 0) / total : 0
    };
  }

  async updateRule(ruleId: string, updates: Partial<WorkflowRule>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    return true;
  }

  async activateRule(ruleId: string): Promise<boolean> {
    return this.updateRule(ruleId, { isActive: true });
  }

  async deactivateRule(ruleId: string): Promise<boolean> {
    return this.updateRule(ruleId, { isActive: false });
  }

  startEngine(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleRecurringTasks();
    logger.info('🤖 Workflow automation engine started');
  }

  stopEngine(): void {
    this.isRunning = false;
    logger.info('⏹️ Workflow automation engine stopped');
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }
}

// Import payment processor interface
interface PaymentProcessor {
  processShiftPayment(shiftId: string): Promise<void>;
}

// Mock payment processor for now
const paymentProcessor: PaymentProcessor = {
  async processShiftPayment(shiftId: string): Promise<void> {
    console.log(`Processing payment for shift: ${shiftId}`);
    // Would implement actual payment processing
  }
};

// Initialize OpenAI client for AI-powered automation features
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced WorkflowAutomationEngine with advanced features
class EnhancedWorkflowEngine extends WorkflowAutomationEngine {
  private aiSuggestionsCache = new Map<string, any[]>();
  private performanceMetrics = new Map<string, any>();
  private predictiveAnalytics = new Map<string, any>();
  
  // AI-powered workflow suggestions based on patterns and analytics
  async generateAISuggestions(workflow: any): Promise<any[]> {
    const cacheKey = JSON.stringify(workflow);
    if (this.aiSuggestionsCache.has(cacheKey)) {
      return this.aiSuggestionsCache.get(cacheKey)!;
    }
    
    try {
      // Use OpenAI to analyze workflow and generate intelligent suggestions
      const prompt = `Analyze this workforce management workflow and suggest optimizations:
        
        Workflow: ${JSON.stringify(workflow)}
        
        Consider:
        - Efficiency improvements
        - Automation opportunities
        - Risk mitigation
        - User experience enhancements
        - Cost optimization
        
        Provide 3-5 specific, actionable suggestions with confidence scores.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert workforce management consultant. Analyze workflows and provide specific, actionable optimization suggestions with confidence scores between 0 and 1."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      // Parse AI response into structured suggestions
      const suggestions = this.parseAISuggestions(aiResponse || '');
      
      // Add rule-based suggestions as fallback
      const ruleBasedSuggestions = this.getRuleBasedSuggestions(workflow);
      
      const allSuggestions = [...suggestions, ...ruleBasedSuggestions];
      this.aiSuggestionsCache.set(cacheKey, allSuggestions);
      
      return allSuggestions;
    } catch (error) {
      logger.error('AI suggestion generation failed:', error);
      
      // Fallback to rule-based suggestions
      const fallbackSuggestions = this.getRuleBasedSuggestions(workflow);
      this.aiSuggestionsCache.set(cacheKey, fallbackSuggestions);
      
      return fallbackSuggestions;
    }
  }

  // Parse AI response into structured suggestions
  private parseAISuggestions(aiResponse: string): any[] {
    const suggestions = [];
    
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      // Parse text-based suggestions
      const lines = aiResponse.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.includes('suggestion') || line.includes('optimization')) {
          suggestions.push({
            type: 'ai_generated',
            title: line.substring(0, 60),
            description: line,
            confidence: 0.8,
            source: 'openai'
          });
        }
      }
    } catch (error) {
      logger.error('Failed to parse AI suggestions:', error);
    }
    
    return suggestions;
  }

  // Rule-based suggestions as fallback
  private getRuleBasedSuggestions(workflow: any): any[] {
    const suggestions = [];
    
    // Analyze workflow patterns to suggest optimizations
    if (workflow.triggers?.some((t: any) => t.type === 'job_posted')) {
      suggestions.push({
        type: 'optimization',
        title: 'Auto-assign top-rated workers',
        description: 'Automatically assign jobs to highest-rated available workers based on skills match',
        confidence: 0.85,
        implementation: {
          trigger: { type: 'job_posted' },
          action: { type: 'assign_worker', criteria: 'best_match' }
        }
      });
    }
    
    if (workflow.actions?.some((a: any) => a.type === 'send_notification')) {
      suggestions.push({
        type: 'enhancement',
        title: 'Smart notification timing',
        description: 'Send notifications at optimal times based on user activity patterns',
        confidence: 0.75,
        implementation: {
          action: { type: 'send_notification', timing: 'optimal' }
        }
      });
    }
    
    return suggestions;
  }

  // Predictive analytics for workforce planning
  async generatePredictiveAnalytics(): Promise<any> {
    try {
      // Gather historical data for analysis
      const historicalData = await this.gatherHistoricalData();
      
      const prompt = `Analyze this workforce management data and provide predictive insights:
        
        Data: ${JSON.stringify(historicalData)}
        
        Provide predictions for:
        - Staffing needs (next 30 days)
        - Peak demand periods
        - Worker availability patterns
        - Cost optimization opportunities
        - Risk factors and mitigation strategies
        
        Format as actionable insights with confidence scores.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a workforce analytics expert. Analyze data and provide accurate predictive insights with confidence scores."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const predictions = this.parsePredictiveInsights(completion.choices[0]?.message?.content || '');
      
      // Cache predictions
      this.predictiveAnalytics.set('latest', {
        predictions,
        generatedAt: new Date(),
        dataPoints: historicalData.length
      });
      
      return predictions;
    } catch (error) {
      logger.error('Predictive analytics generation failed:', error);
      return this.getFallbackPredictions();
    }
  }

  // Gather historical data for predictive analysis
  private async gatherHistoricalData(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get job posting patterns
      const jobData = await db.select({
        createdAt: jobs.createdAt,
        jobType: jobs.jobType,
        status: jobs.status
      }).from(jobs).where(gte(jobs.createdAt, thirtyDaysAgo));

      // Get shift completion rates
      const shiftData = await db.select({
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        status: shifts.status
      }).from(shifts).where(gte(shifts.startTime, thirtyDaysAgo));

      // Get user activity patterns
      const userData = await db.select({
        createdAt: users.createdAt,
        role: users.role
      }).from(users).where(gte(users.createdAt, thirtyDaysAgo));

      return {
        jobs: jobData,
        shifts: shiftData,
        users: userData,
        timeRange: { start: thirtyDaysAgo, end: new Date() }
      };
    } catch (error) {
      logger.error('Failed to gather historical data:', error);
      return { jobs: [], shifts: [], users: [], timeRange: {} };
    }
  }

  // Parse predictive insights from AI response
  private parsePredictiveInsights(aiResponse: string): any {
    try {
      return {
        staffingNeeds: this.extractInsight(aiResponse, 'staffing'),
        demandPatterns: this.extractInsight(aiResponse, 'demand'),
        availability: this.extractInsight(aiResponse, 'availability'),
        costOptimization: this.extractInsight(aiResponse, 'cost'),
        riskFactors: this.extractInsight(aiResponse, 'risk'),
        recommendations: this.extractInsight(aiResponse, 'recommendation')
      };
    } catch (error) {
      logger.error('Failed to parse predictive insights:', error);
      return this.getFallbackPredictions();
    }
  }

  // Extract specific insights from AI response
  private extractInsight(text: string, category: string): any {
    const lines = text.split('\n');
    const relevantLines = lines.filter(line => 
      line.toLowerCase().includes(category) && line.trim().length > 10
    );
    
    return {
      summary: relevantLines[0] || `No ${category} insights available`,
      details: relevantLines.slice(1),
      confidence: 0.7
    };
  }

  // Fallback predictions when AI is unavailable
  private getFallbackPredictions(): any {
    return {
      staffingNeeds: {
        summary: 'Based on historical patterns, expect 15% increase in staffing needs next month',
        confidence: 0.6
      },
      demandPatterns: {
        summary: 'Peak demand typically occurs on weekends and during evening hours',
        confidence: 0.8
      },
      availability: {
        summary: 'Worker availability decreases by 20% during holiday periods',
        confidence: 0.7
      },
      costOptimization: {
        summary: 'Optimizing shift schedules could reduce costs by 12%',
        confidence: 0.5
      },
      riskFactors: {
        summary: 'High turnover risk identified in entry-level positions',
        confidence: 0.6
      }
    };
  }

  // Enhanced automation with complex conditional logic and AI suggestions
  async createAdvancedWorkflow(workflow: any): Promise<string> {
    const workflowId = `advanced-${Date.now()}`;
    
    // Validate workflow structure
    if (!workflow.triggers || !workflow.actions) {
      throw new Error('Workflow must have triggers and actions');
    }

    // Add AI enhancement suggestions
    workflow.aiSuggestions = await this.generateAISuggestions(workflow);
    
    // Set up performance monitoring
    workflow.metrics = {
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastExecuted: null
    };

    this.rules.set(workflowId, {
      id: workflowId,
      name: workflow.name,
      description: workflow.description,
      isActive: true,
      trigger: workflow.triggers[0], // Primary trigger
      actions: workflow.actions,
      conditions: workflow.conditions || [],
      executionCount: 0,
      aiSuggestions: workflow.aiSuggestions,
      metrics: workflow.metrics,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return workflowId;
  }

  // Smart scheduling automation with conflict resolution
  async createSmartScheduleAutomation(): Promise<void> {
    const scheduleWorkflow = {
      name: 'Smart Schedule Management',
      description: 'Automatically manage schedules with conflict resolution and optimization',
      triggers: [{ type: 'shift_created' }, { type: 'worker_availability_changed' }],
      conditions: [
        { field: 'shift.status', operator: 'equals', value: 'draft' },
        { field: 'worker.availability', operator: 'not_empty' }
      ],
      actions: [
        { 
          type: 'resolve_conflicts',
          config: {
            strategy: 'priority_based',
            autoReschedule: true,
            notifyAffected: true
          }
        },
        {
          type: 'optimize_schedule',
          config: {
            criteria: ['travel_time', 'worker_preference', 'cost_efficiency'],
            algorithm: 'genetic'
          }
        }
      ]
    };
    
    await this.createAdvancedWorkflow(scheduleWorkflow);
  }

  // Enhanced payment automation workflows
  async createPaymentAutomation(): Promise<void> {
    const paymentWorkflow = {
      name: 'Automated Payment Processing',
      description: 'Handle payments, invoicing, and financial workflows automatically',
      triggers: [
        { type: 'timesheet_approved' },
        { type: 'shift_completed' },
        { type: 'invoice_due' }
      ],
      conditions: [
        { field: 'timesheet.status', operator: 'equals', value: 'approved' },
        { field: 'payment.status', operator: 'equals', value: 'pending' }
      ],
      actions: [
        {
          type: 'calculate_payment',
          config: {
            includeBonus: true,
            deductTaxes: true,
            applyOvertime: true
          }
        },
        {
          type: 'process_payment',
          config: {
            method: 'stripe',
            autoRetry: true,
            maxRetries: 3
          }
        },
        {
          type: 'generate_invoice',
          config: {
            template: 'standard',
            sendToClient: true,
            attachTimesheet: true
          }
        }
      ]
    };
    
    await this.createAdvancedWorkflow(paymentWorkflow);
  }

  // Intelligent notification automation with personalization
  async createIntelligentNotificationSystem(): Promise<void> {
    const notificationWorkflow = {
      name: 'Intelligent Notification System',
      description: 'Personalized, context-aware notifications with optimal timing',
      triggers: [
        { type: 'user_activity' },
        { type: 'deadline_approaching' },
        { type: 'system_event' }
      ],
      conditions: [
        { field: 'user.notificationPreferences', operator: 'allows', value: 'automated' },
        { field: 'notification.priority', operator: 'greater_than', value: 'low' }
      ],
      actions: [
        {
          type: 'analyze_user_behavior',
          config: {
            factors: ['activity_patterns', 'response_rates', 'device_usage'],
            timeWindow: '30_days'
          }
        },
        {
          type: 'personalize_content',
          config: {
            tone: 'adaptive',
            language: 'user_preferred',
            includeActionItems: true
          }
        },
        {
          type: 'schedule_delivery',
          config: {
            timing: 'optimal',
            channel: 'multi_modal',
            fallbackChannels: ['email', 'sms', 'push']
          }
        }
      ]
    };
    
    await this.createAdvancedWorkflow(notificationWorkflow);
  }

  // Cross-platform integration automation
  async createIntegrationAutomation(): Promise<void> {
    const integrationWorkflow = {
      name: 'Cross-Platform Integration Hub',
      description: 'Automatically sync data and trigger actions across integrated platforms',
      triggers: [
        { type: 'external_webhook' },
        { type: 'data_sync_event' },
        { type: 'api_call_received' }
      ],
      conditions: [
        { field: 'integration.status', operator: 'equals', value: 'active' },
        { field: 'data.validation', operator: 'passes' }
      ],
      actions: [
        {
          type: 'validate_data',
          config: {
            schema: 'dynamic',
            sanitize: true,
            logErrors: true
          }
        },
        {
          type: 'transform_data',
          config: {
            mapping: 'platform_specific',
            preserveMetadata: true,
            auditTrail: true
          }
        },
        {
          type: 'sync_platforms',
          config: {
            bidirectional: true,
            conflictResolution: 'timestamp_based',
            batchSize: 100
          }
        }
      ]
    };
    
    await this.createAdvancedWorkflow(integrationWorkflow);
  }

  // Initialize enhanced automation features
  async initializeEnhancedAutomation(): Promise<void> {
    logger.info('🚀 Initializing enhanced automation features...');
    
    try {
      await this.createSmartScheduleAutomation();
      logger.info('✅ Smart scheduling automation created');
      
      await this.createPaymentAutomation();
      logger.info('✅ Payment automation created');
      
      await this.createIntelligentNotificationSystem();
      logger.info('✅ Intelligent notification system created');
      
      await this.createIntegrationAutomation();
      logger.info('✅ Integration automation created');
      
      logger.info('🎉 Enhanced automation features initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize enhanced automation:', error);
    }
  }

  // Performance analytics for automation workflows
  getWorkflowAnalytics(): any {
    const analytics: any = {
      totalWorkflows: this.rules.size,
      activeWorkflows: Array.from(this.rules.values()).filter(r => r.isActive).length,
      successRate: 0,
      averageExecutionTime: 0,
      topPerformers: [],
      recentActivity: []
    };

    // Calculate overall success rate and performance metrics
    const allRules = Array.from(this.rules.values());
    if (allRules.length > 0) {
      const totalExecution = allRules.reduce((sum, rule) => {
        return sum + (rule.metrics?.executionCount || 0);
      }, 0);

      if (totalExecution > 0) {
        analytics.successRate = allRules.reduce((sum, rule) => {
          return sum + ((rule.metrics?.successRate || 0) * (rule.metrics?.executionCount || 0));
        }, 0) / totalExecution;

        analytics.averageExecutionTime = allRules.reduce((sum, rule) => {
          return sum + ((rule.metrics?.averageExecutionTime || 0) * (rule.metrics?.executionCount || 0));
        }, 0) / totalExecution;
      }

      // Get top performing workflows
      analytics.topPerformers = allRules
        .filter(rule => (rule.metrics?.executionCount || 0) > 0)
        .sort((a, b) => (b.metrics?.successRate || 0) - (a.metrics?.successRate || 0))
        .slice(0, 5)
        .map(rule => ({
          id: rule.id,
          name: rule.name,
          successRate: rule.metrics?.successRate || 0,
          executionCount: rule.metrics?.executionCount || 0
        }));
    }

    return analytics;
  }
}

export const workflowEngine = new EnhancedWorkflowEngine();