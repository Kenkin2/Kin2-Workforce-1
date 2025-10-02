import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import CookieBanner from "@/components/gdpr/cookie-banner";
import { SkipLinks } from "@/components/ui/skip-links";
import { AriaLive } from "@/components/ui/aria-live";
import { useAriaLiveRegion } from "@/hooks/useAccessibility";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { PWAInstallPrompt, useInstallPromptTiming } from "@/components/ui/pwa-install-prompt";
import { usePWA } from "@/hooks/usePWA";

// Core pages (loaded immediately)
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";

// Lazy-loaded pages for better performance
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Jobs = lazy(() => import("@/pages/jobs"));
const Schedule = lazy(() => import("@/pages/schedule"));
const Scheduling = lazy(() => import("@/pages/scheduling"));
const Timesheets = lazy(() => import("@/pages/timesheets"));
const AIDashboard = lazy(() => import("@/pages/ai-dashboard"));
const Payments = lazy(() => import("@/pages/payments"));
const Learning = lazy(() => import("@/pages/learning"));
const Reports = lazy(() => import("@/pages/reports"));
const Workers = lazy(() => import("@/pages/workers"));
const Clients = lazy(() => import("@/pages/clients"));
const Compliance = lazy(() => import("@/pages/compliance"));
const Settings = lazy(() => import("@/pages/settings"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Automation = lazy(() => import("@/pages/automation"));
const MapTracking = lazy(() => import("@/pages/map-tracking"));
const SecurityMonitoring = lazy(() => import("@/pages/security-monitoring"));
const GigManagement = lazy(() => import("@/pages/gig-management"));
const ProductsFacilities = lazy(() => import("@/pages/products-facilities"));
const HRManagement = lazy(() => import("@/pages/hr-management"));
const FinanceManagement = lazy(() => import("@/pages/finance-management"));
const CRMManagement = lazy(() => import("@/pages/crm-management"));
const OperationsManagement = lazy(() => import("@/pages/operations-management"));
const DocumentManagement = lazy(() => import("@/pages/document-management"));
const AssetManagement = lazy(() => import("@/pages/asset-management"));
const Integrations = lazy(() => import("@/pages/integrations"));
const Privacy = lazy(() => import("@/pages/privacy"));
const EnterpriseFeatures = lazy(() => import("@/pages/enterprise-features"));
const MobileDashboard = lazy(() => import("@/pages/mobile-dashboard"));
const EnhancedMobile = lazy(() => import("@/pages/enhanced-mobile"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const WorkflowAutomation = lazy(() => import("@/pages/workflow-automation"));
const PricingManagement = lazy(() => import("@/pages/pricing-management"));
const GovernmentReports = lazy(() => import("@/pages/GovernmentReports"));
const ComplianceDashboard = lazy(() => import("@/pages/compliance-dashboard"));
const GraphicsShowcase = lazy(() => import("@/pages/graphics-showcase"));
const SubscriptionPlans = lazy(() => import("@/pages/subscription-plans"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const IndustryWorkflows = lazy(() => import("@/pages/industry-workflows"));
const CollaborationHub = lazy(() => import("@/pages/collaboration-hub"));
const SecurityCenter = lazy(() => import("@/pages/security-center"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const SubscriptionManagement = lazy(() => import("@/pages/subscription-management"));
const ConnectionsManagement = lazy(() => import("@/pages/connections-management"));
const UnifiedDashboard = lazy(() => import("@/pages/unified-dashboard"));
const KarmaCoins = lazy(() => import("@/pages/karma-coins"));
const AIResolutionCenter = lazy(() => import("@/pages/ai-resolution-center"));
const MarketingManagement = lazy(() => import("@/pages/marketing-management"));
const BusinessDevelopment = lazy(() => import("@/pages/business-development"));

// Protected route wrapper that redirects to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  if (!isAuthenticated) {
    // Redirect to login - using setTimeout to avoid render conflicts
    setTimeout(() => setLocation('/login'), 0);
    return <PageLoader message="Redirecting to login..." />;
  }
  
  return <>{children}</>;
}

// Helper to combine ProtectedRoute and Suspense for lazy-loaded pages
function ProtectedLazyRoute({ component: Component, message }: { component: React.LazyExoticComponent<() => JSX.Element>, message: string }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader message={message} />}>
        <Component />
      </Suspense>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Core pages - loaded immediately */}
      <Route path="/landing" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      
      {/* Lazy-loaded platform routes with Suspense */}
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedLazyRoute component={Dashboard} message="Loading dashboard..." />
      </Route>
      <Route path="/home">
        <ProtectedLazyRoute component={Home} message="Loading dashboard..." />
      </Route>
      <Route path="/jobs">
        <ProtectedLazyRoute component={Jobs} message="Loading jobs..." />
      </Route>
      <Route path="/schedule">
        <ProtectedLazyRoute component={Schedule} message="Loading schedule..." />
      </Route>
      <Route path="/scheduling">
        <ProtectedLazyRoute component={Scheduling} message="Loading scheduling..." />
      </Route>
      <Route path="/timesheets">
        <ProtectedLazyRoute component={Timesheets} message="Loading timesheets..." />
      </Route>
      <Route path="/ai">
        <ProtectedLazyRoute component={AIDashboard} message="Loading AI dashboard..." />
      </Route>
      <Route path="/ai/resolution-center">
        <ProtectedLazyRoute component={AIResolutionCenter} message="Loading AI Resolution Center..." />
      </Route>
      <Route path="/subscription">
        <ProtectedLazyRoute component={SubscriptionPlans} message="Loading subscription plans..." />
      </Route>
      <Route path="/marketplace">
        <ProtectedLazyRoute component={Marketplace} message="Loading marketplace..." />
      </Route>
      <Route path="/workflows">
        <ProtectedLazyRoute component={IndustryWorkflows} message="Loading industry workflows..." />
      </Route>
      <Route path="/collaboration">
        <ProtectedLazyRoute component={CollaborationHub} message="Loading collaboration hub..." />
      </Route>
      <Route path="/security">
        <ProtectedLazyRoute component={SecurityCenter} message="Loading security center..." />
      </Route>
      <Route path="/payments">
        <ProtectedLazyRoute component={Payments} message="Loading payments..." />
      </Route>
      <Route path="/learning">
        <ProtectedLazyRoute component={Learning} message="Loading learning center..." />
      </Route>
      <Route path="/reports">
        <ProtectedLazyRoute component={Reports} message="Loading reports..." />
      </Route>
      <Route path="/analytics">
        <ProtectedLazyRoute component={Analytics} message="Loading analytics..." />
      </Route>
      <Route path="/automation">
        <ProtectedLazyRoute component={Automation} message="Loading automation..." />
      </Route>
      <Route path="/workers">
        <ProtectedLazyRoute component={Workers} message="Loading workers..." />
      </Route>
      <Route path="/clients">
        <ProtectedLazyRoute component={Clients} message="Loading clients..." />
      </Route>
      <Route path="/compliance">
        <ProtectedLazyRoute component={Compliance} message="Loading compliance..." />
      </Route>
      <Route path="/settings">
        <ProtectedLazyRoute component={Settings} message="Loading settings..." />
      </Route>
      <Route path="/users">
        <ProtectedLazyRoute component={UserManagement} message="Loading user management..." />
      </Route>
      <Route path="/map-tracking">
        <ProtectedLazyRoute component={MapTracking} message="Loading map tracking..." />
      </Route>
      <Route path="/security-monitoring">
        <ProtectedLazyRoute component={SecurityMonitoring} message="Loading security monitoring..." />
      </Route>
      <Route path="/gig-management">
        <ProtectedLazyRoute component={GigManagement} message="Loading gig management..." />
      </Route>
      <Route path="/products-facilities">
        <ProtectedLazyRoute component={ProductsFacilities} message="Loading products & facilities..." />
      </Route>
      <Route path="/hr-management">
        <ProtectedLazyRoute component={HRManagement} message="Loading HR management..." />
      </Route>
      <Route path="/finance-management">
        <ProtectedLazyRoute component={FinanceManagement} message="Loading finance management..." />
      </Route>
      <Route path="/crm-management">
        <ProtectedLazyRoute component={CRMManagement} message="Loading CRM management..." />
      </Route>
      <Route path="/marketing-management">
        <ProtectedLazyRoute component={MarketingManagement} message="Loading marketing management..." />
      </Route>
      <Route path="/business-development">
        <ProtectedLazyRoute component={BusinessDevelopment} message="Loading business development..." />
      </Route>
      <Route path="/operations-management">
        <ProtectedLazyRoute component={OperationsManagement} message="Loading operations management..." />
      </Route>
      <Route path="/document-management">
        <ProtectedLazyRoute component={DocumentManagement} message="Loading document management..." />
      </Route>
      <Route path="/asset-management">
        <ProtectedLazyRoute component={AssetManagement} message="Loading asset management..." />
      </Route>
      <Route path="/integrations">
        <ProtectedLazyRoute component={Integrations} message="Loading integrations..." />
      </Route>
      <Route path="/privacy">
        <Suspense fallback={<PageLoader message="Loading privacy policy..." />}>
          <Privacy />
        </Suspense>
      </Route>
      <Route path="/admin">
        <ProtectedLazyRoute component={AdminDashboard} message="Loading admin dashboard..." />
      </Route>
      <Route path="/workflow-automation">
        <ProtectedLazyRoute component={WorkflowAutomation} message="Loading workflow automation..." />
      </Route>
      <Route path="/pricing">
        <ProtectedLazyRoute component={PricingManagement} message="Loading pricing management..." />
      </Route>
      <Route path="/enterprise">
        <ProtectedLazyRoute component={EnterpriseFeatures} message="Loading enterprise features..." />
      </Route>
      <Route path="/mobile">
        <ProtectedLazyRoute component={MobileDashboard} message="Loading mobile dashboard..." />
      </Route>
      <Route path="/mobile-enhanced">
        <ProtectedLazyRoute component={EnhancedMobile} message="Loading enhanced mobile features..." />
      </Route>
      <Route path="/government-reports">
        <ProtectedLazyRoute component={GovernmentReports} message="Loading government reports..." />
      </Route>
      <Route path="/compliance-dashboard">
        <ProtectedLazyRoute component={ComplianceDashboard} message="Loading compliance dashboard..." />
      </Route>
      <Route path="/graphics-showcase">
        <ProtectedLazyRoute component={GraphicsShowcase} message="Loading graphics showcase..." />
      </Route>
      <Route path="/subscription-management">
        <ProtectedLazyRoute component={SubscriptionManagement} message="Loading subscription management..." />
      </Route>
      <Route path="/connections-management">
        <ProtectedLazyRoute component={ConnectionsManagement} message="Loading connections management..." />
      </Route>
      <Route path="/unified-dashboard">
        <ProtectedLazyRoute component={UnifiedDashboard} message="Loading unified dashboard..." />
      </Route>
      <Route path="/karma-coins">
        <ProtectedLazyRoute component={KarmaCoins} message="Loading karma coins..." />
      </Route>
      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { message, announce } = useAriaLiveRegion();
  const { shouldShow, dismissPrompt } = useInstallPromptTiming();
  const { updateAvailable, updateApp } = usePWA();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SkipLinks />
          <AriaLive message={message} />
          <OfflineIndicator variant="banner" />
          
          {/* PWA Install Prompt */}
          {shouldShow && (
            <PWAInstallPrompt variant="banner" onDismiss={dismissPrompt} />
          )}
          
          {/* PWA Update Notification */}
          {updateAvailable && (
            <div className="bg-blue-50 border-b border-blue-200 p-3">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <p className="text-sm text-blue-800">
                    A new version of Kin2 Workforce is available!
                  </p>
                </div>
                <button 
                  onClick={updateApp}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Update Now
                </button>
              </div>
            </div>
          )}
          
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
          <ErrorBoundary>
            <CookieBanner />
          </ErrorBoundary>
          <ErrorBoundary>
            <Toaster />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
