import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Target, TrendingUp, CheckCircle } from "lucide-react";

export default function AIAutomation() {
  const { data: recommendations, isLoading } = useQuery<{ recommendations: string[] }>({
    queryKey: ['/api/ai/automation'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai/automation');
      return response as unknown as { recommendations: string[] };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            AI Automation Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const automationRecommendations = recommendations?.recommendations || [];

  const getAutomationIcon = (index: number) => {
    const icons = [Clock, Target, TrendingUp, CheckCircle, Zap];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5 text-orange-500" />;
  };

  const getPriorityColor = (index: number) => {
    if (index === 0) return "bg-red-500/10 text-red-700 border-red-200";
    if (index === 1) return "bg-orange-500/10 text-orange-700 border-orange-200";
    return "bg-blue-500/10 text-blue-700 border-blue-200";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          AI Automation Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {automationRecommendations.length > 0 ? (
          <div className="space-y-4">
            {automationRecommendations.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-900/10 dark:to-yellow-900/10">
                <div className="flex-shrink-0 mt-0.5">
                  {getAutomationIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed" data-testid={`automation-recommendation-${index}`}>
                    {recommendation}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={getPriorityColor(index)}>
                      {index === 0 ? 'High Priority' : index === 1 ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-6 px-2"
                      data-testid={`button-implement-${index}`}
                    >
                      Implement
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 These recommendations are generated based on your current workforce data and can help automate repetitive tasks to improve efficiency.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No automation recommendations available at this time.</p>
            <p className="text-sm text-muted-foreground mt-1">
              The AI will analyze your workflow patterns and suggest automation opportunities.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}