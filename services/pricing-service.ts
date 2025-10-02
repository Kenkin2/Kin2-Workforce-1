import { db } from "../db";
import { 
  pricingPlans, 
  organizationSubscriptions, 
  usageMetrics, 
  pricingRules, 
  billingHistory,
  organizations,
  users,
  type PricingPlan,
  type OrganizationSubscription,
  type UsageMetric,
  type PricingRule,
  type InsertPricingPlan,
  type InsertOrganizationSubscription,
  type InsertUsageMetric,
  type InsertBillingHistory
} from "@shared/schema";
import { eq, and, gte, lte, desc, sum, count } from "drizzle-orm";
import { paymentProcessor } from "../payments";

interface PricingCalculation {
  basePrice: number;
  discount: number;
  finalPrice: number;
  appliedRules: string[];
}

interface BillingMetrics {
  totalRevenue: number;
  activeSubscriptions: number;
  averageEmployeeCount: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
}

class PricingService {
  // Create default pricing plans
  async initializeDefaultPlans() {
    try {
      const existingPlans = await db.select().from(pricingPlans).limit(1);
      if (existingPlans.length > 0) {
        return; // Plans already exist
      }

      const defaultPlans: InsertPricingPlan[] = [
        {
          name: "Starter",
          description: "Perfect for small teams getting started",
          basePrice: "12.99",
          setupFee: "0",
          features: JSON.stringify([
            { name: "Time Tracking", included: true },
            { name: "Basic Scheduling", included: true },
            { name: "Employee Management", included: true },
            { name: "Basic Reports", included: true },
            { name: "Email Support", included: true },
            { name: "Advanced Analytics", included: false },
            { name: "API Access", included: false },
            { name: "Custom Integrations", included: false }
          ]),
          maxEmployees: 25,
          billingCycle: "monthly",
          discountPercent: "0",
          sortOrder: 1
        },
        {
          name: "Professional",
          description: "Advanced features for growing businesses",
          basePrice: "24.99",
          setupFee: "99",
          features: JSON.stringify([
            { name: "Time Tracking", included: true },
            { name: "Advanced Scheduling", included: true },
            { name: "Employee Management", included: true },
            { name: "Advanced Reports", included: true },
            { name: "Priority Support", included: true },
            { name: "Advanced Analytics", included: true },
            { name: "API Access", included: true },
            { name: "Payroll Integration", included: true },
            { name: "Custom Integrations", included: false }
          ]),
          maxEmployees: 250,
          billingCycle: "monthly",
          discountPercent: "10",
          sortOrder: 2
        },
        {
          name: "Enterprise",
          description: "Complete solution for large organizations",
          basePrice: "34.99",
          setupFee: "499",
          features: JSON.stringify([
            { name: "Everything in Professional", included: true },
            { name: "Custom Integrations", included: true },
            { name: "Dedicated Support", included: true },
            { name: "Advanced Security", included: true },
            { name: "Custom Branding", included: true },
            { name: "SLA Guarantee", included: true },
            { name: "Training & Onboarding", included: true },
            { name: "Data Migration", included: true }
          ]),
          maxEmployees: null,
          billingCycle: "monthly",
          discountPercent: "15",
          sortOrder: 3
        }
      ];

      for (const plan of defaultPlans) {
        await db.insert(pricingPlans).values(plan);
      }

      console.log("✅ Default pricing plans initialized");
    } catch (error) {
      console.error("❌ Failed to initialize pricing plans:", error);
      throw error;
    }
  }

  // Calculate dynamic pricing based on rules
  async calculatePrice(planId: string, employeeCount: number, organizationId?: string): Promise<PricingCalculation> {
    try {
      // Get the base plan
      const [plan] = await db
        .select()
        .from(pricingPlans)
        .where(eq(pricingPlans.id, planId));

      if (!plan) {
        throw new Error("Pricing plan not found");
      }

      let basePrice = parseFloat(plan.basePrice);
      let discount = 0;
      const appliedRules: string[] = [];

      // Get active pricing rules for this plan
      const rules = await db
        .select()
        .from(pricingRules)
        .where(and(
          eq(pricingRules.planId, planId),
          eq(pricingRules.isActive, true)
        ))
        .orderBy(desc(pricingRules.priority));

      // Apply pricing rules
      for (const rule of rules) {
        const condition = rule.condition as any;
        const action = rule.action as any;

        let ruleApplies = false;

        // Check condition
        switch (condition.type) {
          case "employee_count":
            ruleApplies = this.evaluateCondition(employeeCount, condition.operator, condition.value);
            break;
          case "organization_age":
            if (organizationId) {
              const orgAge = await this.getOrganizationAge(organizationId);
              ruleApplies = this.evaluateCondition(orgAge, condition.operator, condition.value);
            }
            break;
          case "subscription_duration":
            if (organizationId) {
              const subDuration = await this.getSubscriptionDuration(organizationId);
              ruleApplies = this.evaluateCondition(subDuration, condition.operator, condition.value);
            }
            break;
        }

        // Apply action if condition is met
        if (ruleApplies) {
          switch (action.type) {
            case "discount":
              discount += action.value;
              appliedRules.push(`${rule.ruleName}: ${action.value}% discount`);
              break;
            case "price_override":
              basePrice = action.value;
              appliedRules.push(`${rule.ruleName}: Price set to £${action.value}`);
              break;
            case "volume_discount":
              const volumeDiscount = Math.min(action.maxDiscount || 50, employeeCount * action.perEmployeeDiscount);
              discount += volumeDiscount;
              appliedRules.push(`${rule.ruleName}: ${volumeDiscount}% volume discount`);
              break;
          }
        }
      }

      // Apply base discount from plan
      discount += parseFloat(plan.discountPercent);

      // Calculate final price
      const discountAmount = (basePrice * discount) / 100;
      const finalPrice = Math.max(0, basePrice - discountAmount);

      return {
        basePrice,
        discount,
        finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
        appliedRules
      };
    } catch (error) {
      console.error("❌ Price calculation failed:", error);
      throw error;
    }
  }

  // Track usage metrics for billing
  async recordUsage(organizationId: string, metricType: "active_employees" | "time_entries" | "reports_generated" | "api_calls" | "storage_gb", value: number) {
    try {
      const billingPeriod = new Date().toISOString().slice(0, 7); // "2025-01"
      
      // Get subscription
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active")
        ));

      if (!subscription) {
        console.warn(`⚠️ No active subscription found for org ${organizationId}`);
        return;
      }

      // Record the usage metric
      await db.insert(usageMetrics).values({
        organizationId,
        subscriptionId: subscription.id,
        metricType,
        metricValue: value.toString(),
        billingPeriod
      });

      console.log(`📊 Usage recorded: ${metricType} = ${value} for org ${organizationId}`);
    } catch (error) {
      console.error("❌ Failed to record usage:", error);
    }
  }

  // Get organization usage for current billing period
  async getOrganizationUsage(organizationId: string, billingPeriod?: string): Promise<Record<string, number>> {
    try {
      const period = billingPeriod || new Date().toISOString().slice(0, 7);
      
      const metrics = await db
        .select()
        .from(usageMetrics)
        .where(and(
          eq(usageMetrics.organizationId, organizationId),
          eq(usageMetrics.billingPeriod, period)
        ));

      const usage: Record<string, number> = {};
      for (const metric of metrics) {
        usage[metric.metricType] = parseFloat(metric.metricValue);
      }

      return usage;
    } catch (error) {
      console.error("❌ Failed to get usage:", error);
      return {};
    }
  }

  // Automated billing process
  async processBilling(organizationId: string): Promise<void> {
    try {
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .innerJoin(pricingPlans, eq(organizationSubscriptions.planId, pricingPlans.id))
        .where(and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active")
        ));

      if (!subscription) {
        throw new Error("No active subscription found");
      }

      const billingPeriod = new Date().toISOString().slice(0, 7);
      const usage = await this.getOrganizationUsage(organizationId, billingPeriod);
      const employeeCount = usage.active_employees || subscription.organization_subscriptions.employeeCount;

      // Calculate pricing
      const pricing = await this.calculatePrice(
        subscription.organization_subscriptions.planId,
        employeeCount,
        organizationId
      );

      // Create billing record
      const billingRecord: InsertBillingHistory = {
        organizationId,
        subscriptionId: subscription.organization_subscriptions.id,
        planId: subscription.organization_subscriptions.planId,
        billingPeriod,
        employeeCount,
        baseAmount: (pricing.basePrice * employeeCount).toString(),
        discountAmount: ((pricing.basePrice * employeeCount * pricing.discount) / 100).toString(),
        taxAmount: "0", // Will be calculated based on organization location
        totalAmount: (pricing.finalPrice * employeeCount).toString(),
        status: "pending"
      };

      await db.insert(billingHistory).values(billingRecord);

      // Update subscription with next bill date
      const nextBillDate = new Date();
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);
      
      await db
        .update(organizationSubscriptions)
        .set({
          lastBilledAt: new Date(),
          nextBillDate,
          employeeCount
        })
        .where(eq(organizationSubscriptions.id, subscription.organization_subscriptions.id));

      console.log(`💰 Billing processed for org ${organizationId}: £${pricing.finalPrice * employeeCount}`);
    } catch (error) {
      console.error("❌ Billing processing failed:", error);
      throw error;
    }
  }

  // Get billing metrics for dashboard
  async getBillingMetrics(): Promise<BillingMetrics> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);

      // Get total revenue
      const [revenueResult] = await db
        .select({ total: sum(billingHistory.totalAmount) })
        .from(billingHistory)
        .where(eq(billingHistory.status, "paid"));

      // Get active subscriptions
      const [activeSubsResult] = await db
        .select({ count: count() })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.status, "active"));

      // Get average employee count
      const [avgEmployeesResult] = await db
        .select({ 
          avgEmployees: sum(organizationSubscriptions.employeeCount),
          totalOrgs: count()
        })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.status, "active"));

      // Calculate churn rate (simplified)
      const [currentMonthSubs] = await db
        .select({ count: count() })
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.status, "active"),
          gte(organizationSubscriptions.createdAt, new Date(currentMonth + "-01"))
        ));

      const [lastMonthSubs] = await db
        .select({ count: count() })
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.status, "cancelled"),
          gte(organizationSubscriptions.updatedAt, new Date(lastMonthStr + "-01"))
        ));

      const churnRate = lastMonthSubs.count > 0 
        ? (lastMonthSubs.count / (currentMonthSubs.count + lastMonthSubs.count)) * 100 
        : 0;

      // Calculate MRR
      const [mrrResult] = await db
        .select({ 
          totalMrr: sum(billingHistory.totalAmount)
        })
        .from(billingHistory)
        .where(and(
          eq(billingHistory.billingPeriod, currentMonth),
          eq(billingHistory.status, "paid")
        ));

      return {
        totalRevenue: parseFloat(revenueResult.total || "0"),
        activeSubscriptions: activeSubsResult.count,
        averageEmployeeCount: avgEmployeesResult.totalOrgs > 0 
          ? parseFloat(avgEmployeesResult.avgEmployees || "0") / avgEmployeesResult.totalOrgs 
          : 0,
        churnRate,
        monthlyRecurringRevenue: parseFloat(mrrResult.totalMrr || "0")
      };
    } catch (error) {
      console.error("❌ Failed to get billing metrics:", error);
      return {
        totalRevenue: 0,
        activeSubscriptions: 0,
        averageEmployeeCount: 0,
        churnRate: 0,
        monthlyRecurringRevenue: 0
      };
    }
  }

  // Automated subscription creation
  async createOrganizationSubscription(organizationId: string, planId: string, employeeCount: number = 1): Promise<OrganizationSubscription> {
    try {
      // Get organization details
      const [organization] = await db
        .select()
        .from(organizations)
        .innerJoin(users, eq(organizations.ownerId, users.id))
        .where(eq(organizations.id, organizationId));

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Calculate pricing
      const pricing = await this.calculatePrice(planId, employeeCount, organizationId);

      // Create Stripe subscription
      const stripeResult = await paymentProcessor.createOrUpdateSubscription({
        userId: organization.users.id,
        email: organization.users.email!,
        priceId: undefined, // Will create dynamic pricing
        trialDays: 14
      });

      // Set trial period
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const subscriptionData: InsertOrganizationSubscription = {
        organizationId,
        planId,
        stripeSubscriptionId: stripeResult.subscriptionId,
        stripeCustomerId: organization.users.stripeCustomerId || undefined,
        status: "trial",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
        employeeCount,
        monthlyUsage: JSON.stringify({}),
        nextBillDate: trialEnd,
        autoRenewal: true
      };

      const [newSubscription] = await db
        .insert(organizationSubscriptions)
        .values(subscriptionData)
        .returning();

      console.log(`🎯 Subscription created for org ${organizationId}: ${pricing.finalPrice} per employee`);
      return newSubscription;
    } catch (error) {
      console.error("❌ Failed to create subscription:", error);
      throw error;
    }
  }

  // Update employee count and trigger billing recalculation
  async updateEmployeeCount(organizationId: string, newEmployeeCount: number): Promise<void> {
    try {
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active")
        ));

      if (!subscription) {
        throw new Error("No active subscription found");
      }

      // Update subscription
      await db
        .update(organizationSubscriptions)
        .set({ 
          employeeCount: newEmployeeCount,
          updatedAt: new Date()
        })
        .where(eq(organizationSubscriptions.id, subscription.id));

      // Record usage metric
      await this.recordUsage(organizationId, "active_employees", newEmployeeCount);

      // If employee count increased significantly, trigger immediate billing adjustment
      if (newEmployeeCount > subscription.employeeCount * 1.2) {
        await this.processBilling(organizationId);
      }

      console.log(`👥 Employee count updated for org ${organizationId}: ${newEmployeeCount}`);
    } catch (error) {
      console.error("❌ Failed to update employee count:", error);
      throw error;
    }
  }

  // Helper methods
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case ">=": return value >= threshold;
      case "<=": return value <= threshold;
      case ">": return value > threshold;
      case "<": return value < threshold;
      case "==": return value === threshold;
      default: return false;
    }
  }

  private async getOrganizationAge(organizationId: string): Promise<number> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    
    if (!org) return 0;
    
    const ageMs = Date.now() - org.createdAt!.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // days
  }

  private async getSubscriptionDuration(organizationId: string): Promise<number> {
    const [subscription] = await db
      .select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, organizationId));
    
    if (!subscription) return 0;
    
    const durationMs = Date.now() - subscription.createdAt!.getTime();
    return Math.floor(durationMs / (1000 * 60 * 60 * 24)); // days
  }

  // Get all active pricing plans
  async getActivePlans(): Promise<PricingPlan[]> {
    return await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.isActive, true))
      .orderBy(pricingPlans.sortOrder);
  }

  // Get organization's current subscription
  async getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription | null> {
    const [subscription] = await db
      .select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, organizationId));

    return subscription || null;
  }

  // Automated pricing rule creation
  async createVolumeDiscountRule(planId: string): Promise<void> {
    const volumeRules = [
      {
        ruleName: "Volume Discount 50-99 employees",
        condition: { type: "employee_count", operator: ">=", value: 50 },
        action: { type: "discount", value: 5 },
        priority: 10
      },
      {
        ruleName: "Volume Discount 100-249 employees", 
        condition: { type: "employee_count", operator: ">=", value: 100 },
        action: { type: "discount", value: 10 },
        priority: 20
      },
      {
        ruleName: "Volume Discount 250+ employees",
        condition: { type: "employee_count", operator: ">=", value: 250 },
        action: { type: "discount", value: 20 },
        priority: 30
      }
    ];

    for (const rule of volumeRules) {
      await db.insert(pricingRules).values({
        planId,
        ...rule,
        condition: JSON.stringify(rule.condition),
        action: JSON.stringify(rule.action)
      });
    }

    console.log(`📏 Volume discount rules created for plan ${planId}`);
  }
}

export const pricingService = new PricingService();