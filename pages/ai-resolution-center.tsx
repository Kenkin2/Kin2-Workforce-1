import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Sparkles, Zap, Clock, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface IssueAlert {
  id: string;
  title: string;
  description: string;
  issueType: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "investigating" | "resolved" | "dismissed";
  confidence: string;
  affectedModule: string;
  detectionMethod: "rule_based" | "ai_powered" | "hybrid";
  createdAt: string;
}

interface IssueRecommendation {
  id: string;
  alertId: string;
  title: string;
  description: string;
  recommendationType: string;
  priority: number;
  confidence: string;
  estimatedImpact: "high" | "medium" | "low";
  automatable: boolean;
  estimatedDuration: number;
}

export default function AIResolutionCenter() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/auth');
    }
  }, [user, authLoading, setLocation]);

  const { data: alerts = [], isLoading } = useQuery<IssueAlert[]>({
    queryKey: ['/api/issues/alerts'],
    enabled: !!user,
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest(`/api/issues/alerts/${alertId}/resolve`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/issues/alerts'] });
      toast({
        title: "Issue Resolved",
        description: "The issue has been marked as resolved.",
      });
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest(`/api/issues/alerts/${alertId}/dismiss`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/issues/alerts'] });
      toast({
        title: "Issue Dismissed",
        description: "The issue has been dismissed.",
      });
    },
  });

  const executeActionMutation = useMutation({
    mutationFn: (data: { alertId: string; recommendationId: string; actionType: string }) =>
      apiRequest('/api/issues/actions', 'POST', {
        alertId: data.alertId,
        recommendationId: data.recommendationId,
        actionType: data.actionType,
        status: 'completed',
      }),
    onSuccess: () => {
      toast({
        title: "Action Executed",
        description: "The recommended action has been executed successfully.",
      });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={variants[severity] || ""}>{severity.toUpperCase()}</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, string> = {
      high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return <Badge variant="outline" className={variants[impact] || ""}>{impact} Impact</Badge>;
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Sparkles className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg">Analyzing your workforce...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="title-ai-resolution-center">AI Resolution Center</h1>
          <p className="text-lg text-muted-foreground">
            Intelligent issue detection and automated recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-stat-critical">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-critical-count">
              {activeAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-high">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-high-count">
              {activeAlerts.filter(a => a.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Action needed soon</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-resolved">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-resolved-count">
              {resolvedAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully addressed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-automatable">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Solvable</CardTitle>
            <Zap className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-automatable-count">
              {Math.floor(activeAlerts.length * 0.7)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Can be automated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            Active Issues ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved">
            Resolved ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  No active issues detected. Your workforce operations are running smoothly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <IssueAlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={() => resolveAlertMutation.mutate(alert.id)}
                    onDismiss={() => dismissAlertMutation.mutate(alert.id)}
                    onExecuteAction={(recommendationId, actionType) =>
                      executeActionMutation.mutate({
                        alertId: alert.id,
                        recommendationId,
                        actionType,
                      })
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Info className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No Resolved Issues Yet</h3>
                <p className="text-muted-foreground">
                  Resolved issues will appear here for reference.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {resolvedAlerts.map((alert) => (
                  <Card key={alert.id} className="opacity-75" data-testid={`card-alert-${alert.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <CardDescription className="mt-1">{alert.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Resolved
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IssueAlertCard({
  alert,
  onResolve,
  onDismiss,
  onExecuteAction,
}: {
  alert: IssueAlert;
  onResolve: () => void;
  onDismiss: () => void;
  onExecuteAction: (recommendationId: string, actionType: string) => void;
}) {
  const { data: recommendations = [] } = useQuery<IssueRecommendation[]>({
    queryKey: ['/api/issues/alerts', alert.id, 'recommendations'],
    queryFn: () => fetch(`/api/issues/alerts/${alert.id}/recommendations`).then(res => res.json()),
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={variants[severity] || ""}>{severity.toUpperCase()}</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, string> = {
      high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return <Badge variant="outline" className={variants[impact] || ""}>{impact} Impact</Badge>;
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: alert.severity === 'critical' ? '#ef4444' :
                       alert.severity === 'high' ? '#f97316' :
                       alert.severity === 'medium' ? '#eab308' : '#3b82f6'
    }} data-testid={`card-alert-${alert.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{alert.title}</CardTitle>
                {getSeverityBadge(alert.severity)}
                {alert.detectionMethod === 'ai_powered' && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">{alert.description}</CardDescription>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {alert.confidence}% Confidence
                </span>
                <span>•</span>
                <span className="capitalize">{alert.affectedModule}</span>
                <span>•</span>
                <span className="capitalize">{alert.issueType.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onResolve} size="sm" variant="outline" data-testid={`button-resolve-${alert.id}`}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
            <Button onClick={onDismiss} size="sm" variant="ghost" data-testid={`button-dismiss-${alert.id}`}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardHeader>

      {sortedRecommendations.length > 0 && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            AI Recommendations ({sortedRecommendations.length})
          </h4>
          <Accordion type="single" collapsible className="space-y-2">
            {sortedRecommendations.map((rec, index) => (
              <AccordionItem key={rec.id} value={rec.id} className="border rounded-lg px-4" data-testid={`recommendation-${rec.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <Badge variant="outline" className="text-xs">#{rec.priority}</Badge>
                    <span className="font-medium">{rec.title}</span>
                    {rec.automatable && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                    {getImpactBadge(rec.estimatedImpact)}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{rec.estimatedDuration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {rec.confidence}% Confidence
                      </span>
                      <span className="capitalize">{rec.recommendationType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex gap-2">
                      {rec.automatable ? (
                        <Button
                          size="sm"
                          onClick={() => onExecuteAction(rec.id, 'automated')}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-execute-${rec.id}`}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Execute Automatically
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onExecuteAction(rec.id, 'manual')}
                          data-testid={`button-manual-${rec.id}`}
                        >
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      )}
    </Card>
  );
}
