import { db } from "../db";
import { eq, and, desc, sql, count, like, gte, lte } from "drizzle-orm";
import {
  performanceReviewCycles,
  performanceReviews,
  reviewParticipants,
  reviewCompetencies,
  reviewResponses,
  reviewGoals,
  reviewAnalytics,
  users,
  type PerformanceReviewCycle,
  type PerformanceReview,
  type ReviewParticipant,
  type ReviewCompetency,
  type ReviewResponse,
  type ReviewGoal,
  type ReviewAnalytics,
  type InsertPerformanceReviewCycle,
  type InsertPerformanceReview,
  type InsertReviewParticipant,
  type InsertReviewCompetency,
  type InsertReviewResponse,
  type InsertReviewGoal,
  type InsertReviewAnalytics,
} from "@shared/schema";

interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  averageRating: number;
  participationRate: number;
  onTimeCompletion: number;
}

interface CompetencyAnalysis {
  competencyId: string;
  competencyName: string;
  averageRating: number;
  ratingCount: number;
  trend: "improving" | "declining" | "stable";
}

export class PerformanceReviewService {
  // Review Cycle Management
  async createReviewCycle(data: InsertPerformanceReviewCycle): Promise<PerformanceReviewCycle> {
    const [cycle] = await db
      .insert(performanceReviewCycles)
      .values(data)
      .returning();
    
    return cycle;
  }

  async getActiveReviewCycles(): Promise<PerformanceReviewCycle[]> {
    return await db
      .select()
      .from(performanceReviewCycles)
      .where(and(
        eq(performanceReviewCycles.isActive, true),
        eq(performanceReviewCycles.status, "active")
      ))
      .orderBy(desc(performanceReviewCycles.startDate));
  }

  async getReviewCycle(cycleId: string): Promise<PerformanceReviewCycle | null> {
    const [cycle] = await db
      .select()
      .from(performanceReviewCycles)
      .where(eq(performanceReviewCycles.id, cycleId));
    
    return cycle || null;
  }

  // Performance Review Management
  async createPerformanceReview(data: InsertPerformanceReview): Promise<PerformanceReview> {
    const [review] = await db
      .insert(performanceReviews)
      .values(data)
      .returning();
    
    return review;
  }

  async getUserReviews(userId: string): Promise<PerformanceReview[]> {
    return await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.revieweeId, userId))
      .orderBy(desc(performanceReviews.createdAt));
  }

  async getReviewsForParticipant(participantId: string): Promise<any[]> {
    return await db
      .select({
        review: performanceReviews,
        participant: reviewParticipants,
        reviewee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(reviewParticipants)
      .innerJoin(performanceReviews, eq(reviewParticipants.reviewId, performanceReviews.id))
      .innerJoin(users, eq(performanceReviews.revieweeId, users.id))
      .where(eq(reviewParticipants.participantId, participantId))
      .orderBy(desc(performanceReviews.createdAt));
  }

  async getReviewDetails(reviewId: string): Promise<any> {
    const [review] = await db
      .select({
        review: performanceReviews,
        cycle: performanceReviewCycles,
        reviewee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role
        }
      })
      .from(performanceReviews)
      .innerJoin(performanceReviewCycles, eq(performanceReviews.cycleId, performanceReviewCycles.id))
      .innerJoin(users, eq(performanceReviews.revieweeId, users.id))
      .where(eq(performanceReviews.id, reviewId));

    if (!review) return null;

    const participants = await db
      .select({
        participant: reviewParticipants,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(reviewParticipants)
      .innerJoin(users, eq(reviewParticipants.participantId, users.id))
      .where(eq(reviewParticipants.reviewId, reviewId));

    const goals = await db
      .select()
      .from(reviewGoals)
      .where(eq(reviewGoals.reviewId, reviewId))
      .orderBy(reviewGoals.createdAt);

    return {
      ...review,
      participants,
      goals
    };
  }

  // Review Participants Management
  async addReviewParticipant(data: InsertReviewParticipant): Promise<ReviewParticipant> {
    const [participant] = await db
      .insert(reviewParticipants)
      .values(data)
      .returning();
    
    return participant;
  }

  async inviteReviewParticipants(reviewId: string, participantIds: string[], participantType: string): Promise<ReviewParticipant[]> {
    const participants = participantIds.map(participantId => ({
      reviewId,
      participantId,
      participantType: participantType as "self" | "supervisor" | "peer" | "subordinate" | "customer" | "external",
      status: "invited" as const,
      invitedAt: new Date()
    }));

    return await db
      .insert(reviewParticipants)
      .values(participants)
      .returning();
  }

  async updateParticipantStatus(participantId: string, reviewId: string, status: string): Promise<ReviewParticipant> {
    const [updated] = await db
      .update(reviewParticipants)
      .set({ 
        status: status as "invited" | "in_progress" | "completed" | "declined" | "overdue",
        respondedAt: status === "completed" ? new Date() : undefined
      })
      .where(and(
        eq(reviewParticipants.participantId, participantId),
        eq(reviewParticipants.reviewId, reviewId)
      ))
      .returning();
    
    return updated;
  }

  // Competencies Management
  async createCompetency(data: InsertReviewCompetency): Promise<ReviewCompetency> {
    const [competency] = await db
      .insert(reviewCompetencies)
      .values(data)
      .returning();
    
    return competency;
  }

  async getActiveCompetencies(): Promise<ReviewCompetency[]> {
    return await db
      .select()
      .from(reviewCompetencies)
      .where(eq(reviewCompetencies.isActive, true))
      .orderBy(reviewCompetencies.category, reviewCompetencies.competencyName);
  }

  // Review Responses Management
  async submitReviewResponse(data: InsertReviewResponse): Promise<ReviewResponse> {
    const [response] = await db
      .insert(reviewResponses)
      .values(data)
      .returning();

    // Update participant status to completed
    await this.updateParticipantStatus(data.participantId, data.reviewId, "completed");

    // Check if this completes the review and award karma
    await this.checkReviewCompletion(data.reviewId);
    
    return response;
  }

  async getReviewResponses(reviewId: string): Promise<any[]> {
    return await db
      .select({
        response: reviewResponses,
        competency: reviewCompetencies,
        participant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        }
      })
      .from(reviewResponses)
      .innerJoin(reviewCompetencies, eq(reviewResponses.competencyId, reviewCompetencies.id))
      .innerJoin(users, eq(reviewResponses.participantId, users.id))
      .where(eq(reviewResponses.reviewId, reviewId))
      .orderBy(reviewCompetencies.category, reviewCompetencies.competencyName);
  }

  async getUserReviewResponses(participantId: string, reviewId: string): Promise<ReviewResponse[]> {
    return await db
      .select()
      .from(reviewResponses)
      .where(and(
        eq(reviewResponses.participantId, participantId),
        eq(reviewResponses.reviewId, reviewId)
      ));
  }

  // Goals Management
  async createReviewGoal(data: InsertReviewGoal): Promise<ReviewGoal> {
    const [goal] = await db
      .insert(reviewGoals)
      .values(data)
      .returning();
    
    return goal;
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<ReviewGoal> {
    const [updated] = await db
      .update(reviewGoals)
      .set({ 
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
        updatedAt: new Date()
      })
      .where(eq(reviewGoals.id, goalId))
      .returning();

    // Award karma if goal is completed
    if (progress >= 100 && updated.karmaReward > 0) {
      const review = await db
        .select()
        .from(performanceReviews)
        .where(eq(performanceReviews.id, updated.reviewId));

      if (review[0]) {
        // TODO: Award karma coins when karma system is fully integrated
        console.log(`Goal completed: ${updated.goalTitle} - ${updated.karmaReward} karma coins earned`);
      }
    }
    
    return updated;
  }

  async getReviewGoals(reviewId: string): Promise<ReviewGoal[]> {
    return await db
      .select()
      .from(reviewGoals)
      .where(eq(reviewGoals.reviewId, reviewId))
      .orderBy(reviewGoals.priority, reviewGoals.createdAt);
  }

  // Analytics and Reporting
  async generateReviewAnalytics(cycleId: string, userId: string): Promise<ReviewAnalytics> {
    const responses = await db
      .select({
        rating: reviewResponses.rating,
        competencyId: reviewResponses.competencyId,
        competencyName: reviewCompetencies.competencyName,
        category: reviewCompetencies.category
      })
      .from(reviewResponses)
      .innerJoin(performanceReviews, eq(reviewResponses.reviewId, performanceReviews.id))
      .innerJoin(reviewCompetencies, eq(reviewResponses.competencyId, reviewCompetencies.id))
      .where(and(
        eq(performanceReviews.cycleId, cycleId),
        eq(performanceReviews.revieweeId, userId)
      ));

    const averageRating = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length 
      : 0;

    const ratingDistribution = responses.reduce((acc, r) => {
      acc[r.category] = acc[r.category] || [];
      acc[r.category].push(r.rating);
      return acc;
    }, {} as any);

    const goals = await db
      .select()
      .from(reviewGoals)
      .innerJoin(performanceReviews, eq(reviewGoals.reviewId, performanceReviews.id))
      .where(and(
        eq(performanceReviews.cycleId, cycleId),
        eq(performanceReviews.revieweeId, userId)
      ));

    const completedGoals = goals.filter(g => g.review_goals.status === "completed").length;
    const goalCompletionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

    const analyticsData: InsertReviewAnalytics = {
      cycleId,
      userId,
      averageRating: averageRating.toFixed(2),
      ratingDistribution,
      peerFeedbackCount: responses.length,
      goalCompletionRate: goalCompletionRate.toFixed(2),
      actionItemsCreated: goals.length,
      actionItemsCompleted: completedGoals,
      engagementScore: (averageRating * 20).toFixed(2) // Convert to 0-100 scale
    };

    const [analytics] = await db
      .insert(reviewAnalytics)
      .values(analyticsData)
      .onConflictDoUpdate({
        target: [reviewAnalytics.cycleId, reviewAnalytics.userId],
        set: analyticsData
      })
      .returning();

    return analytics;
  }

  async getReviewStats(cycleId?: string): Promise<ReviewStats> {
    const query = db
      .select()
      .from(performanceReviews);

    if (cycleId) {
      query.where(eq(performanceReviews.cycleId, cycleId));
    }

    const reviews = await query;
    const completed = reviews.filter(r => r.status === "completed");
    const pending = reviews.filter(r => r.status === "in_progress" || r.status === "not_started");

    const avgRating = completed.length > 0 
      ? completed.reduce((sum, r) => sum + (Number(r.overallRating) || 0), 0) / completed.length 
      : 0;

    return {
      totalReviews: reviews.length,
      completedReviews: completed.length,
      pendingReviews: pending.length,
      averageRating: Number(avgRating.toFixed(2)),
      participationRate: reviews.length > 0 ? (completed.length / reviews.length) * 100 : 0,
      onTimeCompletion: 85 // Mock data - would calculate based on deadlines
    };
  }

  async getCompetencyAnalysis(cycleId: string): Promise<CompetencyAnalysis[]> {
    const competencyRatings = await db
      .select({
        competencyId: reviewCompetencies.id,
        competencyName: reviewCompetencies.competencyName,
        rating: reviewResponses.rating
      })
      .from(reviewResponses)
      .innerJoin(performanceReviews, eq(reviewResponses.reviewId, performanceReviews.id))
      .innerJoin(reviewCompetencies, eq(reviewResponses.competencyId, reviewCompetencies.id))
      .where(eq(performanceReviews.cycleId, cycleId));

    const analysis = competencyRatings.reduce((acc, item) => {
      const key = item.competencyId;
      if (!acc[key]) {
        acc[key] = {
          competencyId: item.competencyId,
          competencyName: item.competencyName,
          ratings: [],
          averageRating: 0,
          ratingCount: 0,
          trend: "stable" as const
        };
      }
      acc[key].ratings.push(item.rating);
      return acc;
    }, {} as any);

    return Object.values(analysis).map((comp: any) => ({
      competencyId: comp.competencyId,
      competencyName: comp.competencyName,
      averageRating: Number((comp.ratings.reduce((a: number, b: number) => a + b, 0) / comp.ratings.length).toFixed(2)),
      ratingCount: comp.ratings.length,
      trend: comp.trend
    }));
  }

  // Helper Methods
  private async checkReviewCompletion(reviewId: string): Promise<void> {
    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.id, reviewId));

    if (!review) return;

    const participants = await db
      .select()
      .from(reviewParticipants)
      .where(eq(reviewParticipants.reviewId, reviewId));

    const completed = participants.filter(p => p.status === "completed");
    const progressPercentage = participants.length > 0 ? Math.round((completed.length / participants.length) * 100) : 0;

    const isCompleted = progressPercentage === 100;

    await db
      .update(performanceReviews)
      .set({
        progressPercentage,
        status: isCompleted ? "completed" : "in_progress",
        submittedAt: isCompleted ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(performanceReviews.id, reviewId));

    // Award karma coins for completing the review
    if (isCompleted && review.karmaEarned === 0) {
      const cycle = await this.getReviewCycle(review.cycleId);
      const karmaReward = cycle?.karmaReward || 100;

      // TODO: Award karma coins when karma system is fully integrated
      console.log(`Review completed: ${karmaReward} karma coins earned`);

      await db
        .update(performanceReviews)
        .set({ karmaEarned: karmaReward })
        .where(eq(performanceReviews.id, reviewId));
    }
  }

  private async awardKarmaCoins(userId: string, amount: number, type: string, metadata: any): Promise<void> {
    // TODO: Implement karma coins when karma system is fully integrated
    console.log(`Would award ${amount} karma coins to user ${userId} for ${type}`, metadata);
  }

  // Initialization method for default competencies
  async initializeDefaultCompetencies(): Promise<void> {
    const defaultCompetencies = [
      {
        competencyName: "Technical Skills",
        category: "technical",
        description: "Demonstrates proficiency in job-related technical skills and knowledge",
        behaviorIndicators: [
          "Applies technical knowledge effectively",
          "Stays current with industry trends",
          "Solves technical problems efficiently"
        ]
      },
      {
        competencyName: "Communication",
        category: "communication",
        description: "Communicates clearly and effectively with all stakeholders",
        behaviorIndicators: [
          "Listens actively and responds appropriately",
          "Presents information clearly and concisely",
          "Adapts communication style to audience"
        ]
      },
      {
        competencyName: "Leadership",
        category: "leadership",
        description: "Demonstrates leadership qualities and inspires others",
        behaviorIndicators: [
          "Takes initiative and drives results",
          "Mentors and develops team members",
          "Makes sound decisions under pressure"
        ]
      },
      {
        competencyName: "Teamwork",
        category: "teamwork",
        description: "Works collaboratively and contributes to team success",
        behaviorIndicators: [
          "Collaborates effectively with colleagues",
          "Supports team goals and objectives",
          "Resolves conflicts constructively"
        ]
      },
      {
        competencyName: "Problem Solving",
        category: "problem_solving",
        description: "Identifies problems and develops effective solutions",
        behaviorIndicators: [
          "Analyzes situations thoroughly",
          "Develops creative solutions",
          "Implements solutions effectively"
        ]
      },
      {
        competencyName: "Customer Focus",
        category: "customer_focus",
        description: "Prioritizes customer needs and delivers excellent service",
        behaviorIndicators: [
          "Understands customer requirements",
          "Responds promptly to customer needs",
          "Exceeds customer expectations"
        ]
      }
    ];

    for (const comp of defaultCompetencies) {
      try {
        await db.insert(reviewCompetencies).values(comp as any).onConflictDoNothing();
      } catch (error) {
        // Ignore conflicts - competency already exists
      }
    }
  }
}

export const performanceReviewService = new PerformanceReviewService();