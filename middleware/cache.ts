import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export const CacheDomains = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  JOBS: 'jobs',
  SHIFTS: 'shifts',
  TIMESHEETS: 'timesheets',
  PAYMENTS: 'payments',
  COURSES: 'courses',
  COMPLIANCE: 'compliance',
  ANALYTICS: 'analytics',
  WORKFORCE: 'workforce',
  BILLING: 'billing',
  ISSUES: 'issues'
} as const;

export const CacheTTL = {
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - for standard data
  LONG: 1800,          // 30 minutes - for relatively static data
  EXTENDED: 3600,      // 1 hour - for rarely changing data
  DAILY: 86400         // 24 hours - for very static data
} as const;

class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  
  set(key: string, data: any, ttlSeconds: number = CacheTTL.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
    
    logger.debug('Cache entry created', { 
      key, 
      ttl: ttlSeconds,
      size: JSON.stringify(data).length 
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key, age: Math.floor(age / 1000) });
      return null;
    }
    
    logger.debug('Cache hit', { key, age: Math.floor(age / 1000) });
    return entry.data;
  }
  
  invalidate(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      logger.info('Cache cleared completely', { entriesCleared: size });
      return size;
    }
    
    const keysToDelete: string[] = [];
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.info('Cache invalidated', { pattern, keysDeleted: keysToDelete.length });
    
    return keysToDelete.length;
  }

  invalidateDomain(domain: keyof typeof CacheDomains): number {
    const pattern = `${CacheDomains[domain]}:`;
    return this.invalidate(pattern);
  }

  invalidateUser(userId: string): number {
    const patterns = [
      `${CacheDomains.USERS}:${userId}`,
      `user:${userId}`,
      `:userId=${userId}`
    ];
    
    let totalDeleted = 0;
    patterns.forEach(pattern => {
      totalDeleted += this.invalidate(pattern);
    });
    
    return totalDeleted;
  }

  invalidateOrganization(orgId: string): number {
    const patterns = [
      `${CacheDomains.ORGANIZATIONS}:${orgId}`,
      `:organizationId=${orgId}`,
      `org:${orgId}`
    ];
    
    let totalDeleted = 0;
    patterns.forEach(pattern => {
      totalDeleted += this.invalidate(pattern);
    });
    
    return totalDeleted;
  }
  
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    return {
      totalEntries: this.cache.size,
      activeEntries: entries.filter(([_, entry]) => 
        (now - entry.timestamp) < entry.ttl
      ).length,
      expiredEntries: entries.filter(([_, entry]) => 
        (now - entry.timestamp) >= entry.ttl
      ).length,
      memoryUsage: entries.reduce((sum, [key, entry]) => 
        sum + key.length + JSON.stringify(entry.data).length, 0
      ),
      domains: this.getDomainStats()
    };
  }

  private getDomainStats() {
    const stats: Record<string, number> = {};
    
    Object.values(CacheDomains).forEach(domain => {
      stats[domain] = Array.from(this.cache.keys())
        .filter(key => key.startsWith(`${domain}:`))
        .length;
    });
    
    return stats;
  }

  cleanExpired(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if ((now - entry.timestamp) >= entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.info('Expired cache entries cleaned', { count: keysToDelete.length });
    }
    
    return keysToDelete.length;
  }
}

export const cacheService = new CacheService();

setInterval(() => {
  cacheService.cleanExpired();
}, 60000);

export function buildCacheKey(domain: string, resource: string, params?: Record<string, any>): string {
  const baseKey = `${domain}:${resource}`;
  
  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${baseKey}:${sortedParams}`;
}

export function cacheMiddleware(options: {
  ttl?: number;
  domain?: string;
  keyBuilder?: (req: Request) => string;
} = {}) {
  const ttl = options.ttl || CacheTTL.MEDIUM;
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = options.keyBuilder 
      ? options.keyBuilder(req)
      : buildCacheKey(
          options.domain || 'default',
          req.path,
          req.query as Record<string, any>
        );
    
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }
    
    res.setHeader('X-Cache', 'MISS');
    
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };
    
    next();
  };
}

export function invalidateCacheMiddleware(patterns: string | string[]) {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  
  return (_req: Request, _res: Response, next: NextFunction) => {
    patternArray.forEach(pattern => {
      cacheService.invalidate(pattern);
    });
    next();
  };
}

export function invalidateDomainCache(domain: keyof typeof CacheDomains) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    cacheService.invalidateDomain(domain);
    next();
  };
}

export function invalidateOnMutation(options: {
  domains?: (keyof typeof CacheDomains)[];
  patterns?: string[];
  userIdFrom?: 'params' | 'body' | 'user';
  orgIdFrom?: 'params' | 'body' | 'user';
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (options.domains) {
      options.domains.forEach(domain => {
        cacheService.invalidateDomain(domain);
      });
    }
    
    if (options.patterns) {
      options.patterns.forEach(pattern => {
        cacheService.invalidate(pattern);
      });
    }
    
    if (options.userIdFrom) {
      const userId = options.userIdFrom === 'params' 
        ? req.params.userId || req.params.id
        : options.userIdFrom === 'body'
        ? req.body.userId
        : (req as any).user?.id;
      
      if (userId) {
        cacheService.invalidateUser(userId);
      }
    }
    
    if (options.orgIdFrom) {
      const orgId = options.orgIdFrom === 'params'
        ? req.params.organizationId || req.params.orgId
        : options.orgIdFrom === 'body'
        ? req.body.organizationId
        : (req as any).user?.organizationId;
      
      if (orgId) {
        cacheService.invalidateOrganization(orgId);
      }
    }
    
    next();
  };
}
