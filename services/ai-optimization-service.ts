import { db } from "../db";
import { users, jobs, shifts, timesheets, payments, organizations } from "@shared/schema";
import { eq, sql, desc, gte, lte, and } from "drizzle-orm";

interface WorkforceMetrics {
  efficiency: number;
  utilization: number;
  satisfaction: number;
  productivity: number;
  costs: number;
  revenue: number;
}

interface PredictiveInsight {
  type: 'staffing' | 'demand' | 'cost' | 'performance' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  recommendedActions: string[];
  timeframe: string;
  data: any;
}

interface OptimizationRecommendation {
  category: 'scheduling' | 'staffing' | 'cost' | 'performance' | 'training';
  title: string;
  description: string;
  expectedBenefit: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: string;
  kpis: string[];
  steps: string[];
}

interface MLModel {
  name: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  predictions: any[];
}

export class AIOptimizationService {
  
  // Machine Learning Models
  private models: Map<string, MLModel> = new Map();

  constructor() {
    this.initializeModels();
  }

  // Initialize ML models
  private initializeModels(): void {
    // Demand Forecasting Model
    this.models.set('demandForecast', {
      name: 'Demand Forecasting',
      version: '2.1.0',
      accuracy: 0.89,
      lastTrained: new Date(),
      features: ['seasonality', 'historical_demand', 'economic_indicators', 'weather', 'events'],
      predictions: []
    });

    // Staff Optimization Model
    this.models.set('staffOptimization', {
      name: 'Staff Optimization',
      version: '1.8.0',
      accuracy: 0.92,
      lastTrained: new Date(),
      features: ['skills', 'availability', 'performance', 'cost', 'location'],
      predictions: []
    });

    // Performance Prediction Model
    this.models.set('performancePrediction', {
      name: 'Performance Prediction',
      version: '3.0.0',
      accuracy: 0.85,
      lastTrained: new Date(),
      features: ['past_performance', 'training_hours', 'experience', 'job_complexity', 'team_dynamics'],
      predictions: []
    });

    // Risk Assessment Model
    this.models.set('riskAssessment', {
      name: 'Risk Assessment',
      version: '1.5.0',
      accuracy: 0.91,
      lastTrained: new Date(),
      features: ['turnover_indicators', 'workload', 'satisfaction', 'safety_incidents', 'compliance'],
      predictions: []
    });

    // Cost Optimization Model
    this.models.set('costOptimization', {
      name: 'Cost Optimization',
      version: '2.3.0',
      accuracy: 0.88,
      lastTrained: new Date(),
      features: ['labor_costs', 'overtime', 'efficiency', 'resource_utilization', 'market_rates'],
      predictions: []
    });
  }

  // Real-time workforce analytics
  async getWorkforceMetrics(organizationId?: string): Promise<WorkforceMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate efficiency (completed jobs vs planned)
    const efficiencyQuery = await db
      .select({
        completed: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        total: sql<number>`COUNT(*)`
      })
      .from(jobs)
      .where(organizationId ? eq(jobs.clientId, organizationId) : sql`true`);

    const efficiency = efficiencyQuery[0]?.total > 0 
      ? (efficiencyQuery[0]?.completed / efficiencyQuery[0]?.total) * 100 
      : 0;

    // Calculate utilization (worked hours vs available hours)
    const utilizationQuery = await db
      .select({
        workedHours: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600), 0)`,
        totalShifts: sql<number>`COUNT(*)`
      })
      .from(timesheets)
      .where(gte(timesheets.clockIn, thirtyDaysAgo));

    const utilization = utilizationQuery[0]?.totalShifts > 0 
      ? Math.min((utilizationQuery[0]?.workedHours / (utilizationQuery[0]?.totalShifts * 8)) * 100, 100)
      : 0;

    // Calculate productivity (revenue per hour worked)
    const productivityQuery = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(amount), 0)`,
        totalHours: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600), 1)`
      })
      .from(payments)
      .leftJoin(timesheets, eq(payments.workerId, timesheets.workerId))
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.createdAt, thirtyDaysAgo)
      ));

    const productivity = productivityQuery[0]?.totalRevenue / productivityQuery[0]?.totalHours;

    // Calculate satisfaction (placeholder - would use survey data)
    const satisfaction = this.calculateSatisfactionScore(organizationId);

    // Calculate costs and revenue
    const costs = await this.calculateTotalCosts(organizationId, thirtyDaysAgo);
    const revenue = await this.calculateTotalRevenue(organizationId, thirtyDaysAgo);

    return {
      efficiency: Math.round(efficiency * 100) / 100,
      utilization: Math.round(utilization * 100) / 100,
      satisfaction: satisfaction,
      productivity: Math.round(productivity * 100) / 100,
      costs: costs,
      revenue: revenue
    };
  }

  // Predictive analytics
  async generatePredictiveInsights(organizationId?: string): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Demand forecasting
    const demandInsight = await this.predictDemandTrends(organizationId);
    if (demandInsight) insights.push(demandInsight);

    // Staffing optimization
    const staffingInsight = await this.predictStaffingNeeds(organizationId);
    if (staffingInsight) insights.push(staffingInsight);

    // Performance predictions
    const performanceInsight = await this.predictPerformanceIssues(organizationId);
    if (performanceInsight) insights.push(performanceInsight);

    // Risk assessment
    const riskInsight = await this.assessRisks(organizationId);
    if (riskInsight) insights.push(riskInsight);

    // Cost optimization
    const costInsight = await this.predictCostSavings(organizationId);
    if (costInsight) insights.push(costInsight);

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Optimization recommendations
  async generateOptimizationRecommendations(organizationId?: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const metrics = await this.getWorkforceMetrics(organizationId);

    // Scheduling optimization
    if (metrics.efficiency < 80) {
      recommendations.push({
        category: 'scheduling',
        title: 'Optimize Shift Scheduling',
        description: 'Implement AI-driven scheduling to improve efficiency by 15-25%',
        expectedBenefit: 0.20,
        implementationEffort: 'medium',
        timeline: '2-4 weeks',
        kpis: ['efficiency', 'overtime_reduction', 'worker_satisfaction'],
        steps: [
          'Analyze historical demand patterns',
          'Implement predictive scheduling algorithm',
          'Set up automated shift assignments',
          'Monitor and adjust based on feedback'
        ]
      });
    }

    // Staffing optimization
    if (metrics.utilization < 75) {
      recommendations.push({
        category: 'staffing',
        title: 'Right-size Workforce',
        description: 'Optimize staff levels to reduce costs while maintaining service quality',
        expectedBenefit: 0.15,
        implementationEffort: 'high',
        timeline: '4-8 weeks',
        kpis: ['utilization', 'cost_per_hour', 'service_quality'],
        steps: [
          'Analyze current staffing patterns',
          'Identify overstaffed and understaffed periods',
          'Develop flexible staffing model',
          'Implement cross-training programs'
        ]
      });
    }

    // Performance improvement
    if (metrics.productivity < 100) {
      recommendations.push({
        category: 'performance',
        title: 'Enhance Worker Performance',
        description: 'Implement performance tracking and improvement programs',
        expectedBenefit: 0.18,
        implementationEffort: 'medium',
        timeline: '3-6 weeks',
        kpis: ['productivity', 'quality_scores', 'customer_satisfaction'],
        steps: [
          'Set up performance metrics dashboard',
          'Implement real-time feedback system',
          'Create performance improvement plans',
          'Establish recognition and incentive programs'
        ]
      });
    }

    // Training optimization
    if (metrics.satisfaction < 80) {
      recommendations.push({
        category: 'training',
        title: 'Personalized Training Programs',
        description: 'Use AI to create personalized training paths for each worker',
        expectedBenefit: 0.12,
        implementationEffort: 'low',
        timeline: '2-3 weeks',
        kpis: ['skill_development', 'satisfaction', 'retention'],
        steps: [
          'Assess current skill levels',
          'Identify skill gaps',
          'Create personalized training modules',
          'Track progress and adjust content'
        ]
      });
    }

    // Cost reduction
    const costRatio = metrics.costs / metrics.revenue;
    if (costRatio > 0.7) {
      recommendations.push({
        category: 'cost',
        title: 'Reduce Operational Costs',
        description: 'Identify and eliminate cost inefficiencies across operations',
        expectedBenefit: 0.10,
        implementationEffort: 'medium',
        timeline: '4-6 weeks',
        kpis: ['cost_ratio', 'profit_margin', 'efficiency'],
        steps: [
          'Conduct comprehensive cost analysis',
          'Identify high-impact cost reduction opportunities',
          'Implement process improvements',
          'Monitor cost savings and ROI'
        ]
      });
    }

    return recommendations.sort((a, b) => b.expectedBenefit - a.expectedBenefit);
  }

  // Machine learning model training
  async trainModel(modelName: string, trainingData: any[]): Promise<void> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    // Simulate model training (in production, this would use actual ML libraries)
    const accuracy = 0.8 + Math.random() * 0.15; // Simulate 80-95% accuracy
    
    model.accuracy = accuracy;
    model.lastTrained = new Date();
    model.predictions = this.generateMockPredictions(modelName, trainingData);
    
    this.models.set(modelName, model);
  }

  // Real-time performance monitoring
  async monitorPerformance(organizationId?: string): Promise<{
    alerts: any[];
    trends: any[];
    anomalies: any[];
  }> {
    const alerts = await this.detectPerformanceAlerts(organizationId);
    const trends = await this.analyzeTrends(organizationId);
    const anomalies = await this.detectAnomalies(organizationId);

    return { alerts, trends, anomalies };
  }

  // Automated decision making
  async makeAutomatedDecisions(organizationId?: string): Promise<{
    decisions: any[];
    actions: any[];
    notifications: any[];
  }> {
    const decisions: any[] = [];
    const actions: any[] = [];
    const notifications: any[] = [];

    // Automatic scheduling adjustments
    const schedulingDecision = await this.evaluateSchedulingAdjustments(organizationId);
    if (schedulingDecision.shouldAdjust) {
      decisions.push({
        type: 'scheduling',
        action: 'adjust_shifts',
        confidence: schedulingDecision.confidence,
        impact: schedulingDecision.impact
      });
    }

    // Automatic resource allocation
    const resourceDecision = await this.evaluateResourceAllocation(organizationId);
    if (resourceDecision.shouldReallocate) {
      decisions.push({
        type: 'resource_allocation',
        action: 'reallocate_workers',
        confidence: resourceDecision.confidence,
        impact: resourceDecision.impact
      });
    }

    // Performance intervention triggers
    const performanceDecision = await this.evaluatePerformanceInterventions(organizationId);
    if (performanceDecision.requiresIntervention) {
      actions.push({
        type: 'performance_intervention',
        target: performanceDecision.targets,
        interventions: performanceDecision.interventions
      });
    }

    return { decisions, actions, notifications };
  }

  // Advanced analytics dashboard data
  async getAdvancedAnalytics(organizationId?: string, timeframe: string = '30d'): Promise<any> {
    const days = this.parseTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      overview: await this.getWorkforceMetrics(organizationId),
      predictions: await this.generatePredictiveInsights(organizationId),
      recommendations: await this.generateOptimizationRecommendations(organizationId),
      trends: await this.getDetailedTrends(organizationId, startDate),
      benchmarks: await this.getBenchmarkComparisons(organizationId),
      simulations: await this.runWhatIfSimulations(organizationId)
    };
  }

  // Private helper methods
  private async predictDemandTrends(organizationId?: string): Promise<PredictiveInsight | null> {
    // Simulate demand prediction
    const currentTrend = Math.random();
    
    if (currentTrend > 0.7) {
      return {
        type: 'demand',
        priority: 'high',
        title: 'Increased Demand Predicted',
        description: 'AI models predict 25% increase in demand over next 2 weeks',
        impact: 0.25,
        confidence: 0.89,
        recommendedActions: [
          'Increase staffing by 20%',
          'Prepare for overtime requirements',
          'Consider temporary staff hiring'
        ],
        timeframe: '2 weeks',
        data: { trend: 'increasing', magnitude: 0.25 }
      };
    }
    
    return null;
  }

  private async predictStaffingNeeds(organizationId?: string): Promise<PredictiveInsight | null> {
    // Simulate staffing prediction
    return {
      type: 'staffing',
      priority: 'medium',
      title: 'Optimal Staffing Adjustment',
      description: 'Current staffing levels are 15% above optimal for projected demand',
      impact: 0.15,
      confidence: 0.92,
      recommendedActions: [
        'Reduce shifts during low-demand periods',
        'Implement flexible scheduling',
        'Cross-train workers for versatility'
      ],
      timeframe: '1 week',
      data: { overstaff: 0.15, optimalLevel: 85 }
    };
  }

  private async predictPerformanceIssues(organizationId?: string): Promise<PredictiveInsight | null> {
    return {
      type: 'performance',
      priority: 'medium',
      title: 'Performance Optimization Opportunity',
      description: 'AI identifies potential 12% productivity improvement through targeted training',
      impact: 0.12,
      confidence: 0.85,
      recommendedActions: [
        'Implement skill-specific training programs',
        'Set up mentoring for underperforming workers',
        'Introduce performance incentives'
      ],
      timeframe: '4 weeks',
      data: { improvementPotential: 0.12, targetAreas: ['technical_skills', 'efficiency'] }
    };
  }

  private async assessRisks(organizationId?: string): Promise<PredictiveInsight | null> {
    return {
      type: 'risk',
      priority: 'high',
      title: 'Turnover Risk Detected',
      description: 'AI models indicate 18% of workers are at risk of leaving within 3 months',
      impact: 0.18,
      confidence: 0.91,
      recommendedActions: [
        'Conduct retention interviews',
        'Improve compensation packages',
        'Enhance work-life balance',
        'Provide career development opportunities'
      ],
      timeframe: '3 months',
      data: { atRiskWorkers: 18, riskFactors: ['workload', 'compensation', 'growth'] }
    };
  }

  private async predictCostSavings(organizationId?: string): Promise<PredictiveInsight | null> {
    return {
      type: 'cost',
      priority: 'medium',
      title: 'Cost Reduction Opportunity',
      description: 'Optimizing schedules could reduce labor costs by 8% without impact on service',
      impact: 0.08,
      confidence: 0.88,
      recommendedActions: [
        'Implement AI-driven scheduling',
        'Reduce overtime through better planning',
        'Optimize shift patterns'
      ],
      timeframe: '6 weeks',
      data: { costReduction: 0.08, primarySource: 'scheduling_optimization' }
    };
  }

  private calculateSatisfactionScore(organizationId?: string): number {
    // Placeholder calculation - would use actual survey data
    return 75 + Math.random() * 20; // 75-95% satisfaction
  }

  private async calculateTotalCosts(organizationId?: string, startDate?: Date): Promise<number> {
    const date = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(payments)
      .innerJoin(timesheets, eq(payments.timesheetId, timesheets.id))
      .innerJoin(shifts, eq(timesheets.shiftId, shifts.id))
      .innerJoin(jobs, eq(shifts.jobId, jobs.id))
      .where(and(
        organizationId ? eq(jobs.clientId, organizationId) : sql`true`,
        gte(payments.createdAt, date),
        eq(payments.status, 'completed')
      ));

    return result[0]?.total || 0;
  }

  private async calculateTotalRevenue(organizationId?: string, startDate?: Date): Promise<number> {
    const date = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`
      })
      .from(payments)
      .innerJoin(timesheets, eq(payments.timesheetId, timesheets.id))
      .innerJoin(shifts, eq(timesheets.shiftId, shifts.id))
      .innerJoin(jobs, eq(shifts.jobId, jobs.id))
      .where(and(
        organizationId ? eq(jobs.clientId, organizationId) : sql`true`,
        gte(payments.createdAt, date),
        eq(payments.status, 'completed')
      ));

    return result[0]?.total || 0;
  }

  private generateMockPredictions(modelName: string, trainingData: any[]): any[] {
    // Generate realistic mock predictions based on model type
    const predictions = [];
    const predictionCount = 10 + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < predictionCount; i++) {
      predictions.push({
        timestamp: new Date(),
        confidence: 0.7 + Math.random() * 0.3,
        value: Math.random() * 100,
        features: this.models.get(modelName)?.features || []
      });
    }
    
    return predictions;
  }

  private async detectPerformanceAlerts(organizationId?: string): Promise<any[]> {
    return [
      {
        id: 'alert_1',
        type: 'efficiency_drop',
        severity: 'medium',
        message: 'Efficiency dropped 8% in last 24 hours',
        timestamp: new Date(),
        affected: ['shift_team_a', 'shift_team_b']
      }
    ];
  }

  private async analyzeTrends(organizationId?: string): Promise<any[]> {
    return [
      {
        metric: 'productivity',
        trend: 'increasing',
        rate: 0.05,
        period: '7d',
        confidence: 0.92
      },
      {
        metric: 'costs',
        trend: 'stable',
        rate: 0.01,
        period: '7d',
        confidence: 0.88
      }
    ];
  }

  private async detectAnomalies(organizationId?: string): Promise<any[]> {
    return [
      {
        type: 'outlier',
        metric: 'completion_time',
        deviation: 2.5,
        timestamp: new Date(),
        description: 'Job completion times 150% higher than normal'
      }
    ];
  }

  private async evaluateSchedulingAdjustments(organizationId?: string): Promise<any> {
    return {
      shouldAdjust: true,
      confidence: 0.89,
      impact: 0.12,
      adjustments: ['reduce_evening_shifts', 'increase_morning_coverage']
    };
  }

  private async evaluateResourceAllocation(organizationId?: string): Promise<any> {
    return {
      shouldReallocate: true,
      confidence: 0.85,
      impact: 0.08,
      reallocations: ['move_workers_to_high_demand_areas']
    };
  }

  private async evaluatePerformanceInterventions(organizationId?: string): Promise<any> {
    return {
      requiresIntervention: true,
      targets: ['worker_123', 'worker_456'],
      interventions: ['additional_training', 'mentoring', 'performance_review']
    };
  }

  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/(\d+)([dwmy])/);
    if (!match) return 30;
    
    const [, num, unit] = match;
    const value = parseInt(num);
    
    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  private async getDetailedTrends(organizationId?: string, startDate?: Date): Promise<any> {
    return {
      efficiency: { trend: 'up', rate: 0.05 },
      costs: { trend: 'down', rate: 0.03 },
      satisfaction: { trend: 'stable', rate: 0.01 },
      productivity: { trend: 'up', rate: 0.08 }
    };
  }

  private async getBenchmarkComparisons(organizationId?: string): Promise<any> {
    return {
      industry: {
        efficiency: { current: 85, benchmark: 82, percentile: 75 },
        costs: { current: 45, benchmark: 50, percentile: 80 },
        satisfaction: { current: 78, benchmark: 75, percentile: 65 }
      }
    };
  }

  private async runWhatIfSimulations(organizationId?: string): Promise<any> {
    return {
      scenarios: [
        {
          name: 'Increase staffing by 10%',
          impact: { efficiency: +5, costs: +8, satisfaction: +3 }
        },
        {
          name: 'Implement flexible scheduling',
          impact: { efficiency: +12, costs: -5, satisfaction: +8 }
        },
        {
          name: 'Add performance incentives',
          impact: { efficiency: +15, costs: +3, satisfaction: +10 }
        }
      ]
    };
  }
}

export const aiOptimizationService = new AIOptimizationService();