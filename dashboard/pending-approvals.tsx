import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Timesheet } from "@shared/schema";

export default function PendingApprovals() {
  const { data: pendingTimesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets/pending"],
  });

  const approvalTypes = [
    { type: "Timesheet", worker: "John Smith", icon: "fas fa-clock" },
    { type: "Leave Request", worker: "Sarah Wilson", icon: "fas fa-calendar" },
    { type: "Expense Claim", worker: "Mike Johnson", icon: "fas fa-receipt" },
  ];

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Pending Approvals</CardTitle>
          <Badge variant="destructive" data-testid="badge-pending-count">
            {pendingTimesheets?.length || 7}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {approvalTypes.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                data-testid={`approval-item-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className={cn(item.icon, "text-primary text-sm")}></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`approval-type-${index}`}>
                      {item.type}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`approval-worker-${index}`}>
                      {item.worker}
                    </p>
                  </div>
                </div>
                <Link href="/timesheets">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                    data-testid={`button-review-${index}`}
                  >
                    Review
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
