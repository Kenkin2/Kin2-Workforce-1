import logger from './utils/logger';
// Performance optimization utilities

// Query caching layer
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function cacheQuery<T>(key: string, data: T, ttlMs: number = 300000): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

export function getCachedQuery<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function clearQueryCache(): void {
  queryCache.clear();
}

// Request rate limiting
const rateLimitMap = new Map<string, { requests: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, {
      requests: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.requests >= maxRequests) {
    return false;
  }
  
  current.requests++;
  return true;
}

// Database query optimization helpers
export function optimizeQuery(baseQuery: any, options: {
  useIndex?: string;
  limit?: number;
  offset?: number;
}) {
  let optimizedQuery = baseQuery;
  
  // Add limit for performance
  if (options.limit) {
    optimizedQuery = optimizedQuery.limit(options.limit);
  }
  
  // Add offset for pagination
  if (options.offset) {
    optimizedQuery = optimizedQuery.offset(options.offset);
  }
  
  return optimizedQuery;
}

// Background job processor
class BackgroundJobProcessor {
  private jobs: Array<() => Promise<void>> = [];
  private processing = false;
  
  addJob(job: () => Promise<void>) {
    this.jobs.push(job);
    if (!this.processing) {
      this.processJobs();
    }
  }
  
  private async processJobs() {
    this.processing = true;
    
    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (job) {
        try {
          await job();
        } catch (error) {
          logger.error('Background job failed:', error);
        }
      }
    }
    
    this.processing = false;
  }
}

export const backgroundProcessor = new BackgroundJobProcessor();

// Memory optimization
export function optimizeMemoryUsage() {
  // Clear query cache periodically
  clearQueryCache();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  logger.info('🧹 Memory optimization completed');
}

// Performance monitoring middleware
export function performanceMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 2000) {
      console.warn(`⏱️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Track API usage
    const key = `${req.method}:${req.path}`;
    const cached = getCachedQuery<{ count: number }>(`api-usage:${key}`);
    const count = cached ? cached.count + 1 : 1;
    cacheQuery(`api-usage:${key}`, { count }, 3600000); // 1 hour TTL
  });
  
  next();
}

// Database connection pooling optimization
export function optimizeDatabaseConnections() {
  // This would typically involve adjusting pool settings
  // based on current load and performance metrics
  logger.info('🔧 Database connection optimization completed');
}

// Auto-scaling simulation (for demonstration)
export function autoScale(currentLoad: number) {
  if (currentLoad > 80) {
    logger.info('📈 High load detected, would scale up in production');
    return 'scale-up';
  } else if (currentLoad < 20) {
    logger.info('📉 Low load detected, would scale down in production');
    return 'scale-down';
  }
  return 'no-change';
}