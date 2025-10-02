import logger from './utils/logger';
import Stripe from "stripe";
import { storage } from "./storage";
import { notificationService } from "./notifications";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Enhanced Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  timeout: 10000, // 10 second timeout
  maxNetworkRetries: 3, // Retry failed requests
  telemetry: false, // Disable telemetry for privacy
});

// Payment processing metrics
let paymentMetrics = {
  totalProcessed: 0,
  successfulPayments: 0,
  failedPayments: 0,
  totalAmount: 0,
  averageProcessingTime: 0
};

export class PaymentProcessor {
  // Enhanced payment intent creation with monitoring
  async createPaymentIntent(params: {
    amount: number;
    workerId: string;
    timesheetId?: string;
    currency?: string;
    metadata?: Record<string, string>;
  }) {
    const start = Date.now();
    
    try {
      const { amount, workerId, timesheetId, currency = "gbp", metadata = {} } = params;
      
      // Validate amount
      if (amount <= 0 || amount > 999999) {
        throw new Error('Invalid payment amount');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence/cents
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          workerId,
          timesheetId: timesheetId || '',
          platform: "kin2_workforce",
          ...metadata
        },
        description: `Payment for timesheet ${timesheetId || 'N/A'}`
      });

      // Create payment record
      await storage.createPayment({
        workerId,
        timesheetId: timesheetId || '',
        amount: amount.toString(),
        platformFee: (amount * 0.05).toString(), // 5% platform fee
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      });

      // Update metrics
      paymentMetrics.totalProcessed++;
      const processingTime = Date.now() - start;
      paymentMetrics.averageProcessingTime = 
        (paymentMetrics.averageProcessingTime + processingTime) / 2;

      console.log(`💳 Payment intent created: ${paymentIntent.id} (${processingTime}ms)`);
      
      return paymentIntent;
    } catch (error) {
      paymentMetrics.failedPayments++;
      logger.error('💥 Payment intent creation failed:', error);
      throw error;
    }
  }

  // Enhanced subscription management
  async createOrUpdateSubscription(params: {
    userId: string;
    email: string;
    priceId?: string;
    trialDays?: number;
  }) {
    try {
      const { userId, email, priceId = process.env.STRIPE_PRICE_ID, trialDays = 0 } = params;
      
      if (!priceId) {
        throw new Error('Stripe price ID not configured');
      }

      const user = await storage.getUser(userId);
      let customerId = user?.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId, platform: 'kin2_workforce' }
        });
        customerId = customer.id;

        // Update user with customer ID
        await storage.upsertUser({
          id: userId,
          email,
          stripeCustomerId: customerId
        });
      }

      // Check for existing subscription
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active'
      });

      if (existingSubscriptions.data.length > 0) {
        const subscription = existingSubscriptions.data[0];
        return {
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          status: subscription.status
        };
      }

      // Create new subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, platform: 'kin2_workforce' }
      };

      if (trialDays > 0) {
        subscriptionParams.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Update user with subscription ID
      await storage.upsertUser({
        id: userId,
        email,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      console.log(`🔄 Subscription created: ${subscription.id}`);

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        status: subscription.status
      };
    } catch (error) {
      logger.error('💥 Subscription creation failed:', error);
      throw error;
    }
  }

  // Webhook handler for Stripe events
  async handleWebhook(body: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('⚠️ Stripe webhook secret not configured');
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      
      console.log(`📨 Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object as Stripe.Invoice);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;
        
        default:
          console.log(`📋 Unhandled webhook type: ${event.type}`);
      }
      
      return { received: true };
    } catch (error) {
      logger.error('💥 Webhook processing failed:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { workerId, timesheetId } = paymentIntent.metadata;
    
    try {
      // Update payment status
      await storage.updatePaymentStatus(paymentIntent.id, 'completed');
      
      // Update metrics
      paymentMetrics.successfulPayments++;
      paymentMetrics.totalAmount += paymentIntent.amount / 100;
      
      // Notify worker
      if (workerId) {
        await notificationService.notifyPaymentProcessed(
          paymentIntent.id, 
          workerId, 
          paymentIntent.amount / 100
        );
      }
      
      console.log(`✅ Payment processed successfully: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment success:', error);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const { workerId } = paymentIntent.metadata;
    
    try {
      // Update payment status
      await storage.updatePaymentStatus(paymentIntent.id, 'failed');
      
      // Update metrics
      paymentMetrics.failedPayments++;
      
      // Notify relevant parties
      if (workerId) {
        await notificationService.sendNotification({
          id: `payment-failed-${paymentIntent.id}`,
          type: 'system_alert',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please contact support.',
          userId: workerId,
          priority: 'high',
          createdAt: new Date()
        });
      }
      
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment failure:', error);
    }
  }

  private async handleSubscriptionPayment(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    
    try {
      // Find user by customer ID
      const users = await storage.getUsersByRole('client'); // Assuming clients have subscriptions
      const user = users.find(u => u.stripeCustomerId === customerId);
      
      if (user) {
        await notificationService.sendNotification({
          id: `subscription-payment-${invoice.id}`,
          type: 'payment_processed',
          title: 'Subscription Payment Processed',
          message: `Your subscription payment of £${(invoice.amount_paid / 100).toFixed(2)} has been processed successfully.`,
          userId: user.id,
          priority: 'medium',
          createdAt: new Date()
        });
      }
      
      console.log(`💰 Subscription payment processed: ${invoice.id}`);
    } catch (error) {
      logger.error('Error handling subscription payment:', error);
    }
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    
    try {
      // Find user and update subscription status
      const users = await storage.getUsersByRole('client');
      const user = users.find(u => u.stripeCustomerId === customerId);
      
      if (user) {
        await storage.upsertUser({
          id: user.id,
          email: user.email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: null
        });
        
        await notificationService.sendNotification({
          id: `subscription-cancelled-${subscription.id}`,
          type: 'system_alert',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. You will retain access until the end of the current billing period.',
          userId: user.id,
          priority: 'medium',
          createdAt: new Date()
        });
      }
      
      console.log(`🚫 Subscription cancelled: ${subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription cancellation:', error);
    }
  }

  // Get payment metrics
  getMetrics() {
    return {
      ...paymentMetrics,
      successRate: paymentMetrics.totalProcessed > 0 
        ? (paymentMetrics.successfulPayments / paymentMetrics.totalProcessed) * 100 
        : 0
    };
  }

  // Reset metrics (for testing or periodic resets)
  resetMetrics() {
    paymentMetrics = {
      totalProcessed: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalAmount: 0,
      averageProcessingTime: 0
    };
  }
}

export const paymentProcessor = new PaymentProcessor();