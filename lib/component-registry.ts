// Component registry for better organization and lazy loading
import { lazy, ComponentType } from 'react';

// Core component types
interface ComponentInfo {
  component: ComponentType<any>;
  path: string;
  category: 'page' | 'ui' | 'layout' | 'form' | 'chart' | 'security';
  lazy?: boolean;
  preload?: boolean;
}

// Lazy-loaded page components
const LazyPages = {
  Dashboard: lazy(() => import('@/pages/dashboard')),
  Jobs: lazy(() => import('@/pages/jobs')),
  Schedule: lazy(() => import('@/pages/schedule')),
  Timesheets: lazy(() => import('@/pages/timesheets')),
  Learning: lazy(() => import('@/pages/learning')),
  Analytics: lazy(() => import('@/pages/analytics')),
  Settings: lazy(() => import('@/pages/settings')),
  // Profile: lazy(() => import('@/pages/profile')),
  // Notifications: lazy(() => import('@/pages/notifications')),
  // Help: lazy(() => import('@/pages/help')),
  
  // Management pages
  UserManagement: lazy(() => import('@/pages/user-management')),
  // OrganizationSettings: lazy(() => import('@/pages/organization-settings')),
  Reports: lazy(() => import('@/pages/reports')),
  // Billing: lazy(() => import('@/pages/billing')),
  
  // Advanced features
  // AI: lazy(() => import('@/pages/ai')),
  // Mobile: lazy(() => import('@/pages/mobile')),
  // Performance: lazy(() => import('@/pages/performance')),
  // Security: lazy(() => import('@/pages/security')),
  
  // Specialized pages
  // GovernmentReports: lazy(() => import('@/pages/government-reports')),
  ComplianceDashboard: lazy(() => import('@/pages/compliance-dashboard')),
  GraphicsShowcase: lazy(() => import('@/pages/graphics-showcase')),
  PWASettings: lazy(() => import('@/pages/pwa-settings'))
};

// UI Components registry
const UIComponents = {
  // Form components
  SecureForm: lazy(() => import('@/components/ui/secure-form').then(m => ({ default: m.SecureForm }))),
  SecurePasswordInput: lazy(() => import('@/components/ui/secure-form').then(m => ({ default: m.SecurePasswordInput }))),
  SecureTextInput: lazy(() => import('@/components/ui/secure-form').then(m => ({ default: m.SecureTextInput }))),
  SecureFileInput: lazy(() => import('@/components/ui/secure-form').then(m => ({ default: m.SecureFileInput }))),
  
  // Loading components
  LoadingSkeleton: lazy(() => import('@/components/ui/loading-skeleton').then(m => ({ default: (m as any).default || m }))),
  PageLoader: lazy(() => import('@/components/ui/page-loader').then(m => ({ default: (m as any).default || m }))),
  
  // Error components
  ErrorBoundary: lazy(() => import('@/components/ui/error-boundary').then(m => ({ default: (m as any).default || m }))),
  
  // PWA components
  PWAInstallPrompt: lazy(() => import('@/components/ui/pwa-install-prompt').then(m => ({ default: m.PWAInstallPrompt }))),
  OfflineIndicator: lazy(() => import('@/components/ui/offline-indicator').then(m => ({ default: m.OfflineIndicator }))),
  
  // Accessibility components
  SkipLinks: lazy(() => import('@/components/ui/skip-links').then(m => ({ default: (m as any).default || m }))),
  AriaLive: lazy(() => import('@/components/ui/aria-live').then(m => ({ default: (m as any).default || m }))),
  
  // Security components
  SecurityDashboard: lazy(() => import('@/components/security/security-dashboard').then(m => ({ default: m.SecurityDashboard })))
};

// Component registry with metadata
export const ComponentRegistry: Record<string, ComponentInfo> = {
  // Pages
  ...Object.entries(LazyPages).reduce((acc, [name, component]) => {
    acc[name] = {
      component,
      path: `@/pages/${name.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}`,
      category: 'page',
      lazy: true,
      preload: ['Dashboard', 'Jobs', 'Schedule'].includes(name)
    };
    return acc;
  }, {} as Record<string, ComponentInfo>),
  
  // UI Components
  ...Object.entries(UIComponents).reduce((acc, [name, component]) => {
    acc[name] = {
      component,
      path: `@/components/ui/${name.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}`,
      category: name.includes('Form') ? 'form' : 
                name.includes('Security') ? 'security' : 'ui',
      lazy: true,
      preload: ['ErrorBoundary', 'LoadingSkeleton'].includes(name)
    };
    return acc;
  }, {} as Record<string, ComponentInfo>)
};

// Preload critical components
export const preloadCriticalComponents = async () => {
  const criticalComponents = Object.entries(ComponentRegistry)
    .filter(([, info]) => info.preload)
    .map(([, info]) => info.component);
  
  // Preload components in parallel
  await Promise.allSettled(
    criticalComponents.map(component => {
      if ('$$typeof' in component && typeof component === 'object') {
        // This is a lazy component, trigger the import
        return (component as any)._payload?._result || Promise.resolve();
      }
      return Promise.resolve();
    })
  );
};

// Get component by name with error handling
export const getComponent = (name: string): ComponentType<any> | null => {
  const componentInfo = ComponentRegistry[name];
  if (!componentInfo) {
    console.warn(`Component "${name}" not found in registry`);
    return null;
  }
  return componentInfo.component;
};

// Get components by category
export const getComponentsByCategory = (category: ComponentInfo['category']): ComponentInfo[] => {
  return Object.values(ComponentRegistry).filter(info => info.category === category);
};

// Component performance monitoring
export const ComponentPerformance = {
  // Track component render times
  trackRender: (componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Longer than 1 frame at 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    // Log to analytics in production
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'component_render', {
        component_name: componentName,
        render_time: renderTime,
        event_category: 'performance'
      });
    }
  },
  
  // Track component bundle sizes
  trackBundleSize: (componentName: string, size: number) => {
    console.debug(`Component bundle size: ${componentName} - ${(size / 1024).toFixed(2)}KB`);
    
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'component_bundle_size', {
        component_name: componentName,
        bundle_size: size,
        event_category: 'performance'
      });
    }
  }
};

export default ComponentRegistry;