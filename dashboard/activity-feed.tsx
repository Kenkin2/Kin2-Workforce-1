import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Activity as ActivityIcon } from "lucide-react";
import type { Activity } from "@shared/schema";

type DisplayActivity = {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: string;
};

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "job_posted": return "fas fa-briefcase";
      case "timesheet_submitted": return "fas fa-clock";
      case "course_completed": return "fas fa-graduation-cap";
      case "user_joined": return "fas fa-user-plus";
      default: return "fas fa-bell";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "job_posted": return "text-primary";
      case "timesheet_submitted": return "text-accent";
      case "course_completed": return "text-secondary";
      case "user_joined": return "text-secondary";
      default: return "text-muted-foreground";
    }
  };

  const displayActivities: DisplayActivity[] = activities 
    ? activities.map(a => ({
        id: a.id,
        user: a.userId,
        action: a.description,
        timestamp: a.createdAt ? new Date(a.createdAt).toLocaleString() : '',
        type: a.type
      }))
    : [];

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">Recent Activity ⚡</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse shimmer">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-muted/50 to-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gradient-to-r from-muted/50 to-muted rounded w-3/4"></div>
                    <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/50 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayActivities.length > 0 ? (
          <div className="space-y-4">
            {displayActivities.slice(0, 4).map((activity, index) => (
              <div 
                key={activity.id || index} 
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-300 transform hover:scale-105 animate-slideIn group" 
                data-testid={`activity-${index}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br transition-all duration-300 group-hover:scale-110",
                  activity.type === "job_posted" ? "from-primary/20 to-primary/30" :
                  activity.type === "timesheet_submitted" ? "from-accent/20 to-accent/30" :
                  activity.type === "course_completed" ? "from-secondary/20 to-secondary/30" :
                  "from-secondary/20 to-secondary/30"
                )}>
                  <i className={cn(
                    getActivityIcon(activity.type),
                    getActivityColor(activity.type),
                    "text-sm group-hover:animate-pulse"
                  )}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium" data-testid={`activity-user-${index}`}>
                      {activity.user}
                    </span>
                    <span data-testid={`activity-action-${index}`}> {activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`activity-timestamp-${index}`}>
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ActivityIcon}
            title="No recent activity"
            description="Activity will appear here as users interact with the platform"
            variant="compact"
          />
        )}
        
        {displayActivities.length > 0 && (
          <Link href="/reports">
          <Button 
            variant="outline" 
            className="w-full mt-6 text-sm bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 font-medium border border-primary/20 hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            data-testid="button-view-all-activity"
          >
            <i className="fas fa-eye mr-2"></i>
            View All Activity
          </Button>
        </Link>
        )}
      </CardContent>
    </Card>
  );
}
