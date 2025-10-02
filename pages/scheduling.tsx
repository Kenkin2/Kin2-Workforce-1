import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import SchedulingCalendar from "@/components/ui/scheduling-calendar";
import SmartScheduling from "@/components/ai/smart-scheduling";
import AIInsights from "@/components/ai/ai-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CalendarPlus, CalendarDays, Users, CheckCircle, Clock, User, Pencil } from "lucide-react";

export default function Scheduling() {
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
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Scheduling"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Scheduling" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Shift Scheduling</h2>
            <p className="text-muted-foreground">Manage worker schedules and shift assignments</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-export-schedule">
              <Download className="w-4 h-4 mr-2" />
              Export Schedule
            </Button>
            <Button data-testid="button-bulk-schedule">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Bulk Schedule
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Shifts scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Workers</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Ready for shifts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Shifts covered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Smart Scheduling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SmartScheduling />
          </div>
          <div>
            <AIInsights />
          </div>
        </div>

        {/* Main Calendar */}
        <SchedulingCalendar />

        {/* Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
            <CardDescription>Next 7 days scheduled shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "1",
                  worker: "John Smith",
                  job: "Senior Frontend Developer",
                  date: "Jan 15, 2024",
                  time: "09:00 - 17:00",
                  status: "confirmed",
                  client: "TechCorp Ltd"
                },
                {
                  id: "2", 
                  worker: "Sarah Wilson",
                  job: "UI/UX Designer",
                  date: "Jan 15, 2024", 
                  time: "17:00 - 23:00",
                  status: "pending",
                  client: "StartupXYZ"
                },
                {
                  id: "3",
                  worker: "Mike Johnson",
                  job: "Full Stack Developer",
                  date: "Jan 16, 2024",
                  time: "23:00 - 07:00",
                  status: "confirmed",
                  client: "Enterprise Corp"
                }
              ].map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{shift.worker}</h3>
                      <p className="text-sm text-muted-foreground">{shift.job} • {shift.client}</p>
                      <p className="text-sm text-muted-foreground">{shift.date} • {shift.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={shift.status === "confirmed" ? "default" : "secondary"}
                      className={shift.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : ""}
                    >
                      {shift.status === "confirmed" ? "Confirmed" : "Pending"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}