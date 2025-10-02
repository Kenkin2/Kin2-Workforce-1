import logger from './utils/logger';
import { checkDatabaseHealth } from './db';
import { paymentProcessor } from './payments';

interface SystemMetrics {
  timestamp: string;
  database: {
    healthy: boolean;
    latency: number;
    connections: number;
    queryCount: number;
  };
  payments: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    totalAmount: number;
  };
  server: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
  notifications: {
    totalSent: number;
    activeConnections: number;
  };
}

class SystemMonitor {
  private metrics: SystemMetrics[] = [];
  private startTime = Date.now();
  private notificationCount = 0;
  private activeConnections = 0;

  // Collect system metrics
  async collectMetrics(): Promise<SystemMetrics> {
    const dbHealth = await checkDatabaseHealth();
    const paymentMetrics = paymentProcessor.getMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealth.healthy,
        latency: dbHealth.latency,
        connections: dbHealth.connections,
        queryCount: 0 // This would be tracked by the database layer
      },
      payments: {
        totalProcessed: paymentMetrics.totalProcessed,
        successRate: paymentMetrics.successRate,
        averageProcessingTime: paymentMetrics.averageProcessingTime,
        totalAmount: paymentMetrics.totalAmount
      },
      server: {
        uptime: Date.now() - this.startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage().user + process.cpuUsage().system
      },
      notifications: {
        totalSent: this.notificationCount,
        activeConnections: this.activeConnections
      }
    };
  }

  // Start periodic monitoring
  startMonitoring(intervalMs: number = 60000) {
    setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }
        
        // Log critical issues
        this.checkForIssues(metrics);
      } catch (error) {
        logger.error('📊 Error collecting metrics:', error);
      }
    }, intervalMs);
    
    logger.info('📊 System monitoring started');
  }

  // Check for critical issues
  private checkForIssues(metrics: SystemMetrics) {
    // Database issues
    if (!metrics.database.healthy) {
      logger.error('🚨 CRITICAL: Database is unhealthy');
    }
    
    if (metrics.database.latency > 2000) {
      logger.warn('⚠️ WARNING: High database latency:', metrics.database.latency, 'ms');
    }
    
    // Payment issues
    if (metrics.payments.successRate < 95 && metrics.payments.totalProcessed > 10) {
      logger.warn('⚠️ WARNING: Low payment success rate:', metrics.payments.successRate, '%');
    }
    
    // Memory issues
    const memoryUsageMB = metrics.server.memoryUsage.rss / 1024 / 1024;
    if (memoryUsageMB > 500) {
      logger.warn('⚠️ WARNING: High memory usage:', memoryUsageMB.toFixed(2), 'MB');
    }
  }

  // Get recent metrics
  getMetrics(count: number = 10): SystemMetrics[] {
    return this.metrics.slice(-count);
  }

  // Get current system status
  async getSystemStatus() {
    const currentMetrics = await this.collectMetrics();
    
    return {
      status: this.determineOverallStatus(currentMetrics),
      ...currentMetrics,
      issues: this.detectIssues(currentMetrics)
    };
  }

  private determineOverallStatus(metrics: SystemMetrics): 'healthy' | 'warning' | 'critical' {
    if (!metrics.database.healthy) return 'critical';
    if (metrics.database.latency > 2000) return 'warning';
    if (metrics.payments.successRate < 95 && metrics.payments.totalProcessed > 10) return 'warning';
    
    const memoryUsageMB = metrics.server.memoryUsage.rss / 1024 / 1024;
    if (memoryUsageMB > 500) return 'warning';
    
    return 'healthy';
  }

  private detectIssues(metrics: SystemMetrics): string[] {
    const issues: string[] = [];
    
    if (!metrics.database.healthy) {
      issues.push('Database connection is unhealthy');
    }
    
    if (metrics.database.latency > 2000) {
      issues.push(`High database latency: ${metrics.database.latency}ms`);
    }
    
    if (metrics.payments.successRate < 95 && metrics.payments.totalProcessed > 10) {
      issues.push(`Low payment success rate: ${metrics.payments.successRate.toFixed(1)}%`);
    }
    
    const memoryUsageMB = metrics.server.memoryUsage.rss / 1024 / 1024;
    if (memoryUsageMB > 500) {
      issues.push(`High memory usage: ${memoryUsageMB.toFixed(2)}MB`);
    }
    
    return issues;
  }

  // Track notification events
  trackNotification() {
    this.notificationCount++;
  }

  updateActiveConnections(count: number) {
    this.activeConnections = count;
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const recent = this.metrics.slice(-10);
    
    if (recent.length === 0) return recommendations;
    
    // Database optimization
    const avgLatency = recent.reduce((sum, m) => sum + m.database.latency, 0) / recent.length;
    if (avgLatency > 1000) {
      recommendations.push('Consider optimizing database queries or adding indexes');
    }
    
    // Memory optimization
    const avgMemoryMB = recent.reduce((sum, m) => sum + m.server.memoryUsage.rss, 0) / recent.length / 1024 / 1024;
    if (avgMemoryMB > 300) {
      recommendations.push('Consider implementing memory optimization strategies');
    }
    
    // Payment optimization
    const avgPaymentTime = recent.reduce((sum, m) => sum + m.payments.averageProcessingTime, 0) / recent.length;
    if (avgPaymentTime > 5000) {
      recommendations.push('Consider optimizing payment processing workflow');
    }
    
    return recommendations;
  }
}

export const systemMonitor = new SystemMonitor();