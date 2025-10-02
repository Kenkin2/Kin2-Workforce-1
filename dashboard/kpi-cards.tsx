import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

export default function KpiCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const kpis = [
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      change: "+12%",
      changeType: "positive",
      icon: "fas fa-briefcase",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "kpi-active-jobs"
    },
    {
      title: "Total Workers",
      value: stats?.totalWorkers || 0,
      change: "+8%",
      changeType: "positive",
      icon: "fas fa-users",
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
      testId: "kpi-total-workers"
    },
    {
      title: "Monthly Revenue",
      value: `£${stats?.monthlyRevenue?.toLocaleString() || "0"}`,
      change: "+23%",
      changeType: "positive",
      icon: "fas fa-pound-sign",
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
      testId: "kpi-monthly-revenue"
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      change: "-0.5%",
      changeType: "negative",
      icon: "fas fa-check-circle",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "kpi-completion-rate"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse shimmer">
            <CardContent className="p-6">
              <div className="h-20 bg-gradient-to-r from-muted/30 to-muted/60 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
      {kpis.map((kpi, index) => (
        <Card 
          key={kpi.title} 
          className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-scaleIn group cursor-pointer" 
          data-testid={kpi.testId}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent" data-testid={`${kpi.testId}-value`}>
                  {kpi.value}
                </p>
                <p className={cn(
                  "text-xs flex items-center mt-1",
                  kpi.changeType === "positive" ? "text-secondary" : "text-muted-foreground"
                )}>
                  <i className={cn(
                    "mr-1",
                    kpi.changeType === "positive" ? "fas fa-arrow-up" : "fas fa-minus"
                  )}></i>
                  {kpi.change} from last month
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br transition-all duration-300 group-hover:scale-110", kpi.bgColor)}>
                <i className={cn(kpi.icon, kpi.iconColor, "text-xl group-hover:animate-pulse")}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
