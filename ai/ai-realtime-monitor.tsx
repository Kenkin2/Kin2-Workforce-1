import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  Zap,
  Brain,
  Eye,
  Bell,
  Target,
  Gauge
} from "lucide-react";

interface RealtimeMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: Date;
  change24h: number;
  predictions: {
    next1h: number;
    next4h: number;
    next24h: number;
  };
}

interface Alert {
  id: string;
  type: 'performance' | 'capacity' | 'efficiency' | 'satisfaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  affectedEmployees?: number;
  estimatedImpact?: string;
}

interface AIInsight {
  id: string;
  category: 'optimization' | 'prediction' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionRequired: boolean;
  potentialSavings?: string;
  timeToImplement?: string;
}

export default function AIRealtimeMonitor() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '24h'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Real-time metrics query
  const { data: realtimeMetrics = [], refetch: refetchMetrics } = useQuery<RealtimeMetric[]>({
    queryKey: ['/api/ai/realtime-metrics'],
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
    enabled: true
  });

  // AI alerts query
  const { data: realtimeAlerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/ai/alerts'],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute
    enabled: true
  });

  // AI insights query
  const { data: aiInsights = [] } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/insights/realtime'],
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes
    enabled: true
  });

  useEffect(() => {
    setAlerts(realtimeAlerts);
  }, [realtimeAlerts]);

  useEffect(() => {
    setInsights(aiInsights);
  }, [aiInsights]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Mock data for demonstration
  const mockMetrics: RealtimeMetric[] = [
    {
      id: 'productivity',
      name: 'Team Productivity',
      value: 87,
      target: 85,
      trend: 'up',
      status: 'excellent',
      lastUpdated: new Date(),
      change24h: 5.2,
      predictions: { next1h: 88, next4h: 86, next24h: 89 }
    },
    {
      id: 'efficiency',
      name: 'Operational Efficiency',
      value: 78,
      target: 80,
      trend: 'down',
      status: 'warning',
      lastUpdated: new Date(),
      change24h: -2.1,
      predictions: { next1h: 77, next4h: 79, next24h: 81 }
    },
    {
      id: 'capacity',
      name: 'Capacity Utilization',
      value: 92,
      target: 85,
      trend: 'up',
      status: 'warning',
      lastUpdated: new Date(),
      change24h: 8.3,
      predictions: { next1h: 94, next4h: 91, next24h: 88 }
    },
    {
      id: 'satisfaction',
      name: 'Employee Satisfaction',
      value: 7.8,
      target: 8.0,
      trend: 'stable',
      status: 'good',
      lastUpdated: new Date(),
      change24h: 0.1,
      predictions: { next1h: 7.8, next4h: 7.9, next24h: 8.1 }
    }
  ];

  const mockAlerts: Alert[] = [
    {
      id: 'alert1',
      type: 'capacity',
      severity: 'high',
      title: 'Capacity Approaching Limit',
      description: 'Current utilization at 92% - exceeding optimal range',
      recommendation: 'Consider scheduling additional staff or adjusting workload distribution',
      timestamp: new Date(),
      affectedEmployees: 15,
      estimatedImpact: 'Potential overtime costs and employee fatigue'
    },
    {
      id: 'alert2',
      type: 'efficiency',
      severity: 'medium',
      title: 'Efficiency Decline Detected',
      description: 'Operational efficiency down 2.1% from yesterday',
      recommendation: 'Review current processes and identify bottlenecks',
      timestamp: new Date(),
      affectedEmployees: 8,
      estimatedImpact: 'Reduced daily output by approximately 5%'
    }
  ];

  const mockInsights: AIInsight[] = [
    {
      id: 'insight1',
      category: 'optimization',
      title: 'Schedule Optimization Opportunity',
      description: 'AI detected potential 15% efficiency gain by adjusting afternoon shift timing',
      confidence: 0.87,
      actionRequired: true,
      potentialSavings: '$2,400/month',
      timeToImplement: '2-3 days'
    },
    {
      id: 'insight2',
      category: 'prediction',
      title: 'Productivity Peak Forecast',
      description: 'Team productivity expected to peak at 94% tomorrow at 10:30 AM',
      confidence: 0.92,
      actionRequired: false,
      potentialSavings: 'Optimal task assignment window',
      timeToImplement: 'Immediate'
    }
  ];

  const currentMetrics = realtimeMetrics.length > 0 ? realtimeMetrics : mockMetrics;
  const currentAlerts = alerts.length > 0 ? alerts : mockAlerts;
  const currentInsights = insights.length > 0 ? insights : mockInsights;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Real-time AI Monitor</h3>
          <Badge variant="outline" className="ml-2">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentMetrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                {getTrendIcon(metric.trend)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}{metric.id === 'satisfaction' ? '/10' : '%'}</span>
                <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </Badge>
              </div>
              <Progress value={metric.id === 'satisfaction' ? metric.value * 10 : metric.value} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {metric.target}{metric.id === 'satisfaction' ? '/10' : '%'}</span>
                <span className={metric.change24h > 0 ? 'text-green-600' : 'text-red-600'}>
                  {metric.change24h > 0 ? '+' : ''}{metric.change24h}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Predicting: {metric.predictions[selectedTimeframe as keyof typeof metric.predictions]}{metric.id === 'satisfaction' ? '/10' : '%'} in {selectedTimeframe}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Active Alerts ({currentAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentAlerts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No active alerts
              </div>
            ) : (
              currentAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <Badge className={`text-xs ${getSeverityColor(alert.severity)} text-white`}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </div>
                  {alert.affectedEmployees && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {alert.affectedEmployees} employees affected
                      </span>
                      <span>{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Insights ({currentInsights.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentInsights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                    {insight.actionRequired && (
                      <Badge variant="default" className="text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                {insight.potentialSavings && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-green-500" />
                      <span>Savings: {insight.potentialSavings}</span>
                    </div>
                    {insight.timeToImplement && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span>Time: {insight.timeToImplement}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}