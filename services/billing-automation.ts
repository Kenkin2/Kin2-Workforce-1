import { db } from "../db";
import { 
  organizationSubscriptions, 
  billingHistory, 
  usageMetrics,
  pricingPlans,
  organizations,
  users,
  type OrganizationSubscription,
  type BillingHistory
} from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { pricingService } from "./pricing-service";
import { paymentProcessor } from "../payments";
import Stripe from "stripe";

interface BillingCycle {
  organizationId: string;
  subscriptionId: string;
  planId: string;
  employeeCount: number;
  billingDate: Date;
  amount: number;
}

class BillingAutomationService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  // Start automated billing process
  startAutomation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🤖 Starting automated billing service...");

    // Run billing check every hour
    this.intervalId = setInterval(async () => {
      await this.processDueBilling();
    }, 60 * 60 * 1000); // 1 hour

    // Also run once immediately
    setTimeout(() => this.processDueBilling(), 5000);
  }

  // Stop automated billing process
  stopAutomation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("⏹️ Stopped automated billing service");
  }

  // Process all due billing cycles
  async processDueBilling(): Promise<void> {
    try {
      console.log("🔄 Checking for due billing cycles...");
      
      const now = new Date();
      const dueBilling = await this.getDueBillingCycles(now);
      
      console.log(`📋 Found ${dueBilling.length} billing cycles due for processing`);

      for (const billing of dueBilling) {
        try {
          await this.processBillingCycle(billing);
        } catch (error) {
          console.error(`❌ Failed to process billing for org ${billing.organizationId}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Automated billing check failed:", error);
    }
  }

  // Get billing cycles that are due
  private async getDueBillingCycles(now: Date): Promise<BillingCycle[]> {
    const subscriptions = await db
      .select({
        organizationId: organizationSubscriptions.organizationId,
        subscriptionId: organizationSubscriptions.id,
        planId: organizationSubscriptions.planId,
        employeeCount: organizationSubscriptions.employeeCount,
        nextBillDate: organizationSubscriptions.nextBillDate,
        basePrice: pricingPlans.basePrice
      })
      .from(organizationSubscriptions)
      .innerJoin(pricingPlans, eq(organizationSubscriptions.planId, pricingPlans.id))
      .where(and(
        eq(organizationSubscriptions.status, "active"),
        eq(organizationSubscriptions.autoRenewal, true),
        lte(organizationSubscriptions.nextBillDate, now)
      ));

    return subscriptions.map(sub => ({
      organizationId: sub.organizationId,
      subscriptionId: sub.subscriptionId,
      planId: sub.planId,
      employeeCount: sub.employeeCount,
      billingDate: sub.nextBillDate!,
      amount: parseFloat(sub.basePrice) * sub.employeeCount
    }));
  }

  // Process individual billing cycle
  private async processBillingCycle(billing: BillingCycle): Promise<void> {
    try {
      console.log(`💰 Processing billing for org ${billing.organizationId} - £${billing.amount}`);

      // Calculate current usage and pricing
      const billingPeriod = new Date().toISOString().slice(0, 7);
      const usage = await pricingService.getOrganizationUsage(billing.organizationId, billingPeriod);
      
      // Update employee count if usage data is available
      const currentEmployeeCount = usage.active_employees || billing.employeeCount;
      
      // Calculate dynamic pricing
      const pricing = await pricingService.calculatePrice(
        billing.planId,
        currentEmployeeCount,
        billing.organizationId
      );

      const totalAmount = pricing.finalPrice * currentEmployeeCount;
      const taxAmount = totalAmount * 0.2; // 20% VAT for UK

      // Create billing record
      const billingRecord = {
        organizationId: billing.organizationId,
        subscriptionId: billing.subscriptionId,
        planId: billing.planId,
        billingPeriod,
        employeeCount: currentEmployeeCount,
        baseAmount: (pricing.basePrice * currentEmployeeCount).toString(),
        discountAmount: ((pricing.basePrice * currentEmployeeCount * pricing.discount) / 100).toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: (totalAmount + taxAmount).toString(),
        status: "pending" as const
      };

      const [newBilling] = await db
        .insert(billingHistory)
        .values(billingRecord)
        .returning();

      // Create Stripe invoice
      await this.createStripeInvoice(billing.organizationId, newBilling, totalAmount + taxAmount);

      // Update subscription for next billing cycle
      const nextBillDate = new Date(billing.billingDate);
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);

      await db
        .update(organizationSubscriptions)
        .set({
          lastBilledAt: new Date(),
          nextBillDate,
          employeeCount: currentEmployeeCount,
          updatedAt: new Date()
        })
        .where(eq(organizationSubscriptions.id, billing.subscriptionId));

      console.log(`✅ Billing cycle completed for org ${billing.organizationId}`);
    } catch (error) {
      console.error(`❌ Billing cycle failed for org ${billing.organizationId}:`, error);
      throw error;
    }
  }

  // Create Stripe invoice for billing
  private async createStripeInvoice(organizationId: string, billingRecord: BillingHistory, amount: number): Promise<void> {
    try {
      // Get organization and customer details
      const [orgData] = await db
        .select({
          orgName: organizations.name,
          customerEmail: users.email,
          stripeCustomerId: users.stripeCustomerId
        })
        .from(organizations)
        .innerJoin(users, eq(organizations.ownerId, users.id))
        .where(eq(organizations.id, organizationId));

      if (!orgData?.stripeCustomerId) {
        throw new Error("No Stripe customer ID found");
      }

      // Create invoice item
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-08-27.basil",
      });

      await stripe.invoiceItems.create({
        customer: orgData.stripeCustomerId,
        amount: Math.round(amount * 100), // Convert to pence
        currency: "gbp",
        description: `Kin2 Workforce - Billing Period ${billingRecord.billingPeriod}`,
        metadata: {
          organizationId,
          billingRecordId: billingRecord.id,
          employeeCount: billingRecord.employeeCount.toString(),
          platform: "kin2_workforce"
        }
      });

      // Create and send invoice
      const invoice = await stripe.invoices.create({
        customer: orgData.stripeCustomerId,
        auto_advance: true, // Automatically attempt payment
        collection_method: "charge_automatically",
        description: `Monthly billing for ${orgData.orgName}`,
        metadata: {
          organizationId,
          billingRecordId: billingRecord.id
        }
      });

      // Send invoice if ID exists
      if (invoice.id) {
        try {
          await stripe.invoices.sendInvoice(invoice.id);
          console.log(`📧 Invoice created and sent: ${invoice.id} for org ${organizationId}`);
        } catch (sendError: any) {
          console.error(`❌ Failed to send invoice ${invoice.id}:`, sendError.message);
          // Invoice created but not sent - log and continue
        }
      }

      // Update billing record with Stripe invoice ID
      await db
        .update(billingHistory)
        .set({ stripeInvoiceId: invoice.id })
        .where(eq(billingHistory.id, billingRecord.id));
    } catch (error) {
      console.error("❌ Failed to create Stripe invoice:", error);
      throw error;
    }
  }

  // Handle trial-to-paid conversion
  async convertTrialSubscription(organizationId: string): Promise<void> {
    try {
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "trial")
        ));

      if (!subscription) {
        throw new Error("No trial subscription found");
      }

      // Check if trial has ended
      const now = new Date();
      if (!subscription.trialEnd || now < subscription.trialEnd) {
        console.log(`⏰ Trial for org ${organizationId} has not ended yet`);
        return;
      }

      // Convert to active subscription
      await db
        .update(organizationSubscriptions)
        .set({
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          updatedAt: now
        })
        .where(eq(organizationSubscriptions.id, subscription.id));

      // Process first billing
      await pricingService.processBilling(organizationId);

      console.log(`🎉 Trial converted to paid subscription for org ${organizationId}`);
    } catch (error) {
      console.error("❌ Trial conversion failed:", error);
      throw error;
    }
  }

  // Usage-based billing adjustments
  async adjustBillingForUsage(organizationId: string): Promise<void> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const usage = await pricingService.getOrganizationUsage(organizationId, currentPeriod);

      // Get current subscription
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.organizationId, organizationId),
          eq(organizationSubscriptions.status, "active")
        ));

      if (!subscription) return;

      // Check if employee count changed significantly
      const currentEmployees = usage.active_employees || subscription.employeeCount;
      const changePercent = Math.abs(currentEmployees - subscription.employeeCount) / subscription.employeeCount;

      // If employee count changed by more than 20%, create prorated billing
      if (changePercent > 0.2) {
        await this.createProratedBilling(organizationId, subscription, currentEmployees);
      }

      // Check for overage charges (API calls, storage, etc.)
      await this.calculateOverageCharges(organizationId, usage);

    } catch (error) {
      console.error("❌ Usage adjustment failed:", error);
    }
  }

  // Create prorated billing for mid-cycle changes
  private async createProratedBilling(
    organizationId: string, 
    subscription: OrganizationSubscription, 
    newEmployeeCount: number
  ): Promise<void> {
    try {
      const pricing = await pricingService.calculatePrice(subscription.planId, newEmployeeCount, organizationId);
      const oldPricing = await pricingService.calculatePrice(subscription.planId, subscription.employeeCount, organizationId);
      
      // Calculate prorated amount
      const daysInMonth = new Date().getDate();
      const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - daysInMonth;
      const prorateRatio = daysRemaining / 30;
      
      const priceDifference = (pricing.finalPrice - oldPricing.finalPrice) * newEmployeeCount;
      const proratedAmount = priceDifference * prorateRatio;

      if (Math.abs(proratedAmount) > 1) { // Only bill if difference is more than £1
        const billingRecord = {
          organizationId,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          billingPeriod: new Date().toISOString().slice(0, 7),
          employeeCount: newEmployeeCount,
          baseAmount: proratedAmount.toString(),
          discountAmount: "0",
          taxAmount: (proratedAmount * 0.2).toString(),
          totalAmount: (proratedAmount * 1.2).toString(),
          status: "pending" as const
        };

        await db.insert(billingHistory).values(billingRecord);
        console.log(`📊 Prorated billing created: £${proratedAmount} for org ${organizationId}`);
      }
    } catch (error) {
      console.error("❌ Prorated billing failed:", error);
    }
  }

  // Calculate overage charges for usage-based features
  private async calculateOverageCharges(organizationId: string, usage: Record<string, number>): Promise<void> {
    try {
      const overageRates = {
        api_calls: { limit: 10000, rate: 0.001 }, // £0.001 per call over 10k
        storage_gb: { limit: 10, rate: 1.99 }, // £1.99 per GB over 10GB
        reports_generated: { limit: 100, rate: 0.50 } // £0.50 per report over 100
      };

      let totalOverage = 0;
      const overageDetails: string[] = [];

      for (const [metric, value] of Object.entries(usage)) {
        const rate = overageRates[metric as keyof typeof overageRates];
        if (rate && value > rate.limit) {
          const overage = (value - rate.limit) * rate.rate;
          totalOverage += overage;
          overageDetails.push(`${metric}: £${overage.toFixed(2)}`);
        }
      }

      if (totalOverage > 5) { // Only bill if overage is more than £5
        const billingRecord = {
          organizationId,
          subscriptionId: "",
          planId: "",
          billingPeriod: new Date().toISOString().slice(0, 7),
          employeeCount: 0,
          baseAmount: totalOverage.toString(),
          discountAmount: "0",
          taxAmount: (totalOverage * 0.2).toString(),
          totalAmount: (totalOverage * 1.2).toString(),
          status: "pending" as const
        };

        await db.insert(billingHistory).values(billingRecord);
        console.log(`⚡ Overage charges created: £${totalOverage} for org ${organizationId}`);
      }
    } catch (error) {
      console.error("❌ Overage calculation failed:", error);
    }
  }

  // Automated subscription management
  async manageSubscriptionStatus(): Promise<void> {
    try {
      console.log("🔄 Managing subscription statuses...");

      // Handle trial expirations
      await this.handleTrialExpirations();
      
      // Handle failed payments
      await this.handleFailedPayments();
      
      // Handle subscription renewals
      await this.handleSubscriptionRenewals();

    } catch (error) {
      console.error("❌ Subscription management failed:", error);
    }
  }

  private async handleTrialExpirations(): Promise<void> {
    const now = new Date();
    
    const expiredTrials = await db
      .select()
      .from(organizationSubscriptions)
      .where(and(
        eq(organizationSubscriptions.status, "trial"),
        lte(organizationSubscriptions.trialEnd, now)
      ));

    for (const trial of expiredTrials) {
      try {
        await this.convertTrialSubscription(trial.organizationId);
      } catch (error) {
        console.error(`❌ Failed to convert trial for org ${trial.organizationId}:`, error);
      }
    }
  }

  private async handleFailedPayments(): Promise<void> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pastDueSubscriptions = await db
      .select()
      .from(organizationSubscriptions)
      .where(and(
        eq(organizationSubscriptions.status, "past_due"),
        lte(organizationSubscriptions.nextBillDate, threeDaysAgo)
      ));

    for (const subscription of pastDueSubscriptions) {
      try {
        // Suspend subscription after 3 days of failed payment
        await db
          .update(organizationSubscriptions)
          .set({ 
            status: "unpaid",
            updatedAt: new Date()
          })
          .where(eq(organizationSubscriptions.id, subscription.id));

        console.log(`⚠️ Subscription suspended for org ${subscription.organizationId} due to failed payment`);
      } catch (error) {
        console.error(`❌ Failed to suspend subscription for org ${subscription.organizationId}:`, error);
      }
    }
  }

  private async handleSubscriptionRenewals(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const renewingSubscriptions = await db
      .select()
      .from(organizationSubscriptions)
      .where(and(
        eq(organizationSubscriptions.status, "active"),
        eq(organizationSubscriptions.autoRenewal, true),
        lte(organizationSubscriptions.currentPeriodEnd, tomorrow)
      ));

    for (const subscription of renewingSubscriptions) {
      try {
        // Extend subscription period
        const newPeriodStart = subscription.currentPeriodEnd!;
        const newPeriodEnd = new Date(newPeriodStart);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        await db
          .update(organizationSubscriptions)
          .set({
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            updatedAt: new Date()
          })
          .where(eq(organizationSubscriptions.id, subscription.id));

        console.log(`🔄 Subscription renewed for org ${subscription.organizationId}`);
      } catch (error) {
        console.error(`❌ Failed to renew subscription for org ${subscription.organizationId}:`, error);
      }
    }
  }

  // Smart pricing optimization
  async optimizePricing(): Promise<void> {
    try {
      console.log("🎯 Running pricing optimization...");

      // Analyze conversion rates by plan
      const conversionData = await this.getConversionRates();
      
      // Suggest pricing adjustments based on data
      const suggestions = this.generatePricingSuggestions(conversionData);
      
      console.log("📊 Pricing optimization suggestions:", suggestions);
    } catch (error) {
      console.error("❌ Pricing optimization failed:", error);
    }
  }

  private async getConversionRates() {
    // Simplified conversion analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trialConversions = await db
      .select()
      .from(organizationSubscriptions)
      .where(and(
        gte(organizationSubscriptions.createdAt, thirtyDaysAgo),
        eq(organizationSubscriptions.status, "active")
      ));

    const totalTrials = await db
      .select()
      .from(organizationSubscriptions)
      .where(gte(organizationSubscriptions.createdAt, thirtyDaysAgo));

    return {
      conversionRate: trialConversions.length / totalTrials.length,
      totalTrials: totalTrials.length,
      conversions: trialConversions.length
    };
  }

  private generatePricingSuggestions(data: any) {
    const suggestions = [];
    
    if (data.conversionRate < 0.1) {
      suggestions.push("Consider reducing entry-level pricing - conversion rate is low");
    }
    
    if (data.conversionRate > 0.3) {
      suggestions.push("Consider increasing prices - conversion rate is high");
    }
    
    return suggestions;
  }

  // Get billing metrics for dashboard
  async getBillingMetrics() {
    return await pricingService.getBillingMetrics();
  }
}

export const billingAutomation = new BillingAutomationService();