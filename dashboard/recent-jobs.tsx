import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Link, useLocation } from "wouter";
import { Briefcase, Plus } from "lucide-react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import type { Job } from "@shared/schema";

export default function RecentJobs() {
  const [, setLocation] = useLocation();
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  const { canManageJobs } = useRoleAccess();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "closed": return "secondary";
      case "paused": return "outline";
      default: return "outline";
    }
  };

  const getCompanyImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"
    ];
    return images[index % images.length];
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Jobs</CardTitle>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="button-view-all-jobs">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.slice(0, 3).map((job, index) => (
              <div 
                key={job.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
                data-testid={`recent-job-${job.id}`}
              >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <img 
                    src={getCompanyImage(index)} 
                    alt="Company Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate" data-testid={`recent-job-title-${job.id}`}>
                      {job.title}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">Organization</p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{job.jobType}</span>
                      <span className="text-xs text-muted-foreground truncate">{job.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right flex-shrink-0">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    {job.salary && (
                      <p className="font-semibold text-foreground text-sm sm:text-base" data-testid={`recent-job-salary-${job.id}`}>
                        £{parseInt(job.salary).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`recent-job-date-${job.id}`}>
                      {new Date(job.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(job.status)} data-testid={`recent-job-status-${job.id}`}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            description={canManageJobs ? "Start by posting your first job" : "No jobs available at this time"}
            action={canManageJobs ? {
              label: "Post Job",
              onClick: () => setLocation('/jobs'),
              testId: "button-post-job-from-dashboard"
            } : undefined}
            variant="compact"
          />
        )}
      </CardContent>
    </Card>
  );
}
