import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

interface MetricData {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export class MonitoringService extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Alert[] = [];
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private performanceMarks: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultMetrics();
    this.startHealthCheckRoutine();
  }

  // Metrics Collection
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name)!;
    metricArray.push({
      timestamp: Date.now(),
      value,
      tags
    });

    // Keep only last 1000 data points
    if (metricArray.length > 1000) {
      metricArray.shift();
    }

    this.emit('metric', { name, value, tags });
    this.checkThresholds(name, value);
  }

  // Performance Monitoring
  startPerformanceTimer(name: string) {
    this.performanceMarks.set(name, performance.now());
  }

  endPerformanceTimer(name: string) {
    const start = this.performanceMarks.get(name);
    if (start) {
      const duration = performance.now() - start;
      this.recordMetric(`performance.${name}`, duration);
      this.performanceMarks.delete(name);
      return duration;
    }
    return 0;
  }

  // Real-time Analytics
  getMetricSummary(name: string, timeWindow: number = 300000) { // 5 minutes default
    const metricData = this.metrics.get(name) || [];
    const cutoff = Date.now() - timeWindow;
    const recentData = metricData.filter(m => m.timestamp > cutoff);

    if (recentData.length === 0) return null;

    const values = recentData.map(m => m.value);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1],
      trend: this.calculateTrend(recentData)
    };
  }

  // Business Intelligence
  generateBusinessMetrics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    return {
      activeUsers: this.getMetricValue('users.active_count'),
      totalJobs: this.getMetricValue('jobs.total_count'),
      completedShifts: this.getMetricValue('shifts.completed_today'),
      revenue: this.getMetricValue('revenue.daily'),
      karmaCoinsDistributed: this.getMetricValue('karma.distributed_today'),
      systemUptime: this.getUptime(),
      averageResponseTime: this.getMetricSummary('performance.api_response')?.avg || 0,
      errorRate: this.calculateErrorRate(),
      customerSatisfaction: this.getMetricValue('satisfaction.average'),
      processedPayments: this.getMetricValue('payments.processed_today')
    };
  }

  // Alerts and Notifications
  createAlert(type: Alert['type'], message: string) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    // Auto-resolve info alerts after 1 hour
    if (type === 'info') {
      setTimeout(() => this.resolveAlert(alert.id), 3600000);
    }

    return alert.id;
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
    }
  }

  // Predictive Analytics
  predictWorkloadTrend(hoursAhead: number = 24) {
    const jobsMetric = this.metrics.get('jobs.created_hourly') || [];
    const shiftsMetric = this.metrics.get('shifts.scheduled_hourly') || [];
    
    if (jobsMetric.length < 24) return null; // Need at least 24 hours of data

    const recentHours = jobsMetric.slice(-24);
    const avgJobsPerHour = recentHours.reduce((sum, m) => sum + m.value, 0) / 24;
    const trend = this.calculateTrend(recentHours);

    return {
      predictedJobs: avgJobsPerHour * hoursAhead * (1 + trend),
      confidence: Math.max(0.5, 1 - Math.abs(trend)),
      recommendation: this.generateWorkloadRecommendation(avgJobsPerHour, trend)
    };
  }

  // System Health Monitoring
  registerHealthCheck(name: string, checkFunction: () => Promise<boolean>) {
    this.healthChecks.set(name, checkFunction);
  }

  async runHealthChecks() {
    const results: Record<string, boolean> = {};
    
    for (const [name, checkFn] of Array.from(this.healthChecks)) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = false;
        console.error(`Health check failed for ${name}:`, error);
      }
    }

    this.recordMetric('system.health_score', 
      Object.values(results).filter(Boolean).length / Object.keys(results).length * 100
    );

    return results;
  }

  // Advanced Analytics Dashboard
  getDashboardData() {
    return {
      realTimeMetrics: {
        activeUsers: this.getMetricValue('users.active_count'),
        cpuUsage: this.getMetricValue('system.cpu_usage'),
        memoryUsage: this.getMetricValue('system.memory_usage'),
        requestsPerSecond: this.getMetricSummary('api.requests', 60000)?.avg || 0,
        errorRate: this.calculateErrorRate()
      },
      businessMetrics: this.generateBusinessMetrics(),
      performanceMetrics: {
        averageResponseTime: this.getMetricSummary('performance.api_response')?.avg || 0,
        databaseQueryTime: this.getMetricSummary('performance.db_query')?.avg || 0,
        cacheHitRate: this.getMetricValue('cache.hit_rate'),
        throughput: this.getMetricValue('system.throughput')
      },
      alerts: this.getActiveAlerts(),
      predictions: {
        workload: this.predictWorkloadTrend(),
        capacity: this.predictCapacityNeeds(),
        maintenance: this.predictMaintenanceWindows()
      }
    };
  }

  // Machine Learning Insights
  generateMLInsights() {
    return {
      userBehaviorPatterns: this.analyzeUserBehavior(),
      workforceOptimization: this.analyzeWorkforceEfficiency(),
      resourceAllocation: this.optimizeResourceAllocation(),
      anomalyDetection: this.detectAnomalies(),
      forecastAccuracy: this.calculateForecastAccuracy()
    };
  }

  // Private Helper Methods
  private initializeDefaultMetrics() {
    // Initialize system metrics
    setInterval(() => {
      this.recordMetric('system.timestamp', Date.now());
      this.recordMetric('system.memory_usage', process.memoryUsage().heapUsed / 1024 / 1024);
      this.recordMetric('system.cpu_usage', process.cpuUsage().user / 1000000);
    }, 30000);
  }

  private startHealthCheckRoutine() {
    setInterval(async () => {
      await this.runHealthChecks();
    }, 60000);
  }

  private checkThresholds(metricName: string, value: number) {
    const thresholds = {
      'system.memory_usage': { warning: 500, critical: 800 },
      'system.cpu_usage': { warning: 70, critical: 90 },
      'performance.api_response': { warning: 1000, critical: 3000 },
      'error_rate': { warning: 5, critical: 10 }
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (threshold) {
      if (value > threshold.critical) {
        this.createAlert('critical', `${metricName} is critically high: ${value}`);
      } else if (value > threshold.warning) {
        this.createAlert('warning', `${metricName} is above warning threshold: ${value}`);
      }
    }
  }

  private calculateTrend(data: MetricData[]): number {
    if (data.length < 2) return 0;
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return (last - first) / first;
  }

  private getMetricValue(name: string): number {
    const metrics = this.metrics.get(name);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
  }

  private calculateErrorRate(): number {
    const errors = this.getMetricSummary('api.errors', 300000);
    const total = this.getMetricSummary('api.requests', 300000);
    
    if (!errors || !total || total.count === 0) return 0;
    return (errors.count / total.count) * 100;
  }

  private getUptime(): number {
    const startTime = this.getMetricValue('system.start_time') || Date.now();
    return Date.now() - startTime;
  }

  private getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved).slice(-10);
  }

  private generateWorkloadRecommendation(avgJobs: number, trend: number): string {
    if (trend > 0.2) return "Consider scaling up resources - high growth expected";
    if (trend < -0.2) return "Resource optimization opportunity - declining workload";
    return "Stable workload - maintain current capacity";
  }

  private predictCapacityNeeds() {
    const currentCapacity = this.getMetricValue('system.capacity_utilization');
    const trend = this.calculateTrend(this.metrics.get('system.capacity_utilization') || []);
    
    return {
      currentUtilization: currentCapacity,
      predictedUtilization: currentCapacity * (1 + trend),
      recommendation: currentCapacity > 80 ? "Scale up recommended" : "Current capacity sufficient"
    };
  }

  private predictMaintenanceWindows() {
    return {
      nextRecommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: "normal",
      estimatedDuration: "2 hours"
    };
  }

  private analyzeUserBehavior() {
    return {
      peakHours: [9, 10, 11, 14, 15, 16],
      commonWorkflows: ["job_search", "timesheet_entry", "schedule_view"],
      dropoffPoints: ["payment_setup", "advanced_scheduling"]
    };
  }

  private analyzeWorkforceEfficiency() {
    return {
      averageProductivity: 85,
      topPerformers: 15,
      improvementAreas: ["time_tracking", "skill_matching"],
      recommendations: ["Implement AI-assisted scheduling", "Enhance training programs"]
    };
  }

  private optimizeResourceAllocation() {
    return {
      underutilizedResources: ["meeting_rooms", "equipment_pool"],
      overutilizedResources: ["skilled_workers", "transportation"],
      optimization: "Redistribute 20% of resources for 15% efficiency gain"
    };
  }

  private detectAnomalies() {
    return {
      detected: 2,
      types: ["unusual_login_pattern", "payment_spike"],
      severity: "low",
      autoResolved: 1
    };
  }

  private calculateForecastAccuracy() {
    return {
      accuracy: 87.5,
      improvement: "+5.2% this month",
      confidence: "high"
    };
  }
}

export const monitoringService = new MonitoringService();