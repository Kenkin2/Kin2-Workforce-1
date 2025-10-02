import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function TopPerformers() {
  const { data: workers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/workers"],
  });

  const mockPerformers = [
    {
      name: "Emma Thompson",
      role: "Senior Developer",
      score: 95,
      karmaCoins: 2450,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    },
    {
      name: "David Lee",
      role: "Project Manager",
      score: 92,
      karmaCoins: 2120,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    },
    {
      name: "Lisa Chen",
      role: "UX Designer",
      score: 89,
      karmaCoins: 1890,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
    },
  ];

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Top Performers</CardTitle>
          <Link href="/workers">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="button-view-all-performers">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {mockPerformers.map((performer, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0" data-testid={`performer-${index}`}>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={performer.avatar} alt={performer.name} />
                    <AvatarFallback>
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate" data-testid={`performer-name-${index}`}>
                      {performer.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`performer-role-${index}`}>
                      {performer.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-2 w-full sm:w-auto sm:text-right">
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <Progress value={performer.score} className="w-full sm:w-16" />
                    <span className="text-xs font-medium text-foreground whitespace-nowrap" data-testid={`performer-score-${index}`}>
                      {performer.score}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`performer-karma-${index}`}>
                    {performer.karmaCoins.toLocaleString()} KC
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
