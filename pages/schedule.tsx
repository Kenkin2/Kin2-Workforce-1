import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import DragDropCalendar from "@/components/calendar/drag-drop-calendar";
import MobileCalendar from '@/components/calendar/mobile-calendar';
import RecurringShifts from '@/components/scheduling/recurring-shifts';
import WorkerAvailability from '@/components/scheduling/worker-availability';
import ShiftTemplates from '@/components/scheduling/shift-templates';
import SchedulingAnalytics from '@/components/scheduling/analytics';
import CalendarIntegrations from '@/components/scheduling/integrations';
import ComplianceTracking from '@/components/scheduling/calendar-integration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Schedule() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
      <div className="h-screen flex items-center justify-center" data-testid="loader-schedule">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Schedule"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Schedule" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Advanced Schedule Management</h2>
            <p className="text-muted-foreground" data-testid="text-page-description">Comprehensive workforce scheduling with analytics and automation</p>
          </div>
        </div>

        {/* Advanced Scheduling Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6" data-testid="tabs-schedule">
          <TabsList className="grid w-full grid-cols-7" data-testid="tabslist-schedule">
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
            <TabsTrigger value="recurring" data-testid="tab-recurring">Recurring</TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
            <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6" data-testid="tabcontent-calendar">
            {/* Desktop Calendar */}
            <div className="hidden md:block" data-testid="container-desktop-calendar">
              <DragDropCalendar />
            </div>
            
            {/* Mobile Calendar */}
            <div data-testid="container-mobile-calendar">
              <MobileCalendar 
                shifts={[]}
                onCreateShift={() => {}}
                onEditShift={() => {}}
                onDeleteShift={() => {}}
                isLoading={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="recurring" data-testid="tabcontent-recurring">
            <RecurringShifts />
          </TabsContent>

          <TabsContent value="templates" data-testid="tabcontent-templates">
            <ShiftTemplates />
          </TabsContent>

          <TabsContent value="availability" data-testid="tabcontent-availability">
            <WorkerAvailability />
          </TabsContent>

          <TabsContent value="analytics" data-testid="tabcontent-analytics">
            <SchedulingAnalytics />
          </TabsContent>

          <TabsContent value="integrations" data-testid="tabcontent-integrations">
            <CalendarIntegrations />
          </TabsContent>

          <TabsContent value="compliance" data-testid="tabcontent-compliance">
            <ComplianceTracking />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
