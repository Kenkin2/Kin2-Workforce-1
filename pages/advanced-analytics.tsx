import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  Brain,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw
} from 'lucide-react';

interface AdvancedAnalytics {
  metrics: {
    totalWorkers: number;
    activeJobs: number;
    completedShifts: number;
    monthlyRevenue: number;
    averageJobCompletion: number;
    workerUtilization: number;
    customerSatisfaction: number;
    karmaDistribution: { range: string; count: number }[];
  };
  insights: {
    demandForecast: { period: string; demand: number; confidence: number }[];
    workerAvailability: { workerId: string; availability: number; trend: string }[];
    revenueProjection: { month: string; projected: number; actual?: number }[];
    skillGaps: { skill: string; demand: number; supply: number }[];
  };
  recommendations: string[];
  trends: {
    jobGrowth: number;
    workerRetention: number;
    efficiency: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const { data: analytics, isLoading, refetch } = useQuery<AdvancedAnalytics>({
    queryKey: ['/api/analytics/advanced', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    retry: false,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (value: number, threshold: number = 70) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const exportReport = () => {
    if (analytics) {
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workforce-analytics-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="advanced-analytics">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered workforce insights and predictive analytics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(date) => setDateRange(date as any)}
            data-testid="date-range-picker"
          />
          <Button
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportReport}
            disabled={!analytics}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {analytics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="workforce" data-testid="tab-workforce">Workforce</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
            <TabsTrigger value="predictive" data-testid="tab-predictive">Predictive</TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-workers">
                        {analytics.metrics.totalWorkers}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                      <p className="text-2xl font-bold" data-testid="metric-active-jobs">
                        {analytics.metrics.activeJobs}
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold" data-testid="metric-monthly-revenue">
                        {formatCurrency(analytics.metrics.monthlyRevenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                      <p className={`text-2xl font-bold ${getStatusColor(analytics.metrics.workerUtilization)}`} data-testid="metric-utilization">
                        {formatPercentage(analytics.metrics.workerUtilization)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trends Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    Job Growth
                    {getTrendIcon(analytics.trends.jobGrowth)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600" data-testid="trend-job-growth">
                    +{formatPercentage(analytics.trends.jobGrowth)}
                  </p>
                  <p className="text-sm text-muted-foreground">vs. previous period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    Worker Retention
                    {getTrendIcon(analytics.trends.workerRetention - 85)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600" data-testid="trend-retention">
                    {formatPercentage(analytics.trends.workerRetention)}
                  </p>
                  <p className="text-sm text-muted-foreground">retention rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    Efficiency Score
                    {getTrendIcon(analytics.trends.efficiency - 75)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600" data-testid="trend-efficiency">
                    {formatPercentage(analytics.trends.efficiency)}
                  </p>
                  <p className="text-sm text-muted-foreground">operational efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Data-driven insights to optimize your workforce operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary-foreground font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm" data-testid={`recommendation-${index}`}>
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workforce" className="space-y-6">
            {/* Worker Utilization Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Worker Availability Trends</CardTitle>
                <CardDescription>Availability scores and trends for your workforce</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.insights.workerAvailability.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="workerId" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="availability" fill="#3b82f6" name="Availability %" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Karma Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Karma Distribution</CardTitle>
                <CardDescription>Distribution of karma coins across workers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.metrics.karmaDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {analytics.metrics.karmaDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Revenue Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Projections</CardTitle>
                <CardDescription>AI-predicted revenue trends for the next 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.insights.revenueProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Projected Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Actual Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Average Job Value</p>
                    <p className="text-2xl font-bold" data-testid="avg-job-value">
                      {formatCurrency(analytics.metrics.monthlyRevenue / Math.max(analytics.metrics.activeJobs, 1))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Revenue per Worker</p>
                    <p className="text-2xl font-bold" data-testid="revenue-per-worker">
                      {formatCurrency(analytics.metrics.monthlyRevenue / Math.max(analytics.metrics.totalWorkers, 1))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold" data-testid="completion-rate">
                      {formatPercentage(analytics.metrics.averageJobCompletion)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictive" className="space-y-6">
            {/* Demand Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>AI-powered prediction of future workforce demand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analytics.insights.demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="demand" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Confidence Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Confidence</CardTitle>
                <CardDescription>Confidence levels for demand predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.demandForecast.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{forecast.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Predicted demand: {forecast.demand} jobs
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" data-testid={`confidence-${index}`}>
                          {formatPercentage(forecast.confidence * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Skill Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>Identifying skill shortages and training opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.skillGaps.map((skill, index) => {
                    const gap = skill.demand - skill.supply;
                    const gapPercentage = (gap / skill.demand) * 100;
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{skill.skill}</h4>
                          <Badge 
                            variant={gap > 10 ? "destructive" : gap > 0 ? "default" : "secondary"}
                            data-testid={`skill-gap-${index}`}
                          >
                            {gap > 0 ? `Gap: ${gap}` : 'Sufficient'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Demand</p>
                            <p className="font-medium">{skill.demand}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Supply</p>
                            <p className="font-medium">{skill.supply}</p>
                          </div>
                        </div>
                        {gap > 0 && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(gapPercentage, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key performance indicators and improvement areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Customer satisfaction above 4.0</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Worker retention rate stable</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm">Utilization rate below optimal</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">Revenue growth trending upward</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm">Skills gap in technical roles</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Job completion rate excellent</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}