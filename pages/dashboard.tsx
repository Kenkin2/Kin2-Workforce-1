import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import KpiCards from "@/components/dashboard/kpi-cards";
import RecentJobs from "@/components/dashboard/recent-jobs";
import ScheduleOverview from "@/components/dashboard/schedule-overview";
import PendingApprovals from "@/components/dashboard/pending-approvals";
import RevenueChart from "@/components/dashboard/revenue-chart";
import TopPerformers from "@/components/dashboard/top-performers";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { Button } from "@/components/ui/button";
import { Briefcase, Play, BookOpen, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center" data-testid="loader-dashboard">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Dashboard"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg p-4 sm:p-6 shadow-lg" data-testid="banner-welcome">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-welcome-title">Welcome to Kin2 Workforce!</h2>
              <p className="text-sm sm:text-base text-primary-foreground/90 mb-4" data-testid="text-welcome-description">
                Get started with our comprehensive workforce management platform. Everything you need is right here.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setLocation('/jobs')}
                  data-testid="button-create-first-job"
                  className="w-full sm:w-auto"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create Your First Job
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-tour-from-banner"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Take a Tour
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setLocation('/compliance-dashboard')}
                  data-testid="button-compliance-from-banner"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Compliance
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex">
              <div className="w-24 h-24 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary-foreground/80" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards />
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Jobs - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentJobs />
          </div>
          
          {/* Right sidebar content */}
          <div className="space-y-6">
            <ScheduleOverview />
            <PendingApprovals />
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <TopPerformers />
        </div>

        {/* Recent Activity Feed */}
        <ActivityFeed />
      </div>
    </AppLayout>
  );
}
