import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import AIInsights from "@/components/ai/ai-insights";
import SmartScheduling from "@/components/ai/smart-scheduling";
import JobMatching from "@/components/ai/job-matching";
import AIAutomation from "@/components/ai/ai-automation";
import AIChatAssistant from "@/components/ai/ai-chat-assistant";
import AIRealtimeMonitor from "@/components/ai/ai-realtime-monitor";
import AIAutomationHub from "@/components/ai/ai-automation-hub";
import AIPerformanceCoach from "@/components/ai/ai-performance-coach";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, Target, TrendingUp, Activity, BarChart3, Users, Lightbulb, AlertTriangle, CheckCircle, Clock, Cpu } from "lucide-react";
import { aiAnalytics, generateWorkforceReport, type WorkforceMetrics, type PredictionResult, type AIInsight } from "@/lib/ai-analytics";

export default function AIDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<WorkforceMetrics>({
    totalEmployees: 247,
    activeEmployees: 198,
    averageProductivity: 78.5,
    turnoverRate: 12.3,
    satisfactionScore: 7.2,
    efficiencyTrend: [72, 75, 78, 76, 80, 78, 82, 79, 81, 85]
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (isAuthenticated) {
      loadAIAnalytics();
    }
  }, [isAuthenticated, isLoading, toast]);
  
  const loadAIAnalytics = async () => {
    setIsAnalyzing(true);
    try {
      const [workforcePredictions, workforceInsights] = await Promise.all([
        aiAnalytics.generateWorkforcePredictions([], '1_month'),
        aiAnalytics.generateWorkforceInsights(currentMetrics)
      ]);
      
      setPredictions(workforcePredictions);
      setInsights(workforceInsights);
      
      toast({
        title: "AI Analysis Complete",
        description: "Workforce insights and predictions have been generated.",
      });
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="AI Workforce Intelligence"
      breadcrumbs={[{ label: "Analytics", href: "/analytics" }, { label: "AI Intelligence" }]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI Workforce Intelligence
            </h2>
            <p className="text-muted-foreground">Advanced machine learning analytics and predictions</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              ML Engine Active
            </Badge>
            <Button 
              onClick={loadAIAnalytics} 
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Active Workforce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                of {currentMetrics.totalEmployees} total employees
              </p>
              <Progress value={(currentMetrics.activeEmployees / currentMetrics.totalEmployees) * 100} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.averageProductivity}%</div>
              <p className="text-xs text-muted-foreground">
                {currentMetrics.averageProductivity > 75 ? '+5.2%' : '-2.1%'} from last month
              </p>
              <Progress value={currentMetrics.averageProductivity} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Turnover Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.turnoverRate}%</div>
              <p className="text-xs text-muted-foreground">
                {currentMetrics.turnoverRate < 15 ? 'Below industry avg' : 'Above industry avg'}
              </p>
              <Progress value={currentMetrics.turnoverRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.satisfactionScore}/10</div>
              <p className="text-xs text-muted-foreground">
                Employee satisfaction score
              </p>
              <Progress value={currentMetrics.satisfactionScore * 10} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* AI Analytics Tabs */}
        <Tabs defaultValue="assistant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Coaching
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <AIChatAssistant />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Performance
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Optimize Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Get Recommendations
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Voice Recognition</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Natural Language Processing</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Predictive Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Real-time Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Automated Workflows</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <AIRealtimeMonitor />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <AIAutomationHub />
          </TabsContent>

          <TabsContent value="coaching" className="space-y-6">
            <AIPerformanceCoach />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predictions.map((prediction, index) => (
                <Card key={index} className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                      {prediction.metric.replace('_', ' ')}
                      <Badge variant={prediction.trend === 'increasing' ? 'default' : prediction.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                        {prediction.trend}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Current:</span>
                      <span className="font-medium">{prediction.currentValue}{prediction.metric.includes('rate') ? '%' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Predicted:</span>
                      <span className="font-medium text-blue-600">{prediction.predictedValue}{prediction.metric.includes('rate') ? '%' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence:</span>
                      <span className="font-medium">{Math.round(prediction.confidence * 100)}%</span>
                    </div>
                    <Progress value={prediction.confidence * 100} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {prediction.recommendation}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.priority === 'high' ? 'border-l-red-500' :
                  insight.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {insight.priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {insight.priority === 'medium' && <Clock className="w-4 h-4 text-yellow-500" />}
                        {insight.priority === 'low' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {insight.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                        <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}>
                          {insight.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs font-medium mb-2">Expected Impact: {insight.estimatedImpact}</p>
                      <div className="space-y-1">
                        {insight.suggestedActions.slice(0, 3).map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SmartScheduling />
              <JobMatching />
              <AIInsights />
              <AIAutomation />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}