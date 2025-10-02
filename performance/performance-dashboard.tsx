import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMonitoring, BundleAnalyzer, PerformanceOptimizer } from '@/utils/performance';
import { 
  Gauge, 
  Zap, 
  Clock, 
  Activity,
  HardDrive,
  Wifi,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Package,
  Sliders
} from 'lucide-react';

export function PerformanceDashboard() {
  const { metrics, trackRender, trackBundle, sendToAnalytics } = usePerformanceMonitoring();
  const [bundles, setBundles] = useState<Record<string, number>>({});
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Load bundle analysis
    BundleAnalyzer.analyzeBundles().then(setBundles);
    
    // Generate recommendations
    const recs = PerformanceOptimizer.getRecommendations(metrics);
    setRecommendations(recs);
  }, [metrics]);

  const getPerformanceScore = (): number => {
    let score = 100;
    
    // Core Web Vitals scoring
    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > 4000) score -= 30;
      else if (metrics.largestContentfulPaint > 2500) score -= 15;
    }
    
    if (metrics.firstInputDelay) {
      if (metrics.firstInputDelay > 300) score -= 20;
      else if (metrics.firstInputDelay > 100) score -= 10;
    }
    
    if (metrics.cumulativeLayoutShift) {
      if (metrics.cumulativeLayoutShift > 0.25) score -= 25;
      else if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    }
    
    // Bundle size scoring
    const totalBundleSize = Object.values(bundles).reduce((sum, size) => sum + size, 0);
    if (totalBundleSize > 1000 * 1024) score -= 20; // 1MB
    else if (totalBundleSize > 500 * 1024) score -= 10; // 500KB
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await PerformanceOptimizer.autoOptimize(metrics);
      // Refresh metrics after optimization
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const performanceScore = getPerformanceScore();

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Gauge className="w-6 h-6" />
          <span>Performance Dashboard</span>
        </h1>
        <p className="text-muted-foreground">
          Monitor and optimize your application's performance metrics
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Overall Performance Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                  {performanceScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={performanceScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {getScoreLabel(performanceScore)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Core Web Vitals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>LCP</span>
              <span className={metrics.largestContentfulPaint && metrics.largestContentfulPaint <= 2500 ? 'text-green-600' : 'text-red-600'}>
                {metrics.largestContentfulPaint ? formatTime(metrics.largestContentfulPaint) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>FID</span>
              <span className={metrics.firstInputDelay && metrics.firstInputDelay <= 100 ? 'text-green-600' : 'text-red-600'}>
                {metrics.firstInputDelay ? formatTime(metrics.firstInputDelay) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>CLS</span>
              <span className={metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift <= 0.1 ? 'text-green-600' : 'text-red-600'}>
                {metrics.cumulativeLayoutShift ? metrics.cumulativeLayoutShift.toFixed(3) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bundle Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span className="text-lg font-bold">
                  {formatBytes(Object.values(bundles).reduce((sum, size) => sum + size, 0))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(bundles).length} bundles loaded
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4" />
                <span className="text-lg font-bold">
                  {metrics.jsHeapSize ? formatBytes(metrics.jsHeapSize) : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                JS heap size
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Performance Optimization</h2>
          <p className="text-sm text-muted-foreground">
            {recommendations.length} recommendations available
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={sendToAnalytics} variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Send to Analytics
          </Button>
          <Button 
            onClick={handleOptimize} 
            disabled={isOptimizing}
            size="sm"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {isOptimizing ? 'Optimizing...' : 'Auto Optimize'}
          </Button>
        </div>
      </div>

      {/* Detailed Performance Information */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="bundles">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Performance Metrics */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Loading Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Page Load Time</span>
                  <span className="text-sm font-mono">
                    {metrics.pageLoadTime ? formatTime(metrics.pageLoadTime) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">DOM Content Loaded</span>
                  <span className="text-sm font-mono">
                    {metrics.domContentLoaded ? formatTime(metrics.domContentLoaded) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resource Load Time</span>
                  <span className="text-sm font-mono">
                    {metrics.resourceLoadTime ? formatTime(metrics.resourceLoadTime) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time to Interactive</span>
                  <span className="text-sm font-mono">
                    {metrics.timeToInteractive ? formatTime(metrics.timeToInteractive) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Paint Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">First Contentful Paint</span>
                  <span className="text-sm font-mono">
                    {metrics.firstContentfulPaint ? formatTime(metrics.firstContentfulPaint) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Largest Contentful Paint</span>
                  <span className="text-sm font-mono">
                    {metrics.largestContentfulPaint ? formatTime(metrics.largestContentfulPaint) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">First Input Delay</span>
                  <span className="text-sm font-mono">
                    {metrics.firstInputDelay ? formatTime(metrics.firstInputDelay) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cumulative Layout Shift</span>
                  <span className="text-sm font-mono">
                    {metrics.cumulativeLayoutShift ? metrics.cumulativeLayoutShift.toFixed(3) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bundle Analysis */}
        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Analysis</CardTitle>
              <CardDescription>
                JavaScript and CSS bundle sizes and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(bundles).map(([name, size]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {name.endsWith('.js') ? 'JavaScript' : 'Stylesheet'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{formatBytes(size)}</p>
                      <Badge 
                        variant={size > 100 * 1024 ? 'destructive' : size > 50 * 1024 ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {size > 100 * 1024 ? 'Large' : size > 50 * 1024 ? 'Medium' : 'Small'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {Object.keys(bundles).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2" />
                    <p>Bundle analysis loading...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Component Performance */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Performance</CardTitle>
              <CardDescription>
                React component render times and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.componentRenderTimes && Object.entries(metrics.componentRenderTimes).map(([name, time]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">React Component</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{formatTime(time)}</p>
                      <Badge 
                        variant={time > 16 ? 'destructive' : time > 8 ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {time > 16 ? 'Slow' : time > 8 ? 'Moderate' : 'Fast'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {(!metrics.componentRenderTimes || Object.keys(metrics.componentRenderTimes).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>No component metrics available yet</p>
                    <p className="text-xs">Interact with the app to generate metrics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                Actionable suggestions to improve your application's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  </div>
                ))}
                
                {recommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">Great performance!</p>
                    <p className="text-xs">No immediate optimization recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}