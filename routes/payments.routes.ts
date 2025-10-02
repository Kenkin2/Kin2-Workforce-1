import { Router } from "express";
import type { Express } from "express";
import { isAuthenticated } from "../middleware/auth-guards";
import { asyncHandler, ValidationError, ExternalServiceError } from "../middleware/error-handler";
import { cacheMiddleware, invalidateOnMutation, CacheDomains, CacheTTL } from "../middleware/cache";
import { insertPaymentSchema } from "@shared/schema";
import logger from "../utils/logger";
import Stripe from "stripe";

export function registerPaymentsRoutes(app: Express, services: {
  storage: any;
  paymentProcessor: any;
  stripe: Stripe;
  pricingService: any;
}) {
  const { storage, paymentProcessor, stripe, pricingService } = services;

  // Timesheets
  app.get('/api/timesheets', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.PAYMENTS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const timesheets = await storage.getTimesheets();
      res.json(timesheets);
    })
  );

  app.post('/api/timesheets', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS', 'WORKFORCE'] }),
    asyncHandler(async (req: any, res) => {
      const timesheet = await storage.createTimesheet({
        ...req.body,
        workerId: req.user.claims.sub,
      });
      res.json(timesheet);
    })
  );

  app.patch('/api/timesheets/:id/approve', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS', 'WORKFORCE'] }),
    asyncHandler(async (req: any, res) => {
      const timesheet = await storage.approveTimesheet(parseInt(req.params.id));
      res.json(timesheet);
    })
  );

  // Payments
  app.get('/api/payments', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.PAYMENTS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const payments = await storage.getPayments();
      res.json(payments);
    })
  );

  app.get('/api/payments/worker/:workerId', 
    isAuthenticated,
    cacheMiddleware({ domain: CacheDomains.PAYMENTS, ttl: CacheTTL.SHORT }),
    asyncHandler(async (req, res) => {
      const payments = await storage.getWorkerPayments(req.params.workerId);
      res.json(payments);
    })
  );

  app.post('/api/payments', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS', 'WORKFORCE'] }),
    asyncHandler(async (req: any, res) => {
      const result = insertPaymentSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Invalid payment data', result.error.errors);
      }

      const payment = await storage.createPayment(result.data);
      const processedPayment = await paymentProcessor.processPayment(payment);
      res.json(processedPayment);
    })
  );

  // Stripe Integration
  app.post("/api/create-payment-intent", 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req, res) => {
      const { amount, currency = 'usd' } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    })
  );

  app.post('/api/create-subscription', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req: any, res) => {
      const { priceId, paymentMethodId } = req.body;
      const userId = req.user.claims.sub;

      let customer;
      const user = await storage.getUser(userId);
      
      if (user?.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user?.email,
          payment_method: paymentMethodId,
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        await storage.updateUser(userId, { stripeCustomerId: customer.id });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
      });

      res.json(subscription);
    })
  );

  // Stripe Webhooks
  app.post('/api/webhooks/stripe',
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req, res) => {
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        throw new ValidationError('Missing stripe signature');
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          logger.info('Payment succeeded:', event.data.object);
          break;
        case 'payment_intent.payment_failed':
          logger.error('Payment failed:', event.data.object);
          break;
        default:
          logger.info('Unhandled event type:', event.type);
      }

      res.json({ received: true });
    })
  );

  // Pricing
  app.post('/api/pricing/calculate', 
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { employees, plan } = req.body;
      const pricing = pricingService.calculatePricing(plan, employees);
      res.json(pricing);
    })
  );

  app.post('/api/pricing/subscribe', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req, res) => {
      const { organizationId, plan, employees } = req.body;
      const subscription = await pricingService.createSubscription(organizationId, plan, employees);
      res.json(subscription);
    })
  );

  app.patch('/api/pricing/subscription/:orgId/employees', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req, res) => {
      const { orgId } = req.params;
      const { employees } = req.body;
      const updated = await pricingService.updateEmployeeCount(orgId, employees);
      res.json(updated);
    })
  );

  app.post('/api/pricing/billing/process/:orgId', 
    isAuthenticated,
    invalidateOnMutation({ domains: ['PAYMENTS'] }),
    asyncHandler(async (req: any, res) => {
      const { orgId } = req.params;
      const { amount, description } = req.body;
      
      const payment = await paymentProcessor.processOrganizationPayment(orgId, amount, description);
      res.json(payment);
    })
  );

  logger.info('✅ Payments & Billing routes registered');
}
