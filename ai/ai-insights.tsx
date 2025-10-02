import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Users, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery<{ insights: string }>({
    queryKey: ['/api/ai/insights'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai/insights');
      return response as unknown as { insights: string };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {insights?.insights || 'No insights available at this time.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}