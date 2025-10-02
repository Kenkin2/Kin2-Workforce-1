import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse shimmer" 
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-muted/50 to-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-muted/50 to-muted rounded w-3/4"></div>
            <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/60 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-gradient-to-r from-primary/30 to-secondary/30 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card 
          key={i} 
          className="animate-pulse shimmer" 
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gradient-to-r from-muted/50 to-muted rounded w-3/4"></div>
                <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/60 rounded w-1/2"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-gradient-to-r from-muted/40 to-muted rounded"></div>
              <div className="h-3 bg-gradient-to-r from-muted/20 to-muted/50 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card 
          key={i} 
          className="animate-pulse shimmer" 
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gradient-to-r from-muted/50 to-muted rounded w-1/2"></div>
            <div className="w-5 h-5 bg-gradient-to-br from-primary/30 to-secondary/30 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gradient-to-r from-primary/40 to-secondary/40 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-muted/30 to-muted/60 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full mb-4" />
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex space-x-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="hidden md:block w-20 h-20 rounded-full" />
        </div>
      </div>
      
      {/* Stats Cards */}
      <StatsSkeleton />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}