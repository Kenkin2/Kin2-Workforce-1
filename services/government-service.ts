import { db } from "../db";
import { 
  universalCreditClients, 
  socialBenefitsClients, 
  benefitPayments, 
  workSearchRequirements, 
  governmentCommunications, 
  socialReports,
  governmentApiLogs,
  users
} from "@shared/schema";
import type { 
  InsertUniversalCreditClient,
  UniversalCreditClient,
  InsertSocialBenefitsClient,
  SocialBenefitsClient,
  InsertBenefitPayment,
  BenefitPayment,
  InsertWorkSearchRequirement,
  WorkSearchRequirement,
  InsertGovernmentCommunication,
  GovernmentCommunication,
  InsertSocialReport,
  SocialReport,
  InsertGovernmentApiLog
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export class GovernmentService {
  // Universal Credit Management
  async createUniversalCreditClaim(data: InsertUniversalCreditClient): Promise<UniversalCreditClient> {
    const [claim] = await db
      .insert(universalCreditClients)
      .values(data)
      .returning();
    
    // Auto-create work search requirements
    await this.createDefaultWorkSearchRequirements(claim.id, claim.userId);
    
    // Log the API call
    await this.logApiCall({
      apiEndpoint: "UC_CREATE_CLAIM",
      requestType: "claim_check",
      userId: claim.userId,
      claimReference: claim.universalCreditNumber,
      requestPayload: data,
      responseStatus: 201,
      responseData: claim,
      processingTime: 150,
      success: true,
    });
    
    return claim;
  }

  async getUniversalCreditClaim(userId: string): Promise<UniversalCreditClient | null> {
    const [claim] = await db
      .select()
      .from(universalCreditClients)
      .where(eq(universalCreditClients.userId, userId));
    
    return claim || null;
  }

  async updateUniversalCreditClaim(
    claimId: string, 
    updates: Partial<UniversalCreditClient>
  ): Promise<UniversalCreditClient> {
    const [updated] = await db
      .update(universalCreditClients)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(universalCreditClients.id, claimId))
      .returning();
    
    return updated;
  }

  // Social Benefits Management
  async createSocialBenefit(data: InsertSocialBenefitsClient): Promise<SocialBenefitsClient> {
    const [benefit] = await db
      .insert(socialBenefitsClients)
      .values(data)
      .returning();
    
    await this.logApiCall({
      apiEndpoint: "DWP_BENEFIT_APPLICATION",
      requestType: "benefit_verification",
      userId: benefit.userId,
      claimReference: benefit.applicationReference,
      requestPayload: data,
      responseStatus: 201,
      responseData: benefit,
      processingTime: 200,
      success: true,
    });
    
    return benefit;
  }

  async getUserBenefits(userId: string): Promise<SocialBenefitsClient[]> {
    return await db
      .select()
      .from(socialBenefitsClients)
      .where(eq(socialBenefitsClients.userId, userId))
      .orderBy(desc(socialBenefitsClients.createdAt));
  }

  async updateBenefitStatus(
    benefitId: string, 
    status: string, 
    metadata?: any
  ): Promise<SocialBenefitsClient> {
    const [updated] = await db
      .update(socialBenefitsClients)
      .set({
        claimStatus: status as any,
        updatedAt: new Date(),
      })
      .where(eq(socialBenefitsClients.id, benefitId))
      .returning();
    
    // Send communication about status change
    if (updated) {
      await this.sendGovernmentCommunication({
        userId: updated.userId,
        communicationType: "benefit_change",
        subject: `${updated.benefitType} Status Update`,
        message: `Your ${updated.benefitType} claim status has been updated to: ${status}`,
        priority: status === "denied" ? "high" : "medium",
        requiresAction: status === "under_review",
      });
    }
    
    return updated;
  }

  // Benefit Payments Management
  async recordBenefitPayment(data: InsertBenefitPayment): Promise<BenefitPayment> {
    const [payment] = await db
      .insert(benefitPayments)
      .values(data)
      .returning();
    
    // Send payment notification
    await this.sendGovernmentCommunication({
      userId: payment.userId,
      communicationType: "payment_notification",
      subject: `${payment.benefitType} Payment Processed`,
      message: `A payment of £${payment.paymentAmount} has been processed for your ${payment.benefitType} claim.`,
      priority: "medium",
      metadata: {
        paymentReference: payment.paymentReference,
        amount: payment.paymentAmount,
        paymentDate: payment.paymentDate,
      },
    });
    
    return payment;
  }

  async getUserPaymentHistory(
    userId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<BenefitPayment[]> {
    let whereConditions = [eq(benefitPayments.userId, userId)];
    
    if (startDate) {
      whereConditions.push(gte(benefitPayments.paymentDate, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(benefitPayments.paymentDate, endDate));
    }
    
    return await db
      .select()
      .from(benefitPayments)
      .where(and(...whereConditions))
      .orderBy(desc(benefitPayments.paymentDate));
  }

  async calculateMonthlyBenefitTotal(userId: string, month: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${benefitPayments.paymentAmount}), 0)`
      })
      .from(benefitPayments)
      .where(and(
        eq(benefitPayments.userId, userId),
        eq(benefitPayments.status, "paid"),
        sql`DATE_TRUNC('month', ${benefitPayments.paymentDate}) = ${month}-01`
      ));
    
    return result[0]?.total || 0;
  }

  // Work Search Requirements
  async createDefaultWorkSearchRequirements(
    claimId: string, 
    userId: string
  ): Promise<WorkSearchRequirement> {
    const [requirement] = await db
      .insert(workSearchRequirements)
      .values({
        userId,
        claimId,
        weeklyHoursRequired: 35,
        jobSearchActivities: {
          applications: 5,
          networking: 2,
          skillsTraining: 1,
          jobSearchWebsites: ["Universal Jobmatch", "Indeed", "Reed"],
        },
        skillsTrainingRequired: {
          mandatoryTraining: [],
          recommendedTraining: ["Basic IT Skills", "Customer Service"],
        },
        complianceScore: 100,
        nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      })
      .returning();
    
    return requirement;
  }

  async updateWorkSearchCompliance(
    requirementId: string, 
    activitiesCompleted: any
  ): Promise<WorkSearchRequirement> {
    // Calculate compliance score based on completed activities
    const complianceScore = this.calculateComplianceScore(activitiesCompleted);
    
    const [updated] = await db
      .update(workSearchRequirements)
      .set({
        complianceScore,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(workSearchRequirements.id, requirementId))
      .returning();
    
    // Send compliance warning if score is low
    if (complianceScore < 70) {
      await this.sendComplianceWarning(updated.userId, complianceScore);
    }
    
    return updated;
  }

  private calculateComplianceScore(activities: any): number {
    const weights = {
      jobApplications: 40,
      interviewsAttended: 30,
      trainingCompleted: 20,
      networkingEvents: 10,
    };
    
    let score = 0;
    let maxScore = 0;
    
    Object.entries(weights).forEach(([activity, weight]) => {
      maxScore += weight;
      if (activities[activity] && activities[activity] > 0) {
        score += Math.min(weight, activities[activity] * (weight / 5));
      }
    });
    
    return Math.round((score / maxScore) * 100);
  }

  private async sendComplianceWarning(userId: string, score: number): Promise<void> {
    await this.sendGovernmentCommunication({
      userId,
      communicationType: "compliance_warning",
      subject: "Work Search Compliance Warning",
      message: `Your work search compliance score is ${score}%. You must increase your job search activities to avoid sanctions.`,
      priority: "high",
      requiresAction: true,
      actionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    });
  }

  // Government Communications
  async sendGovernmentCommunication(
    data: InsertGovernmentCommunication
  ): Promise<GovernmentCommunication> {
    const [communication] = await db
      .insert(governmentCommunications)
      .values(data)
      .returning();
    
    return communication;
  }

  async getUserCommunications(
    userId: string, 
    unreadOnly: boolean = false
  ): Promise<GovernmentCommunication[]> {
    let whereConditions = [eq(governmentCommunications.userId, userId)];
    
    if (unreadOnly) {
      whereConditions.push(eq(governmentCommunications.isRead, false));
    }
    
    return await db
      .select()
      .from(governmentCommunications)
      .where(and(...whereConditions))
      .orderBy(desc(governmentCommunications.sentAt));
  }

  async markCommunicationRead(communicationId: string): Promise<GovernmentCommunication> {
    const [updated] = await db
      .update(governmentCommunications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(governmentCommunications.id, communicationId))
      .returning();
    
    return updated;
  }

  // Social Reports Generation
  async generateUniversalCreditSummary(userId: string): Promise<SocialReport> {
    // Get UC claim data
    const claim = await this.getUniversalCreditClaim(userId);
    if (!claim) {
      throw new Error("No Universal Credit claim found for user");
    }
    
    // Get payment history for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const payments = await this.getUserPaymentHistory(userId, sixMonthsAgo);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);
    
    // Get work search compliance
    const [workSearch] = await db
      .select()
      .from(workSearchRequirements)
      .where(eq(workSearchRequirements.claimId, claim.id))
      .orderBy(desc(workSearchRequirements.lastReviewDate));
    
    const reportData = {
      claimDetails: claim,
      paymentSummary: {
        totalPayments,
        paymentsCount: payments.length,
        averagePayment: payments.length > 0 ? totalPayments / payments.length : 0,
        lastPayment: payments[0],
      },
      complianceStatus: {
        score: workSearch?.complianceScore || 0,
        status: workSearch?.sanctionStatus || "none",
        nextReview: workSearch?.nextReviewDate,
      },
      recommendations: this.generateRecommendations(claim, workSearch),
    };
    
    const [report] = await db
      .insert(socialReports)
      .values({
        reportType: "uc_summary",
        title: "Universal Credit Summary Report",
        description: "Comprehensive overview of Universal Credit claim status and history",
        userId,
        reportPeriod: `${sixMonthsAgo.toISOString().slice(0, 7)}_${new Date().toISOString().slice(0, 7)}`,
        data: reportData,
        summary: {
          monthlyEntitlement: claim.monthlyEntitlement,
          totalReceived: totalPayments,
          complianceScore: workSearch?.complianceScore,
          claimStatus: claim.claimStatus,
        },
        complianceStatus: workSearch?.complianceScore >= 80 ? "compliant" : "warning",
        generatedBy: userId,
      })
      .returning();
    
    return report;
  }

  async generateBenefitBreakdown(userId: string): Promise<SocialReport> {
    const benefits = await this.getUserBenefits(userId);
    const payments = await this.getUserPaymentHistory(userId);
    
    const breakdown = benefits.map(benefit => {
      const benefitPayments = payments.filter(p => p.benefitType === benefit.benefitType);
      const totalPaid = benefitPayments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);
      
      return {
        benefit,
        totalPaid,
        paymentsCount: benefitPayments.length,
        status: benefit.claimStatus,
        lastPayment: benefitPayments[0],
      };
    });
    
    const [report] = await db
      .insert(socialReports)
      .values({
        reportType: "benefit_breakdown",
        title: "Benefits Breakdown Report",
        description: "Detailed breakdown of all benefit claims and payments",
        userId,
        data: { breakdown },
        summary: {
          totalBenefits: benefits.length,
          totalPaid: breakdown.reduce((sum, b) => sum + b.totalPaid, 0),
          activeClaims: benefits.filter(b => b.claimStatus === "active").length,
        },
        generatedBy: userId,
      })
      .returning();
    
    return report;
  }

  async generateEarningsImpactReport(userId: string, earnings: number): Promise<SocialReport> {
    const claim = await this.getUniversalCreditClaim(userId);
    if (!claim) {
      throw new Error("No Universal Credit claim found");
    }
    
    // Calculate earnings impact on UC entitlement
    const workAllowance = Number(claim.workAllowance) || 0;
    const currentEntitlement = Number(claim.monthlyEntitlement) || 0;
    
    // UC taper rate is 55p for every £1 earned above work allowance
    const earningsAboveAllowance = Math.max(0, earnings - workAllowance);
    const taperReduction = earningsAboveAllowance * 0.55;
    const newEntitlement = Math.max(0, currentEntitlement - taperReduction);
    
    const impactData = {
      currentEarnings: earnings,
      workAllowance,
      currentEntitlement,
      newEntitlement,
      reduction: taperReduction,
      netIncome: earnings + newEntitlement,
      betterOffWorking: (earnings + newEntitlement) > currentEntitlement,
    };
    
    const [report] = await db
      .insert(socialReports)
      .values({
        reportType: "earnings_impact",
        title: "Earnings Impact on Benefits",
        description: "Analysis of how employment earnings affect benefit entitlements",
        userId,
        data: impactData,
        summary: {
          totalNetIncome: impactData.netIncome,
          benefitReduction: taperReduction,
          recommendWork: impactData.betterOffWorking,
        },
        recommendations: {
          workIncentive: impactData.betterOffWorking,
          suggestedActions: impactData.betterOffWorking 
            ? ["Consider increasing work hours", "Look for higher-paid opportunities"]
            : ["Review in-work benefits", "Consider training opportunities"],
        },
        generatedBy: userId,
      })
      .returning();
    
    return report;
  }

  private generateRecommendations(
    claim: UniversalCreditClient, 
    workSearch?: WorkSearchRequirement
  ): string[] {
    const recommendations: string[] = [];
    
    if (Number(claim.earnings) === 0) {
      recommendations.push("Consider part-time work to increase income while maintaining benefits");
    }
    
    if (workSearch && workSearch.complianceScore < 80) {
      recommendations.push("Increase job search activities to improve compliance score");
    }
    
    if (!claim.nextAssessmentDate || claim.nextAssessmentDate < new Date()) {
      recommendations.push("Schedule your next assessment appointment");
    }
    
    if (Number(claim.housingCosts) > Number(claim.monthlyEntitlement) * 0.5) {
      recommendations.push("Consider applying for additional housing support");
    }
    
    return recommendations;
  }

  // API Integration Logging
  async logApiCall(data: InsertGovernmentApiLog): Promise<void> {
    await db.insert(governmentApiLogs).values({
      ...data,
      requestedAt: new Date(),
    });
  }

  async getApiLogs(
    userId?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<any[]> {
    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(governmentApiLogs.userId, userId));
    }
    
    if (startDate) {
      whereConditions.push(gte(governmentApiLogs.requestedAt, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(governmentApiLogs.requestedAt, endDate));
    }
    
    let query: any = db.select().from(governmentApiLogs);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    return await query.orderBy(desc(governmentApiLogs.requestedAt));
  }

  // Mock Government API Integration
  async syncWithGovernmentAPIs(userId: string): Promise<any> {
    // This would integrate with real government APIs
    // For now, we'll simulate the process
    
    const claim = await this.getUniversalCreditClaim(userId);
    if (!claim) {
      throw new Error("No UC claim found for synchronization");
    }
    
    // Simulate DWP API call
    await this.logApiCall({
      apiEndpoint: "DWP_API_SYNC",
      requestType: "claim_check",
      userId,
      claimReference: claim.universalCreditNumber,
      requestPayload: { claimId: claim.id },
      responseStatus: 200,
      responseData: {
        status: "active",
        nextPayment: "2025-09-15",
        amount: claim.monthlyEntitlement,
      },
      processingTime: 300,
      success: true,
    });
    
    // Update claim with latest data
    await this.updateUniversalCreditClaim(claim.id, {
      lastAssessmentDate: new Date(),
      nextAssessmentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    return {
      success: true,
      message: "Successfully synchronized with government systems",
      lastSync: new Date(),
    };
  }

  // Dashboard Statistics
  async getDashboardStats(userId: string): Promise<any> {
    const [claim, benefits, payments, communications] = await Promise.all([
      this.getUniversalCreditClaim(userId),
      this.getUserBenefits(userId),
      this.getUserPaymentHistory(userId, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)), // Last 90 days
      this.getUserCommunications(userId, true), // Unread only
    ]);
    
    const totalMonthlyBenefits = benefits
      .filter(b => b.claimStatus === "active")
      .reduce((sum, b) => sum + Number(b.monthlyAmount || 0), 0);
    
    const recentPayments = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);
    
    return {
      universalCredit: {
        status: claim?.claimStatus || "none",
        monthlyEntitlement: claim?.monthlyEntitlement || 0,
        nextPayment: claim?.nextAssessmentDate,
        workCoach: claim?.workCoachName,
      },
      totalMonthlyBenefits,
      recentPayments,
      unreadMessages: communications.length,
      activeClaims: benefits.filter(b => b.claimStatus === "active").length,
      complianceScore: 85, // Would be calculated from work search requirements
    };
  }
}

export const governmentService = new GovernmentService();