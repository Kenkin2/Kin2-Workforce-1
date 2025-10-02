import { db } from "../db";
import { eq, and, desc, gte, lte, sql, count, like } from "drizzle-orm";
import {
  partnerships,
  marketAnalysis,
  strategicPlans,
  growthMetrics,
  type Partnership,
  type MarketAnalysis,
  type StrategicPlan,
  type GrowthMetric,
  type InsertPartnership,
  type InsertMarketAnalysis,
  type InsertStrategicPlan,
  type InsertGrowthMetric,
} from "@shared/schema";

interface PartnershipMetrics {
  totalPartnerships: number;
  activePartnerships: number;
  totalContractValue: number;
  averageContractDuration: number;
  partnershipsByType: { type: string; count: number }[];
}

interface GrowthSummary {
  metric: string;
  currentValue: number;
  targetValue: number;
  achievementRate: number;
  trend: "up" | "down" | "stable";
  periodProgress: number;
}

interface StrategicPlanSummary {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalBudget: number;
  totalSpend: number;
  averageProgress: number;
}

export class BusinessDevelopmentService {
  // Partnership Management
  async createPartnership(data: InsertPartnership): Promise<Partnership> {
    const [partnership] = await db
      .insert(partnerships)
      .values(data)
      .returning();
    
    return partnership;
  }

  async getPartnerships(organizationId?: string): Promise<Partnership[]> {
    const query = db
      .select()
      .from(partnerships)
      .orderBy(desc(partnerships.createdAt));

    if (organizationId) {
      return await query.where(eq(partnerships.organizationId, organizationId));
    }

    return await query;
  }

  async getPartnership(partnershipId: string): Promise<Partnership | null> {
    const [partnership] = await db
      .select()
      .from(partnerships)
      .where(eq(partnerships.id, partnershipId));
    
    return partnership || null;
  }

  async updatePartnership(partnershipId: string, data: Partial<InsertPartnership>): Promise<Partnership> {
    const [updated] = await db
      .update(partnerships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(partnerships.id, partnershipId))
      .returning();
    
    return updated;
  }

  async deletePartnership(partnershipId: string): Promise<void> {
    await db
      .delete(partnerships)
      .where(eq(partnerships.id, partnershipId));
  }

  async getPartnershipMetrics(organizationId?: string): Promise<PartnershipMetrics> {
    const query = db
      .select()
      .from(partnerships);

    const allPartnerships = organizationId 
      ? await query.where(eq(partnerships.organizationId, organizationId))
      : await query;

    const totalPartnerships = allPartnerships.length;
    const activePartnerships = allPartnerships.filter(p => p.status === "active").length;
    const totalContractValue = allPartnerships.reduce((sum, p) => sum + Number(p.contractValue || 0), 0);

    // Calculate average contract duration
    const partnershipsWithDates = allPartnerships.filter(
      p => p.contractStartDate && p.contractEndDate
    );
    
    const totalDuration = partnershipsWithDates.reduce((sum, p) => {
      if (p.contractStartDate && p.contractEndDate) {
        const duration = new Date(p.contractEndDate).getTime() - new Date(p.contractStartDate).getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

    const averageContractDuration = partnershipsWithDates.length > 0 
      ? Math.floor(totalDuration / partnershipsWithDates.length / (1000 * 60 * 60 * 24)) // days
      : 0;

    // Count by type
    const typeCount: Record<string, number> = {};
    allPartnerships.forEach(p => {
      typeCount[p.partnerType] = (typeCount[p.partnerType] || 0) + 1;
    });

    const partnershipsByType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      totalPartnerships,
      activePartnerships,
      totalContractValue,
      averageContractDuration,
      partnershipsByType,
    };
  }

  // Market Analysis
  async createMarketAnalysis(data: InsertMarketAnalysis): Promise<MarketAnalysis> {
    const [analysis] = await db
      .insert(marketAnalysis)
      .values(data)
      .returning();
    
    return analysis;
  }

  async getMarketAnalyses(organizationId?: string): Promise<MarketAnalysis[]> {
    const query = db
      .select()
      .from(marketAnalysis)
      .orderBy(desc(marketAnalysis.analysisDate));

    if (organizationId) {
      return await query.where(eq(marketAnalysis.organizationId, organizationId));
    }

    return await query;
  }

  async getMarketAnalysis(analysisId: string): Promise<MarketAnalysis | null> {
    const [analysis] = await db
      .select()
      .from(marketAnalysis)
      .where(eq(marketAnalysis.id, analysisId));
    
    return analysis || null;
  }

  async updateMarketAnalysis(analysisId: string, data: Partial<InsertMarketAnalysis>): Promise<MarketAnalysis> {
    const [updated] = await db
      .update(marketAnalysis)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketAnalysis.id, analysisId))
      .returning();
    
    return updated;
  }

  async deleteMarketAnalysis(analysisId: string): Promise<void> {
    await db
      .delete(marketAnalysis)
      .where(eq(marketAnalysis.id, analysisId));
  }

  async getMarketAnalysisByType(
    analysisType: MarketAnalysis['analysisType'],
    organizationId?: string
  ): Promise<MarketAnalysis[]> {
    if (organizationId) {
      return await db
        .select()
        .from(marketAnalysis)
        .where(and(
          eq(marketAnalysis.analysisType, analysisType),
          eq(marketAnalysis.organizationId, organizationId)
        ))
        .orderBy(desc(marketAnalysis.analysisDate));
    }

    return await db
      .select()
      .from(marketAnalysis)
      .where(eq(marketAnalysis.analysisType, analysisType))
      .orderBy(desc(marketAnalysis.analysisDate));
  }

  // Strategic Planning
  async createStrategicPlan(data: InsertStrategicPlan): Promise<StrategicPlan> {
    const [plan] = await db
      .insert(strategicPlans)
      .values(data)
      .returning();
    
    return plan;
  }

  async getStrategicPlans(organizationId?: string): Promise<StrategicPlan[]> {
    const query = db
      .select()
      .from(strategicPlans)
      .orderBy(desc(strategicPlans.createdAt));

    if (organizationId) {
      return await query.where(eq(strategicPlans.organizationId, organizationId));
    }

    return await query;
  }

  async getStrategicPlan(planId: string): Promise<StrategicPlan | null> {
    const [plan] = await db
      .select()
      .from(strategicPlans)
      .where(eq(strategicPlans.id, planId));
    
    return plan || null;
  }

  async updateStrategicPlan(planId: string, data: Partial<InsertStrategicPlan>): Promise<StrategicPlan> {
    const [updated] = await db
      .update(strategicPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(strategicPlans.id, planId))
      .returning();
    
    return updated;
  }

  async deleteStrategicPlan(planId: string): Promise<void> {
    await db
      .delete(strategicPlans)
      .where(eq(strategicPlans.id, planId));
  }

  async getStrategicPlanSummary(organizationId?: string): Promise<StrategicPlanSummary> {
    const query = db
      .select()
      .from(strategicPlans);

    const plans = organizationId 
      ? await query.where(eq(strategicPlans.organizationId, organizationId))
      : await query;

    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.status === "active" || p.status === "in_progress").length;
    const completedPlans = plans.filter(p => p.status === "completed").length;
    const totalBudget = plans.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalSpend = plans.reduce((sum, p) => sum + Number(p.actualSpend || 0), 0);
    const averageProgress = plans.length > 0
      ? plans.reduce((sum, p) => sum + (p.progress || 0), 0) / plans.length
      : 0;

    return {
      totalPlans,
      activePlans,
      completedPlans,
      totalBudget,
      totalSpend,
      averageProgress,
    };
  }

  // Growth Metrics
  async recordGrowthMetric(data: InsertGrowthMetric): Promise<GrowthMetric> {
    const [metric] = await db
      .insert(growthMetrics)
      .values(data)
      .returning();
    
    return metric;
  }

  async getGrowthMetrics(
    organizationId?: string,
    metricType?: GrowthMetric['metricType'],
    startDate?: Date,
    endDate?: Date
  ): Promise<GrowthMetric[]> {
    let query = db
      .select()
      .from(growthMetrics)
      .orderBy(desc(growthMetrics.periodStart));

    const conditions: any[] = [];

    if (organizationId) {
      conditions.push(eq(growthMetrics.organizationId, organizationId));
    }

    if (metricType) {
      conditions.push(eq(growthMetrics.metricType, metricType));
    }

    if (startDate) {
      conditions.push(gte(growthMetrics.periodStart, startDate));
    }

    if (endDate) {
      conditions.push(lte(growthMetrics.periodEnd, endDate));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async getGrowthSummary(organizationId?: string): Promise<GrowthSummary[]> {
    const allMetrics = await this.getGrowthMetrics(organizationId);

    // Group by metric type and get latest
    const metricsByType: Record<string, GrowthMetric[]> = {};
    
    allMetrics.forEach(metric => {
      const key = `${metric.metricType}:${metric.metricName}`;
      if (!metricsByType[key]) {
        metricsByType[key] = [];
      }
      metricsByType[key].push(metric);
    });

    const summary: GrowthSummary[] = [];

    Object.entries(metricsByType).forEach(([key, metrics]) => {
      // Sort by period end descending
      metrics.sort((a, b) => {
        return new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime();
      });

      const latest = metrics[0];
      const currentValue = Number(latest.value);
      const targetValue = Number(latest.targetValue || 0);
      const achievementRate = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

      // Calculate period progress
      const periodStart = new Date(latest.periodStart).getTime();
      const periodEnd = new Date(latest.periodEnd).getTime();
      const now = new Date().getTime();
      const totalPeriod = periodEnd - periodStart;
      const elapsed = now - periodStart;
      const periodProgress = totalPeriod > 0 ? Math.min((elapsed / totalPeriod) * 100, 100) : 0;

      summary.push({
        metric: latest.metricName,
        currentValue,
        targetValue,
        achievementRate,
        trend: latest.trend || "stable",
        periodProgress,
      });
    });

    return summary;
  }

  async calculateGrowthRate(
    metricName: string,
    metricType: GrowthMetric['metricType'],
    organizationId?: string
  ): Promise<number> {
    const metrics = await this.getGrowthMetrics(organizationId, metricType);
    const relevantMetrics = metrics.filter(m => m.metricName === metricName);

    if (relevantMetrics.length < 2) {
      return 0;
    }

    // Sort by period end descending
    relevantMetrics.sort((a, b) => {
      return new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime();
    });

    const current = Number(relevantMetrics[0].value);
    const previous = Number(relevantMetrics[1].value);

    if (previous === 0) return 0;

    return ((current - previous) / previous) * 100;
  }
}

export const businessDevelopmentService = new BusinessDevelopmentService();
