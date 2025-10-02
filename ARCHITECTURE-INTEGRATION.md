# Architecture Integration Guide

## Overview

This document demonstrates how to integrate the new architectural patterns (error handling, caching, modular routing) into existing and new routes.

## Integrated Patterns

### 1. Centralized Error Handling ✅
### 2. Domain-Based Caching ✅
### 3. Modular Routing ✅

## Working Examples

### Compliance Routes (Fully Integrated)

Location: `server/routes/compliance.routes.ts`

```typescript
import { asyncHandler, ExternalServiceError } from "../middleware/error-handler";
import { cacheMiddleware, invalidateOnMutation, CacheDomains, CacheTTL } from "../middleware/cache";

// ✅ GET with caching and error handling
app.get('/api/compliance/overview', 
  isAuthenticatedOrDemo,
  cacheMiddleware({ domain: CacheDomains.COMPLIANCE, ttl: CacheTTL.MEDIUM }),
  asyncHandler(async (req, res) => {
    const report = await regulatoryComplianceService.generateComplianceReport();
    res.json({
      totalRegulations: report.summary.totalRegulations,
      compliantRegulations: report.summary.compliantRegulations,
      // ... data
    });
  })
);

// ✅ POST with cache invalidation
app.post('/api/compliance/incidents',
  isAuthenticated,
  invalidateOnMutation({ domains: ['COMPLIANCE'] }),
  asyncHandler(async (req, res) => {
    const incident = await regulatoryComplianceService.createIncident(req.body);
    res.json(incident);
  })
);
```

### Workforce Routes (Fully Integrated)

Location: `server/routes/workforce.routes.ts`

```typescript
// ✅ GET with domain-specific caching
app.get('/api/workforce/analytics',
  isAuthenticatedOrDemo,
  cacheMiddleware({ domain: CacheDomains.WORKFORCE, ttl: CacheTTL.LONG }),
  asyncHandler(async (req, res) => {
    const analytics = await workforceService.getAnalytics();
    res.json(analytics);
  })
);

// ✅ PUT with cache invalidation
app.put('/api/workforce/workers/:id',
  isAuthenticated,
  invalidateOnMutation({ 
    domains: ['WORKFORCE', 'USERS'],
    userIdFrom: 'params'
  }),
  asyncHandler(async (req, res) => {
    const worker = await storage.updateWorker(req.params.id, req.body);
    res.json(worker);
  })
);
```

### Payments Routes (Fully Integrated)

Location: `server/routes/payments.routes.ts`

```typescript
// ✅ GET with caching
app.get('/api/payments/billing-cycles',
  isAuthenticatedOrDemo,
  cacheMiddleware({ domain: CacheDomains.BILLING, ttl: CacheTTL.MEDIUM }),
  asyncHandler(async (req, res) => {
    const cycles = await billingService.getBillingCycles();
    res.json(cycles);
  })
);

// ✅ POST with multiple domain invalidation
app.post('/api/payments/process',
  isAuthenticated,
  invalidateOnMutation({ 
    domains: ['PAYMENTS', 'BILLING', 'ANALYTICS'],
    userIdFrom: 'body',
    orgIdFrom: 'body'
  }),
  asyncHandler(async (req, res) => {
    const payment = await paymentsService.processPayment(req.body);
    res.json(payment);
  })
);
```

## Pattern Benefits

### Before (Manual Error Handling)
```typescript
app.get('/api/users', async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});
```

**Issues:**
- ❌ Inconsistent error responses
- ❌ No error codes
- ❌ Manual try-catch everywhere
- ❌ No caching
- ❌ No automatic logging

### After (Integrated Patterns)
```typescript
app.get('/api/users',
  cacheMiddleware({ domain: CacheDomains.USERS, ttl: CacheTTL.MEDIUM }),
  asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  })
);
```

**Benefits:**
- ✅ Consistent typed error responses
- ✅ Automatic error codes and timestamps
- ✅ No try-catch boilerplate
- ✅ Automatic caching with domain keys
- ✅ Structured logging (4xx/5xx separation)
- ✅ Cache hit/miss headers

## Migration Checklist

### For Each Route File:

#### 1. Add Imports
```typescript
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError,
  AuthenticationError 
} from "../middleware/error-handler";
import { 
  cacheMiddleware, 
  invalidateOnMutation,
  CacheDomains, 
  CacheTTL 
} from "../middleware/cache";
```

#### 2. Update GET Routes
```typescript
// Before
app.get('/api/resource', auth, async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// After
app.get('/api/resource',
  auth,
  cacheMiddleware({ domain: CacheDomains.APPROPRIATE_DOMAIN, ttl: CacheTTL.MEDIUM }),
  asyncHandler(async (req, res) => {
    const data = await fetchData();
    res.json(data);
  })
);
```

#### 3. Update POST/PUT/DELETE Routes
```typescript
// Before
app.post('/api/resource', auth, async (req, res) => {
  try {
    const result = await createResource(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// After
app.post('/api/resource',
  auth,
  invalidateOnMutation({ domains: ['APPROPRIATE_DOMAIN'] }),
  asyncHandler(async (req, res) => {
    const result = await createResource(req.body);
    res.json(result);
  })
);
```

#### 4. Use Typed Errors
```typescript
asyncHandler(async (req, res) => {
  const user = await storage.getUser(req.params.id);
  
  // Replace manual error responses
  if (!user) {
    throw new NotFoundError('User', { id: req.params.id });
  }
  
  if (!req.user?.role === 'admin') {
    throw new AuthorizationError('Admin access required');
  }
  
  res.json(user);
})
```

## Cache Strategy by Domain

| Domain | Typical TTL | When to Invalidate |
|--------|-------------|-------------------|
| USERS | MEDIUM (5min) | User updates, profile changes |
| ORGANIZATIONS | LONG (30min) | Org settings, structure changes |
| JOBS | SHORT (1min) | Job creation, status updates |
| SHIFTS | SHORT (1min) | Shift changes, assignments |
| TIMESHEETS | SHORT (1min) | Timesheet submission, approvals |
| PAYMENTS | MEDIUM (5min) | Payment processing, refunds |
| COMPLIANCE | LONG (30min) | Compliance assessments, reports |
| ANALYTICS | LONG (30min) | After data updates, nightly |
| BILLING | MEDIUM (5min) | Billing cycles, invoice generation |

## Error Class Selection Guide

| Scenario | Error Class | HTTP Status |
|----------|------------|-------------|
| Missing/invalid input | ValidationError | 400 |
| Not authenticated | AuthenticationError | 401 |
| Insufficient permissions | AuthorizationError | 403 |
| Resource not found | NotFoundError | 404 |
| Duplicate resource | ConflictError | 409 |
| Business rule violation | BusinessLogicError | 422 |
| Too many requests | RateLimitError | 429 |
| External service failure | ExternalServiceError | 502 |

## Testing Integration

### Test Error Handling
```typescript
// Test that errors are properly formatted
const response = await request(app)
  .get('/api/users/invalid-id')
  .expect(404);

expect(response.body).toMatchObject({
  error: expect.any(String),
  code: 'NOT_FOUND',
  timestamp: expect.any(String),
  path: '/api/users/invalid-id'
});
```

### Test Caching
```typescript
// First request - cache miss
const response1 = await request(app)
  .get('/api/users')
  .expect(200);
expect(response1.headers['x-cache']).toBe('MISS');

// Second request - cache hit
const response2 = await request(app)
  .get('/api/users')
  .expect(200);
expect(response2.headers['x-cache']).toBe('HIT');
```

### Test Cache Invalidation
```typescript
// Create user - should invalidate cache
await request(app)
  .post('/api/users')
  .send({ name: 'Test User' })
  .expect(201);

// Next GET should be cache miss
const response = await request(app)
  .get('/api/users')
  .expect(200);
expect(response.headers['x-cache']).toBe('MISS');
```

## Current Integration Status

### ✅ Fully Integrated Routers (42 routes total)
- `server/routes/compliance.routes.ts` - Compliance domain (**9/9 routes integrated**)
  - All GET routes use cacheMiddleware with domain-specific TTLs
  - All POST routes use invalidateOnMutation for cache coherence
  - All routes wrapped in asyncHandler with typed error handling
  - Manual try-catch blocks eliminated
  
- `server/routes/workforce.routes.ts` - Workforce domain (**20/20 routes integrated**)
  - Jobs, shifts, scheduling, worker management routes
  - Cache TTLs: MEDIUM for jobs, SHORT for real-time scheduling
  - All mutations invalidate WORKFORCE domain
  
- `server/routes/payments.routes.ts` - Payments & billing domain (**13/13 routes integrated**)
  - Timesheets, payments, billing cycles, invoices, Stripe webhooks
  - Cache TTL: SHORT for all financial data (frequently changing)
  - All mutations invalidate PAYMENTS (and WORKFORCE where applicable)

### 🔄 Pending Integration  
- `server/routes.ts` - Main routes file (4,300+ lines, legacy patterns)
  - High-priority routes to migrate: jobs, users, shifts, analytics

### 📋 Next Steps - Legacy Routes Migration
**All modular routers complete!** Now focus on migrating high-value routes from routes.ts:

1. **High Traffic Routes** (jobs, users, shifts in routes.ts) - maximum performance impact
2. **Write Operations** (POST/PUT/DELETE) - ensure cache invalidation  
3. **Analytics Routes** (benefit most from caching)
4. **Admin Routes** (lower priority, less traffic)
5. **Consider**: Move routes.ts routes into appropriate modular routers where possible

## Monitoring Integration

### Check Cache Performance
```bash
# Get cache stats
curl http://localhost:5000/api/admin/cache/stats

# Response
{
  "totalEntries": 150,
  "activeEntries": 145,
  "expiredEntries": 5,
  "memoryUsageMB": "0.50",
  "domains": {
    "compliance": 32,
    "workforce": 28,
    "payments": 15,
    ...
  }
}
```

### Monitor Error Rates
```bash
# Check logs for error distribution
grep "Client error" logs/*.log | wc -l  # 4xx errors
grep "Server error" logs/*.log | wc -l  # 5xx errors
```

## Next Steps

1. **Complete Migration**: Continue migrating routes from `routes.ts` to use new patterns
2. **Add Tests**: Create integration tests for error handling and caching
3. **Performance Metrics**: Track cache hit rates and error rates
4. **Documentation**: Keep this guide updated as patterns evolve

## Questions & Support

For questions about:
- **Error Handling**: See `server/ERROR-HANDLING.md`
- **Caching Strategy**: See `server/CACHE-STRATEGY.md`
- **Disaster Recovery**: See `server/DISASTER-RECOVERY.md`
- **Security Audit**: See `server/SECURITY-AUDIT.md`

---

**Status**: Modular routers complete! (3/3 routers, 42 routes integrated) - Now migrating legacy routes.ts  
**Last Updated**: October 2, 2025  
**Owner**: Platform Engineering Team
