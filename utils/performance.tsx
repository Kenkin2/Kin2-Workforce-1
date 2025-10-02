// Performance monitoring and optimization utilities
import { useEffect, useState, useCallback, ComponentType } from 'react';

// Performance metrics collection
export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  
  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  resourceLoadTime: number;
  jsHeapSize: number;
  connectionType: string;
  
  // Component metrics
  componentRenderTimes: Record<string, number>;
  bundleSizes: Record<string, number>;
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined' || this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.observeNavigationTiming();
    this.observePaintTiming();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeResourceTiming();
    this.monitorMemoryUsage();
  }

  private observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0] as any;
        this.metrics.pageLoadTime = entry.loadEventEnd - (entry.navigationStart || 0);
        this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - (entry.navigationStart || 0);
      }
    }
  }

  private observePaintTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    }
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input-delay') {
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
          }
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        let totalResourceTime = 0;
        for (const entry of list.getEntries()) {
          totalResourceTime += entry.duration;
        }
        this.metrics.resourceLoadTime = totalResourceTime;
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    }
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.jsHeapSize = memory.usedJSHeapSize;
    }

    // Monitor connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection?.effectiveType || 'unknown';
    }
  }

  public trackComponentRender(componentName: string, renderTime: number) {
    if (!this.metrics.componentRenderTimes) {
      this.metrics.componentRenderTimes = {};
    }
    this.metrics.componentRenderTimes[componentName] = renderTime;
    
    // Log slow renders
    if (renderTime > 16) { // Slower than 1 frame at 60fps
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  public trackBundleSize(bundleName: string, size: number) {
    if (!this.metrics.bundleSizes) {
      this.metrics.bundleSizes = {};
    }
    this.metrics.bundleSizes[bundleName] = size;
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public sendMetricsToAnalytics() {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const metrics = this.getMetrics();
      
      // Send Core Web Vitals
      if (metrics.firstContentfulPaint) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: 'FCP',
          metric_value: metrics.firstContentfulPaint,
          event_category: 'performance'
        });
      }
      
      if (metrics.largestContentfulPaint) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: 'LCP',
          metric_value: metrics.largestContentfulPaint,
          event_category: 'performance'
        });
      }
      
      if (metrics.firstInputDelay) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: 'FID',
          metric_value: metrics.firstInputDelay,
          event_category: 'performance'
        });
      }
      
      if (metrics.cumulativeLayoutShift) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: 'CLS',
          metric_value: metrics.cumulativeLayoutShift,
          event_category: 'performance'
        });
      }
    }
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.isMonitoring = false;
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const monitor = getPerformanceMonitor();

  useEffect(() => {
    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [monitor]);

  const trackRender = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    monitor.trackComponentRender(componentName, renderTime);
  }, [monitor]);

  const trackBundle = useCallback((bundleName: string, size: number) => {
    monitor.trackBundleSize(bundleName, size);
  }, [monitor]);

  return {
    metrics,
    trackRender,
    trackBundle,
    sendToAnalytics: monitor.sendMetricsToAnalytics.bind(monitor)
  };
};

// Bundle size analyzer
export const BundleAnalyzer = {
  // Estimate bundle sizes using ResourceTiming API
  analyzeBundles: async (): Promise<Record<string, number>> => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bundles: Record<string, number> = {};
    
    for (const resource of resources) {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        const name = resource.name.split('/').pop() || resource.name;
        bundles[name] = resource.transferSize || resource.encodedBodySize || 0;
      }
    }
    
    return bundles;
  },

  // Check for unused code using Coverage API (if available)
  checkUnusedCode: async (): Promise<{ js: number; css: number }> => {
    if ('chrome' in window && 'runtime' in (window as any).chrome) {
      try {
        // This would require additional permissions in a real extension
        // For now, we'll estimate based on other metrics
        return { js: 0, css: 0 };
      } catch (error) {
        console.warn('Coverage API not available');
      }
    }
    
    return { js: 0, css: 0 };
  },

  // Analyze critical rendering path
  analyzeCriticalPath: (): string[] => {
    const critical: string[] = [];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    for (const resource of resources) {
      // Resources that block rendering
      if (resource.name.includes('.css') && (resource as any).renderBlockingStatus === 'blocking') {
        critical.push(resource.name);
      }
    }
    
    return critical;
  }
};

// Performance optimization recommendations
export const PerformanceOptimizer = {
  getRecommendations: (metrics: Partial<PerformanceMetrics>): string[] => {
    const recommendations: string[] = [];
    
    // Core Web Vitals recommendations
    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      recommendations.push('LCP is slow. Consider optimizing images and preloading key resources.');
    }
    
    if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
      recommendations.push('FID is high. Consider reducing JavaScript execution time.');
    }
    
    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('CLS is high. Ensure size attributes on images and avoid inserting content above existing content.');
    }
    
    // Bundle size recommendations
    if (metrics.bundleSizes) {
      const totalBundleSize = Object.values(metrics.bundleSizes).reduce((sum, size) => sum + size, 0);
      if (totalBundleSize > 500 * 1024) { // 500KB
        recommendations.push('Bundle size is large. Consider code splitting and tree shaking.');
      }
    }
    
    // Memory recommendations
    if (metrics.jsHeapSize && metrics.jsHeapSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected. Check for memory leaks and optimize data structures.');
    }
    
    // Component render recommendations
    if (metrics.componentRenderTimes) {
      const slowComponents = Object.entries(metrics.componentRenderTimes)
        .filter(([, time]) => time > 16)
        .map(([name]) => name);
      
      if (slowComponents.length > 0) {
        recommendations.push(`Slow components detected: ${slowComponents.join(', ')}. Consider memoization or optimization.`);
      }
    }
    
    return recommendations;
  },

  // Auto-optimize based on metrics
  autoOptimize: async (metrics: Partial<PerformanceMetrics>): Promise<void> => {
    // Preload critical resources
    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      const criticalResources = BundleAnalyzer.analyzeCriticalPath();
      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.css') ? 'style' : 'script';
        document.head.appendChild(link);
      });
    }
    
    // Enable compression for large bundles
    if (metrics.bundleSizes) {
      const totalSize = Object.values(metrics.bundleSizes).reduce((sum, size) => sum + size, 0);
      if (totalSize > 200 * 1024 && 'serviceWorker' in navigator) {
        // Service worker can handle compression
        console.log('Large bundle detected, service worker compression recommended');
      }
    }
  }
};

// React HOC for performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName?: string
) {
  const TrackedComponent = (props: P) => {
    const { trackRender } = usePerformanceMonitoring();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
    
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        trackRender(name, startTime);
      };
    }, [trackRender, name]);
    
    return <WrappedComponent {...props} />;
  };
  
  TrackedComponent.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return TrackedComponent;
}

export default {
  PerformanceMonitor,
  getPerformanceMonitor,
  usePerformanceMonitoring,
  BundleAnalyzer,
  PerformanceOptimizer,
  withPerformanceTracking
};