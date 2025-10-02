import logger from '../utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: any;
}

interface RealtimeMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: Date;
  change24h: number;
  predictions: {
    next1h: number;
    next4h: number;
    next24h: number;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'scheduling' | 'performance' | 'notifications' | 'optimization' | 'compliance';
  trigger: any;
  actions: any[];
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  executionCount: number;
  lastExecuted?: Date;
  successRate: number;
  estimatedSavings: string;
  aiConfidence: number;
}

export class AIService {
  // AI Chat Assistant
  async processChat(
    message: string,
    context: string,
    sessionId: string,
    conversationHistory: ChatMessage[]
  ): Promise<{
    response: string;
    suggestions: string[];
    metadata: any;
  }> {
    try {
      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationContext = this.buildConversationContext(conversationHistory);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...conversationContext,
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't process your request. Please try again.";
      
      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(context, message);
      
      return {
        response,
        suggestions,
        metadata: {
          sessionId,
          context,
          timestamp: new Date(),
          tokens: completion.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      logger.error('AI Chat error:', error);
      return {
        response: "I'm experiencing some technical difficulties. Please try again in a moment.",
        suggestions: [],
        metadata: { error: true }
      };
    }
  }

  // Real-time Metrics Monitoring
  async getRealtimeMetrics(): Promise<RealtimeMetric[]> {
    // In a real implementation, this would pull from various data sources
    const metrics: RealtimeMetric[] = [
      {
        id: 'productivity',
        name: 'Team Productivity',
        value: this.generateRealisticValue(75, 95),
        target: 85,
        trend: this.generateTrend(),
        status: this.getMetricStatus(85, 85),
        lastUpdated: new Date(),
        change24h: this.generateChange(),
        predictions: {
          next1h: this.generateRealisticValue(75, 95),
          next4h: this.generateRealisticValue(75, 95),
          next24h: this.generateRealisticValue(75, 95)
        }
      },
      {
        id: 'efficiency',
        name: 'Operational Efficiency',
        value: this.generateRealisticValue(70, 90),
        target: 80,
        trend: this.generateTrend(),
        status: this.getMetricStatus(78, 80),
        lastUpdated: new Date(),
        change24h: this.generateChange(),
        predictions: {
          next1h: this.generateRealisticValue(70, 90),
          next4h: this.generateRealisticValue(70, 90),
          next24h: this.generateRealisticValue(70, 90)
        }
      },
      {
        id: 'capacity',
        name: 'Capacity Utilization',
        value: this.generateRealisticValue(80, 100),
        target: 85,
        trend: this.generateTrend(),
        status: this.getMetricStatus(92, 85),
        lastUpdated: new Date(),
        change24h: this.generateChange(),
        predictions: {
          next1h: this.generateRealisticValue(80, 100),
          next4h: this.generateRealisticValue(80, 100),
          next24h: this.generateRealisticValue(80, 100)
        }
      },
      {
        id: 'satisfaction',
        name: 'Employee Satisfaction',
        value: this.generateRealisticValue(6.0, 9.0),
        target: 8.0,
        trend: this.generateTrend(),
        status: this.getMetricStatus(7.8, 8.0),
        lastUpdated: new Date(),
        change24h: this.generateChange(),
        predictions: {
          next1h: this.generateRealisticValue(6.0, 9.0),
          next4h: this.generateRealisticValue(6.0, 9.0),
          next24h: this.generateRealisticValue(6.0, 9.0)
        }
      }
    ];

    return metrics;
  }

  // AI Alerts Generation
  async generateAIAlerts(): Promise<any[]> {
    const alerts = [];
    const metrics = await this.getRealtimeMetrics();
    
    for (const metric of metrics) {
      if (metric.status === 'critical' || metric.status === 'warning') {
        alerts.push({
          id: `alert_${metric.id}_${Date.now()}`,
          type: metric.id,
          severity: metric.status === 'critical' ? 'high' : 'medium',
          title: `${metric.name} ${metric.status === 'critical' ? 'Critical' : 'Warning'}`,
          description: `${metric.name} is at ${metric.value}${metric.id === 'satisfaction' ? '/10' : '%'}, ${metric.status === 'critical' ? 'significantly' : ''} ${metric.value < metric.target ? 'below' : 'above'} target of ${metric.target}${metric.id === 'satisfaction' ? '/10' : '%'}`,
          recommendation: this.generateRecommendation(metric),
          timestamp: new Date(),
          affectedEmployees: Math.floor(Math.random() * 20) + 5,
          estimatedImpact: this.generateImpactDescription(metric)
        });
      }
    }

    return alerts;
  }

  // AI Insights Generation
  async generateAIInsights(): Promise<any[]> {
    const insights = [
      {
        id: `insight_${Date.now()}_1`,
        category: 'optimization',
        title: 'Schedule Optimization Opportunity',
        description: 'AI detected potential efficiency gain by adjusting shift patterns',
        confidence: 0.85 + Math.random() * 0.1,
        actionRequired: true,
        potentialSavings: `$${Math.floor(Math.random() * 3000) + 1000}/month`,
        timeToImplement: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 3) + 3} days`
      },
      {
        id: `insight_${Date.now()}_2`,
        category: 'prediction',
        title: 'Performance Trend Forecast',
        description: 'Team productivity patterns suggest optimal task allocation windows',
        confidence: 0.87 + Math.random() * 0.1,
        actionRequired: false,
        potentialSavings: 'Improved task completion rates',
        timeToImplement: 'Immediate'
      }
    ];

    return insights;
  }

  // Automation Rules Management
  async getAutomationRules(): Promise<AutomationRule[]> {
    // Mock automation rules
    return [
      {
        id: 'rule_1',
        name: 'Auto Schedule Optimization',
        description: 'Automatically optimize schedules when efficiency drops below threshold',
        category: 'scheduling',
        trigger: { type: 'threshold', condition: 'efficiency < 75', value: 75 },
        actions: [
          { type: 'optimize_resource', parameters: { type: 'schedule' } },
          { type: 'notify', parameters: { recipients: ['managers'] } }
        ],
        isActive: true,
        priority: 'high',
        executionCount: Math.floor(Math.random() * 50) + 10,
        lastExecuted: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        successRate: 85 + Math.random() * 10,
        estimatedSavings: `$${Math.floor(Math.random() * 2000) + 800}/month`,
        aiConfidence: 0.85 + Math.random() * 0.1
      }
    ];
  }

  // Performance Coaching
  async generatePerformanceInsights(employeeId: string): Promise<any[]> {
    return [
      {
        id: `insight_${employeeId}_${Date.now()}`,
        type: 'strength',
        title: 'Excellent Task Completion Rate',
        description: 'Consistently completing tasks ahead of schedule',
        score: 85 + Math.random() * 10,
        trend: 'improving',
        recommendations: [
          'Share time management techniques with team',
          'Consider taking on stretch assignments'
        ],
        priority: 'low',
        category: 'productivity'
      }
    ];
  }

  async generatePersonalGoals(employeeId: string): Promise<any[]> {
    return [
      {
        id: `goal_${employeeId}_${Date.now()}`,
        title: 'Improve Team Collaboration',
        description: 'Enhance cross-team communication and collaboration effectiveness',
        category: 'Teamwork',
        targetValue: 85,
        currentValue: 72,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: 'high',
        aiSuggested: true,
        milestones: [
          { name: 'Complete communication workshop', completed: true, dueDate: new Date() },
          { name: 'Lead cross-team project', completed: false, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
        ]
      }
    ];
  }

  // Helper methods
  private buildSystemPrompt(context: string): string {
    const basePrompt = "You are an AI workforce management assistant. You provide helpful, accurate, and actionable insights about workforce optimization, employee performance, scheduling, and business operations.";
    
    const contextPrompts = {
      workforce: "Focus on workforce analytics, team performance, and employee engagement strategies.",
      performance: "Provide insights about performance metrics, productivity optimization, and goal achievement.",
      scheduling: "Help with shift optimization, resource allocation, and schedule efficiency.",
      general: "Provide comprehensive workforce management assistance across all areas."
    };

    return `${basePrompt} ${contextPrompts[context as keyof typeof contextPrompts] || contextPrompts.general}`;
  }

  private buildConversationContext(history: ChatMessage[]): any[] {
    return history.slice(-6).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  private generateSuggestions(context: string, message: string): string[] {
    const suggestions = {
      workforce: [
        "Analyze team performance trends",
        "Review employee satisfaction scores",
        "Check workforce capacity utilization"
      ],
      performance: [
        "Generate performance report",
        "Identify top performers",
        "Suggest improvement strategies"
      ],
      scheduling: [
        "Optimize next week's schedule",
        "Analyze shift patterns",
        "Review overtime trends"
      ],
      general: [
        "Show productivity insights",
        "Recommend efficiency improvements",
        "Generate workforce summary"
      ]
    };

    return suggestions[context as keyof typeof suggestions] || suggestions.general;
  }

  private generateRealisticValue(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  private generateTrend(): 'up' | 'down' | 'stable' {
    const rand = Math.random();
    if (rand < 0.4) return 'up';
    if (rand < 0.7) return 'stable';
    return 'down';
  }

  private generateChange(): number {
    return Math.round((Math.random() * 10 - 5) * 100) / 100;
  }

  private getMetricStatus(value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const ratio = value / target;
    if (ratio >= 1.1) return 'excellent';
    if (ratio >= 0.95) return 'good';
    if (ratio >= 0.8) return 'warning';
    return 'critical';
  }

  private generateRecommendation(metric: RealtimeMetric): string {
    const recommendations = {
      productivity: "Review current workflows and identify bottlenecks affecting team output",
      efficiency: "Analyze process optimization opportunities and consider automation",
      capacity: "Evaluate workload distribution and consider additional resources",
      satisfaction: "Conduct team feedback sessions and address engagement concerns"
    };

    return recommendations[metric.id as keyof typeof recommendations] || "Monitor situation closely and take corrective action";
  }

  private generateImpactDescription(metric: RealtimeMetric): string {
    if (metric.status === 'critical') {
      return `Significant impact on ${metric.name.toLowerCase()} - immediate attention required`;
    }
    return `Moderate impact on team ${metric.name.toLowerCase()} - monitoring recommended`;
  }
}

export const aiService = new AIService();