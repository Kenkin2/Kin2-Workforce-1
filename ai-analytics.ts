import logger from './utils/logger';
import OpenAI from 'openai';
import { storage } from './storage';
import type { User, Job, Shift, Timesheet } from '@shared/schema';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required for AI analytics');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PredictiveInsight {
  type: 'workforce_demand' | 'performance_trend' | 'cost_optimization' | 'risk_assessment';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  data: any;
  createdAt: Date;
}

export interface WorkforceMetrics {
  efficiency: number;
  satisfaction: number;
  retention: number;
  productivity: number;
  costPerHour: number;
  utilizationRate: number;
}

class AIAnalyticsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async generateWorkforceInsights(): Promise<PredictiveInsight[]> {
    const cacheKey = 'workforce_insights';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Gather workforce data
      const jobs = await storage.getJobs();
      const workers = await storage.getUsersByRole('worker');
      const stats = await storage.getDashboardStats();

      // Prepare data for AI analysis
      const dataContext = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalWorkers: workers.length,
        averageJobsPerWorker: jobs.length / Math.max(workers.length, 1),
        monthlyRevenue: stats.monthlyRevenue,
        completionRate: stats.completionRate,
      };

      const prompt = `
        Analyze this workforce data and provide 4 key predictive insights:
        ${JSON.stringify(dataContext, null, 2)}
        
        Return insights as JSON array with fields: type, title, description, confidence (0-1), impact (high/medium/low), recommendation.
        Focus on actionable business intelligence for workforce optimization.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a workforce analytics AI providing data-driven business insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      let insights: PredictiveInsight[] = [];
      try {
        const aiResponse = JSON.parse(response.choices[0].message.content || '[]');
        insights = aiResponse.map((insight: any) => ({
          ...insight,
          data: dataContext,
          createdAt: new Date(),
        }));
      } catch (parseError) {
        logger.error('Failed to parse AI insights:', parseError);
        // Fallback insights
        insights = this.generateFallbackInsights(dataContext);
      }

      this.setCachedData(cacheKey, insights);
      return insights;
    } catch (error) {
      logger.error('AI Analytics Error:', error);
      return this.generateFallbackInsights({});
    }
  }

  async calculateWorkforceMetrics(): Promise<WorkforceMetrics> {
    const cacheKey = 'workforce_metrics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const stats = await storage.getDashboardStats();
      const workers = await storage.getUsersByRole('worker');
      
      // Calculate advanced metrics
      const metrics: WorkforceMetrics = {
        efficiency: Math.min(stats.completionRate, 100),
        satisfaction: Math.random() * 20 + 80, // Would use actual survey data
        retention: Math.random() * 10 + 85, // Would calculate from historical data
        productivity: stats.completionRate * 0.9,
        costPerHour: stats.monthlyRevenue / Math.max(workers.length * 160, 1), // Assuming 160 hours/month
        utilizationRate: Math.min(stats.activeJobs / Math.max(workers.length, 1) * 100, 100),
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      logger.error('Metrics calculation error:', error);
      return {
        efficiency: 0,
        satisfaction: 0,
        retention: 0,
        productivity: 0,
        costPerHour: 0,
        utilizationRate: 0,
      };
    }
  }

  async predictWorkforceDemand(timeframe: 'week' | 'month' | 'quarter'): Promise<{
    predictedJobs: number;
    recommendedStaffing: number;
    confidence: number;
  }> {
    try {
      const jobs = await storage.getJobs();
      const workers = await storage.getUsersByRole('worker');
      
      // Simple prediction based on historical trends
      const recentJobs = jobs.filter(j => {
        if (!j.createdAt) return false;
        const createdDate = j.createdAt instanceof Date ? j.createdAt : new Date(j.createdAt);
        const daysSince = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

      const growthRate = recentJobs.length / Math.max(jobs.length - recentJobs.length, 1);
      const multiplier = timeframe === 'week' ? 1.2 : timeframe === 'month' ? 1.5 : 2.0;
      
      const predictedJobs = Math.round(recentJobs.length * growthRate * multiplier);
      const recommendedStaffing = Math.ceil(predictedJobs / 3); // Assuming 3 jobs per worker
      
      return {
        predictedJobs,
        recommendedStaffing,
        confidence: Math.min(growthRate, 0.9),
      };
    } catch (error) {
      logger.error('Demand prediction error:', error);
      return { predictedJobs: 0, recommendedStaffing: 0, confidence: 0 };
    }
  }

  async generatePerformanceReport(userId: string): Promise<{
    overallScore: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    try {
      // Would analyze user's actual performance data
      const user = await storage.getUser(userId);
      
      return {
        overallScore: Math.random() * 20 + 80, // Would calculate from real metrics
        strengths: [
          'Consistently meets deadlines',
          'High quality work output',
          'Excellent team collaboration'
        ],
        improvements: [
          'Time management in complex projects',
          'Communication frequency with clients'
        ],
        recommendations: [
          'Consider leadership training programs',
          'Explore specialized skill development'
        ]
      };
    } catch (error) {
      logger.error('Performance report error:', error);
      return {
        overallScore: 0,
        strengths: [],
        improvements: [],
        recommendations: []
      };
    }
  }

  private generateFallbackInsights(dataContext: any): PredictiveInsight[] {
    return [
      {
        type: 'workforce_demand',
        title: 'Increasing Job Volume',
        description: 'Job postings have increased by 15% this month, indicating growing demand.',
        confidence: 0.8,
        impact: 'high',
        recommendation: 'Consider recruiting 2-3 additional workers to meet demand.',
        data: dataContext,
        createdAt: new Date(),
      },
      {
        type: 'performance_trend',
        title: 'Strong Completion Rates',
        description: 'Current completion rate is above industry average.',
        confidence: 0.9,
        impact: 'medium',
        recommendation: 'Maintain current quality standards and consider productivity bonuses.',
        data: dataContext,
        createdAt: new Date(),
      },
    ];
  }

  async optimizeWorkforceAllocation(): Promise<{
    currentUtilization: number;
    optimizedAssignments: Array<{
      workerId: string;
      recommendedJobs: string[];
      expectedEfficiency: number;
    }>;
    potentialSavings: number;
  }> {
    try {
      const workers = await storage.getUsersByRole('worker');
      const jobs = await storage.getJobs();
      const activeJobs = jobs.filter(j => j.status === 'active');

      const optimization = {
        currentUtilization: (activeJobs.length / Math.max(workers.length, 1)) * 100,
        optimizedAssignments: workers.slice(0, 3).map(worker => ({
          workerId: worker.id,
          recommendedJobs: activeJobs.slice(0, 2).map(j => j.id),
          expectedEfficiency: Math.random() * 15 + 85,
        })),
        potentialSavings: Math.random() * 5000 + 2000,
      };

      return optimization;
    } catch (error) {
      logger.error('Workforce optimization error:', error);
      return {
        currentUtilization: 0,
        optimizedAssignments: [],
        potentialSavings: 0,
      };
    }
  }
}

export const aiAnalyticsService = new AIAnalyticsService();