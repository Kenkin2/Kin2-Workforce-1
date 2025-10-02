import logger from './utils/logger';
import OpenAI from 'openai';
import type { Job, User, Shift } from '@shared/schema';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JobMatchResult {
  jobId: string;
  workerId: string;
  score: number;
  reasoning: string;
}

export interface ScheduleRecommendation {
  workerId: string;
  shiftId: string;
  score: number;
  reasoning: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export class AIService {
  private conversationHistory: Map<string, any[]> = new Map();
  async generateJobMatch(job: Job, workers: User[]): Promise<JobMatchResult[]> {
    try {
      const prompt = `
As a workforce management AI, analyze the job and worker profiles to find the best matches.

Job Details:
- Title: ${job.title}
- Description: ${job.description}
- Location: ${job.location}
- Skills Required: ${job.requiredSkills?.join(', ') || 'None specified'}
- Job Type: ${job.jobType}

Available Workers:
${workers.map(w => `
- ID: ${w.id}
- Name: ${w.firstName} ${w.lastName}
- Role: ${w.role}
- Karma Coins: ${w.karmaCoins}
`).join('')}

For each worker, provide a match score (0-100) and brief reasoning. Return as JSON array:
[{"jobId": "...", "workerId": "...", "score": 85, "reasoning": "Strong skill match and high karma score"}]
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        const matches = JSON.parse(content);
        return matches.filter((m: any) => m.score >= 60); // Only return good matches
      } catch {
        return [];
      }
    } catch (error) {
      logger.error('AI job matching error:', error);
      return [];
    }
  }

  async generateScheduleRecommendation(shifts: Shift[], workers: User[]): Promise<ScheduleRecommendation[]> {
    try {
      const prompt = `
As a workforce scheduling AI, recommend optimal worker assignments for shifts.

Available Shifts:
${shifts.map(s => `
- ID: ${s.id}
- Start: ${s.startTime}
- End: ${s.endTime}
- Status: ${s.status}
`).join('')}

Available Workers:
${workers.map(w => `
- ID: ${w.id}
- Name: ${w.firstName} ${w.lastName}
- Karma: ${w.karmaCoins}
`).join('')}

Provide scheduling recommendations with scores (0-100) and reasoning. Return as JSON:
[{"workerId": "...", "shiftId": "...", "score": 90, "reasoning": "High availability and performance"}]
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        const recommendations = JSON.parse(content);
        return recommendations.filter((r: any) => r.score >= 70);
      } catch {
        return [];
      }
    } catch (error) {
      logger.error('AI scheduling error:', error);
      return [];
    }
  }

  async chatAssistant(message: string, userId: string, context?: any): Promise<ChatResponse> {
    try {
      // Get conversation history for context
      const history = this.conversationHistory.get(userId) || [];
      
      const systemPrompt = `You are a helpful AI assistant for Kin2 Workforce management platform.

Help with:
- Job management and scheduling
- Worker assignments and performance
- Platform navigation and features
- Best practices for workforce management

Be helpful, professional, and concise. Keep responses under 200 words.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4), // Keep last 4 messages for context
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.5,
        max_tokens: 400,
      });

      const aiResponse = response.choices[0]?.message?.content || 'Sorry, I could not process your request.';
      
      // Update conversation history
      this.conversationHistory.set(userId, [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]);

      return {
        message: aiResponse,
        suggestions: this.generateEnhancedSuggestions(message),
      };
    } catch (error) {
      logger.error('AI chat error:', error);
      return {
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again.',
      };
    }
  }

  generateEnhancedSuggestions(message: string): string[] {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('schedule') || messageLower.includes('shift')) {
      return [
        "Check AI Smart Scheduling for optimal shift assignments",
        "View upcoming shifts in the Schedule section",
        "Analyze worker availability patterns",
        "Set up automated scheduling rules"
      ];
    }
    
    if (messageLower.includes('job') || messageLower.includes('hire') || messageLower.includes('recruit')) {
      return [
        "Use AI Job Matching to find ideal candidates",
        "Create new job posting with detailed requirements",
        "Review candidate applications and scores",
        "Analyze hiring performance metrics"
      ];
    }
    
    if (messageLower.includes('performance') || messageLower.includes('metric') || messageLower.includes('kpi')) {
      return [
        "View AI Insights Dashboard for performance analytics",
        "Check worker karma coin standings",
        "Review completion rates and efficiency metrics",
        "Set up performance improvement goals"
      ];
    }
    
    if (messageLower.includes('finance') || messageLower.includes('payment') || messageLower.includes('budget')) {
      return [
        "Review financial management dashboard",
        "Process pending payments and invoices",
        "Analyze cost optimization opportunities",
        "Set up automated billing workflows"
      ];
    }
    
    return [
      "Explore AI Intelligence dashboard for insights",
      "Check recent workforce activity",
      "Review platform performance metrics",
      "Access learning hub for skill development"
    ];
  }

  getQuickResponse(message: string): string | null {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('hello') || messageLower.includes('hi')) {
      return "Hello! I'm here to help you manage your workforce efficiently. What would you like to know about?";
    }
    
    if (messageLower.includes('help') && messageLower.length < 10) {
      return "I can help you with scheduling, job management, worker performance, and platform features. What specific area would you like assistance with?";
    }
    
    return null;
  }

  getFallbackResponse(message: string): { message: string; suggestions?: string[] } {
    return {
      message: "I'm temporarily unable to process complex requests. You can try asking again or explore the platform features directly.",
      suggestions: this.generateEnhancedSuggestions(message)
    };
  }

  async generateInsights(data: any): Promise<string> {
    try {
      const prompt = `
As a senior workforce management consultant, analyze this comprehensive business data and provide strategic insights:

Platform Data: ${JSON.stringify(data, null, 2)}

ANALYSIS FRAMEWORK:
1. WORKFORCE EFFICIENCY: Identify productivity patterns and optimization opportunities
2. FINANCIAL PERFORMANCE: Cost analysis, revenue optimization, budget allocation
3. RESOURCE UTILIZATION: Asset management, capacity planning, skill deployment
4. RISK ASSESSMENT: Compliance gaps, operational risks, market threats
5. GROWTH OPPORTUNITIES: Scaling strategies, automation potential, competitive advantages

Provide 5-7 actionable insights with specific recommendations for immediate implementation.
Focus on measurable improvements and ROI potential.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || 'No insights available at this time.';
    } catch (error) {
      logger.error('AI insights error:', error);
      return 'Unable to generate insights at this time.';
    }
  }

  async generateAutomationRecommendations(workforceData: any): Promise<string[]> {
    try {
      const prompt = `
Based on this workforce data, recommend 5 automation opportunities that could improve efficiency:

Data: ${JSON.stringify(workforceData, null, 2)}

Focus on:
- Repetitive tasks that could be automated
- Process improvements and workflow optimization
- Predictive scheduling and resource allocation
- Automated reporting and analytics
- Compliance and safety monitoring

Return as JSON array of strings: ["Automation recommendation 1", "Automation recommendation 2", ...]
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        return JSON.parse(content);
      } catch {
        return content.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
      }
    } catch (error) {
      logger.error('AI automation recommendations error:', error);
      return ['Unable to generate automation recommendations at this time.'];
    }
  }
}

export const workforceAIService = new AIService();