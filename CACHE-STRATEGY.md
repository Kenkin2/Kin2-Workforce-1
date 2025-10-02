# Cache Invalidation Strategy

## Overview

The Kin2 Workforce platform uses an in-memory caching system with domain-specific invalidation strategies to optimize performance while maintaining data consistency.

## Cache Architecture

### Cache Domains

All cache entries are organized by domain for precise invalidation:

```typescript
import { CacheDomains } from './middleware/cache';

// Available domains
CacheDomains.USERS          // User data
CacheDomains.ORGANIZATIONS  // Organization data
CacheDomains.JOBS           // Job listings
CacheDomains.SHIFTS         // Shift schedules
CacheDomains.TIMESHEETS     // Timesheet records
CacheDomains.PAYMENTS       // Payment data
CacheDomains.COURSES        // Learning courses
CacheDomains.COMPLIANCE     // Compliance reports
CacheDomains.ANALYTICS      // Analytics data
CacheDomains.WORKFORCE      // Workforce metrics
CacheDomains.BILLING        // Billing data
CacheDomains.ISSUES         // Issue tracking
```

### TTL (Time-To-Live) Presets

```typescript
import { CacheTTL } from './middleware/cache';

CacheTTL.SHORT     // 1 minute - frequently changing data
CacheTTL.MEDIUM    // 5 minutes - standard data (default)
CacheTTL.LONG      // 30 minutes - relatively static data
CacheTTL.EXTENDED  // 1 hour - rarely changing data
CacheTTL.DAILY     // 24 hours - very static data
```

## Cache Key Conventions

### Standard Format

```
{domain}:{resource}:{param1=value1&param2=value2}
```

### Examples

```typescript
// User profile cache
users:profile:userId=123

// Organization jobs cache
jobs:list:organizationId=456&status=active

// Analytics dashboard cache
analytics:dashboard:orgId=789&dateRange=7days
```

### Building Cache Keys

```typescript
import { buildCacheKey } from './middleware/cache';

// Simple key
const key = buildCacheKey('users', 'profile', { userId: '123' });
// Result: users:profile:userId=123

// Complex key with multiple params
const key = buildCacheKey('jobs', 'list', {
  organizationId: '456',
  status: 'active',
  limit: 10
});
// Result: jobs:list:limit=10&organizationId=456&status=active
```

## Usage Patterns

### 1. Basic Caching Middleware

```typescript
import { cacheMiddleware, CacheTTL, CacheDomains } from './middleware/cache';

// Cache with default TTL (5 minutes)
router.get('/api/users', cacheMiddleware(), async (req, res) => {
  const users = await storage.getUsers();
  res.json(users);
});

// Cache with custom TTL
router.get('/api/analytics/dashboard', 
  cacheMiddleware({ ttl: CacheTTL.LONG }),
  async (req, res) => {
    const data = await getAnalytics();
    res.json(data);
  }
);

// Cache with domain specification
router.get('/api/jobs',
  cacheMiddleware({ 
    domain: CacheDomains.JOBS,
    ttl: CacheTTL.SHORT
  }),
  async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  }
);
```

### 2. Custom Cache Key Builder

```typescript
router.get('/api/users/:userId/dashboard',
  cacheMiddleware({
    domain: CacheDomains.USERS,
    ttl: CacheTTL.MEDIUM,
    keyBuilder: (req) => buildCacheKey(
      CacheDomains.USERS,
      'dashboard',
      { 
        userId: req.params.userId,
        role: (req as any).user?.role
      }
    )
  }),
  async (req, res) => {
    const dashboard = await getDashboard(req.params.userId);
    res.json(dashboard);
  }
);
```

### 3. Manual Cache Control

```typescript
import { cacheService } from './middleware/cache';

// Set cache manually
const data = await fetchExpensiveData();
cacheService.set(
  buildCacheKey('analytics', 'report', { month: '2025-10' }),
  data,
  CacheTTL.EXTENDED
);

// Get from cache
const cached = cacheService.get(
  buildCacheKey('analytics', 'report', { month: '2025-10' })
);

if (cached) {
  return cached;
}
```

## Cache Invalidation Strategies

### 1. Domain-Wide Invalidation

Invalidate all cache entries for a specific domain:

```typescript
import { invalidateDomainCache, CacheDomains } from './middleware/cache';

// Invalidate all jobs cache
router.post('/api/jobs',
  invalidateDomainCache('JOBS'),
  async (req, res) => {
    const job = await storage.createJob(req.body);
    res.json(job);
  }
);
```

### 2. Pattern-Based Invalidation

Invalidate cache entries matching a pattern:

```typescript
import { invalidateCacheMiddleware } from './middleware/cache';

// Invalidate specific organization's data
router.put('/api/organizations/:orgId',
  invalidateCacheMiddleware([
    'organizations:',
    `:organizationId=${req.params.orgId}`
  ]),
  async (req, res) => {
    const org = await storage.updateOrganization(req.params.orgId, req.body);
    res.json(org);
  }
);
```

### 3. Smart Mutation-Based Invalidation

Automatically invalidate related cache entries:

```typescript
import { invalidateOnMutation, CacheDomains } from './middleware/cache';

// Create job - invalidate jobs domain and organization cache
router.post('/api/jobs',
  invalidateOnMutation({
    domains: ['JOBS'],
    orgIdFrom: 'body'
  }),
  async (req, res) => {
    const job = await storage.createJob(req.body);
    res.json(job);
  }
);

// Update user - invalidate user and org cache
router.put('/api/users/:userId',
  invalidateOnMutation({
    domains: ['USERS'],
    userIdFrom: 'params',
    orgIdFrom: 'body'
  }),
  async (req, res) => {
    const user = await storage.updateUser(req.params.userId, req.body);
    res.json(user);
  }
);

// Submit timesheet - invalidate multiple domains
router.post('/api/timesheets',
  invalidateOnMutation({
    domains: ['TIMESHEETS', 'ANALYTICS', 'BILLING'],
    userIdFrom: 'user',
    orgIdFrom: 'body'
  }),
  async (req, res) => {
    const timesheet = await storage.createTimesheet(req.body);
    res.json(timesheet);
  }
);
```

### 4. Manual Invalidation

```typescript
import { cacheService } from './middleware/cache';

// Invalidate specific pattern
cacheService.invalidate('users:123');

// Invalidate domain
cacheService.invalidateDomain('JOBS');

// Invalidate user-related cache
cacheService.invalidateUser('user-123');

// Invalidate organization-related cache
cacheService.invalidateOrganization('org-456');

// Clear all cache
cacheService.invalidate();
```

## When to Cache

### ✅ Good Candidates for Caching

1. **Expensive Computations**
   - Analytics dashboards
   - Complex aggregations
   - Report generation

2. **External API Calls**
   - Third-party data
   - Rate-limited services
   - Slow external systems

3. **Frequently Accessed Data**
   - User profiles (when viewing)
   - Organization settings
   - Static content (courses, templates)

4. **List/Index Endpoints**
   - Job listings (with pagination)
   - User directories
   - Search results (for same query)

### ❌ Poor Candidates for Caching

1. **Real-Time Data**
   - Live notifications
   - Active timesheets
   - Real-time chat messages

2. **Personalized Data**
   - User-specific dashboards with dynamic content
   - Permission-based views

3. **Write-Heavy Endpoints**
   - POST, PUT, DELETE operations
   - Frequently updated data

4. **Sensitive/Financial Data**
   - Payment details (cache sparingly)
   - Sensitive compliance data

## Invalidation Triggers

### User Actions
```typescript
// User profile update
PUT /api/users/:id → Invalidate: users:*, user-specific cache

// Job creation
POST /api/jobs → Invalidate: jobs:*, org-specific jobs

// Timesheet submission
POST /api/timesheets → Invalidate: timesheets:*, analytics:*, billing:*

// Payment processing
POST /api/payments → Invalidate: payments:*, billing:*, user balance
```

### Background Jobs
```typescript
// Nightly billing cycle
invalidateDomainCache('BILLING');
invalidateDomainCache('PAYMENTS');

// Analytics recalculation
invalidateDomainCache('ANALYTICS');

// Compliance report generation
invalidateDomainCache('COMPLIANCE');
```

### System Events
```typescript
// Organization settings change
cacheService.invalidateOrganization(orgId);

// User role change
cacheService.invalidateUser(userId);
cacheService.invalidate('permissions:');

// Global configuration update
cacheService.invalidate(); // Clear all
```

## Cache Monitoring

### Get Cache Statistics

```typescript
import { cacheService } from './middleware/cache';

const stats = cacheService.getStats();
/*
{
  totalEntries: 150,
  activeEntries: 145,
  expiredEntries: 5,
  memoryUsage: 524288, // bytes
  domains: {
    users: 45,
    jobs: 32,
    analytics: 15,
    ...
  }
}
*/
```

### Monitoring Endpoint

```typescript
router.get('/api/admin/cache/stats', isAdmin, (req, res) => {
  const stats = cacheService.getStats();
  res.json({
    ...stats,
    memoryUsageMB: (stats.memoryUsage / 1024 / 1024).toFixed(2)
  });
});
```

### Cache Headers

All cached responses include headers:
```
X-Cache: HIT   // Response served from cache
X-Cache: MISS  // Response fetched fresh
```

## Best Practices

### 1. Use Domain-Specific Keys

```typescript
// ❌ Bad - vague key
cacheService.set('data', userData);

// ✅ Good - specific domain key
cacheService.set(
  buildCacheKey(CacheDomains.USERS, 'profile', { userId }),
  userData,
  CacheTTL.MEDIUM
);
```

### 2. Choose Appropriate TTL

```typescript
// Static data - long TTL
router.get('/api/courses',
  cacheMiddleware({ ttl: CacheTTL.EXTENDED }),
  ...
);

// Dynamic data - short TTL
router.get('/api/jobs/active',
  cacheMiddleware({ ttl: CacheTTL.SHORT }),
  ...
);
```

### 3. Invalidate Proactively

```typescript
// ❌ Bad - wait for TTL expiry
router.post('/api/jobs', async (req, res) => {
  const job = await storage.createJob(req.body);
  res.json(job);
});

// ✅ Good - immediate invalidation
router.post('/api/jobs',
  invalidateOnMutation({ domains: ['JOBS'] }),
  async (req, res) => {
    const job = await storage.createJob(req.body);
    res.json(job);
  }
);
```

### 4. Cascade Invalidation

When data changes affect multiple domains:

```typescript
router.post('/api/shifts/:id/complete',
  invalidateOnMutation({
    domains: ['SHIFTS', 'TIMESHEETS', 'ANALYTICS', 'PAYMENTS'],
    userIdFrom: 'body',
    orgIdFrom: 'body'
  }),
  async (req, res) => {
    // Completing a shift affects multiple domains
    const shift = await storage.completeShift(req.params.id);
    res.json(shift);
  }
);
```

### 5. User-Specific Invalidation

```typescript
// When user data changes
router.put('/api/users/:userId/profile',
  invalidateOnMutation({
    domains: ['USERS'],
    userIdFrom: 'params'
  }),
  async (req, res) => {
    const user = await storage.updateUser(req.params.userId, req.body);
    res.json(user);
  }
);
```

## Performance Tuning

### Cache Size Management

The system automatically cleans expired entries every minute:

```typescript
// Runs automatically
setInterval(() => {
  cacheService.cleanExpired();
}, 60000);
```

### Memory Considerations

- **Soft Limit**: 100MB
- **Hard Limit**: 500MB
- **Action on limit**: Invalidate oldest entries first

Monitor cache size:
```typescript
const stats = cacheService.getStats();
if (stats.memoryUsage > 100 * 1024 * 1024) {
  // Approaching limit - consider clearing low-value cache
  cacheService.invalidate('analytics:');
}
```

## Troubleshooting

### Issue: Stale Data

**Problem**: Users seeing outdated information

**Solution**:
1. Check invalidation middleware is applied
2. Verify correct domain/pattern
3. Reduce TTL for that endpoint

```typescript
// Reduce TTL
router.get('/api/jobs',
  cacheMiddleware({ ttl: CacheTTL.SHORT }), // Was: MEDIUM
  ...
);
```

### Issue: Poor Cache Hit Rate

**Problem**: Cache not improving performance

**Solution**:
1. Check cache key consistency
2. Ensure query parameters are sorted
3. Review invalidation frequency

```typescript
// Use buildCacheKey for consistency
const key = buildCacheKey(domain, resource, {
  organizationId: req.query.orgId,
  status: req.query.status
});
// Parameters are automatically sorted
```

### Issue: Memory Growth

**Problem**: Cache consuming too much memory

**Solution**:
1. Review TTL values (reduce if too long)
2. Limit cached response sizes
3. Implement selective caching

```typescript
// Don't cache large responses
router.get('/api/reports/large',
  async (req, res) => {
    const report = await generateLargeReport();
    
    // Skip caching if too large
    if (JSON.stringify(report).length > 1024 * 1024) {
      return res.json(report);
    }
    
    // Cache if reasonable size
    cacheService.set(cacheKey, report, CacheTTL.LONG);
    res.json(report);
  }
);
```

## Migration Checklist

To add caching to existing endpoints:

- [ ] Identify expensive/frequently-accessed endpoints
- [ ] Choose appropriate domain and TTL
- [ ] Add cacheMiddleware to GET endpoints
- [ ] Add invalidation to related POST/PUT/DELETE endpoints
- [ ] Test cache hit/miss behavior
- [ ] Monitor cache statistics
- [ ] Verify data freshness

## Future Enhancements

### Planned Features
1. **Redis Integration**: Distributed caching for multi-instance deployments
2. **Cache Warming**: Pre-populate cache on startup
3. **Smart Eviction**: LRU (Least Recently Used) policy
4. **Cache Tags**: Group-based invalidation
5. **Compression**: Gzip cached responses
6. **Cache Analytics**: Hit rate tracking, performance metrics

---

**Document Version**: 1.0  
**Last Updated**: October 2, 2025  
**Owner**: Platform Engineering Team
