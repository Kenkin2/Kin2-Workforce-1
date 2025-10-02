import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Briefcase, Clock, DollarSign, 
  Target, Award, Calendar, AlertTriangle, Download, Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AnalyticsData {
  activeJobs: number;
  totalWorkers: number;
  monthlyRevenue: number;
  completionRate: number;
  chartData: {
    monthlyRevenue: Array<{ month: string; revenue: number; }>;
    workerPerformance: Array<{ name: string; value: number; }>;
    jobCategories: Array<{ category: string; count: number; }>;
  };
  predictions: {
    nextMonthRevenue: number;
    workerDemand: number;
    riskFactors: Array<{ factor: string; risk: 'low' | 'medium' | 'high'; impact: string; }>;
  };
  kpis: {
    workerRetention: number;
    averageJobCompletion: number;
    clientSatisfaction: number;
    platformUtilization: number;
  };
}

export function EnhancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [viewType, setViewType] = useState('overview');
  
  const { data: analytics, isLoading } = useQuery<Partial<AnalyticsData>>({
    queryKey: ['/api/reports/analytics', timeRange],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const mockEnhancedData: AnalyticsData = {
    monthlyRevenue: analytics?.monthlyRevenue || 0,
    activeJobs: analytics?.activeJobs || 0,
    totalWorkers: analytics?.totalWorkers || 0,
    completionRate: analytics?.completionRate || 0,
    chartData: analytics?.chartData || {
      monthlyRevenue: [],
      workerPerformance: [],
      jobCategories: []
    },
    predictions: {
      nextMonthRevenue: 28500,
      workerDemand: 15,
      riskFactors: [
        { factor: 'Seasonal Demand Drop', risk: 'medium', impact: 'Revenue may decrease by 15%' },
        { factor: 'Worker Shortage', risk: 'high', impact: 'May affect job completion rates' },
        { factor: 'Client Retention', risk: 'low', impact: 'Strong client satisfaction scores' }
      ]
    },
    kpis: {
      workerRetention: 87,
      averageJobCompletion: 94,
      clientSatisfaction: 4.6,
      platformUtilization: 78
    }
  };

  // Vibrant color palette that works in both light and dark modes
  const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
  ];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="enhanced-analytics-dashboard">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights and predictive analytics for your workforce platform
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" data-testid="button-export-analytics">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Worker Retention</p>
                <p className="text-2xl font-bold">{mockEnhancedData.kpis.workerRetention}%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.3% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Completion</p>
                <p className="text-2xl font-bold">{mockEnhancedData.kpis.averageJobCompletion}%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +1.7% from last week
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Satisfaction</p>
                <p className="text-2xl font-bold">{mockEnhancedData.kpis.clientSatisfaction}/5</p>
                <p className="text-xs text-green-600 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Excellent rating
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Utilization</p>
                <p className="text-2xl font-bold">{mockEnhancedData.kpis.platformUtilization}%</p>
                <Progress value={mockEnhancedData.kpis.platformUtilization} className="mt-2" />
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewType} onValueChange={setViewType}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.chartData?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Categories</CardTitle>
                <CardDescription>Distribution of job types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.chartData?.jobCategories || []}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {(analytics?.chartData?.jobCategories || []).map((_, index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Prediction</CardTitle>
                <CardDescription>AI-powered revenue forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Next Month Prediction</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(mockEnhancedData.predictions.nextMonthRevenue)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Worker Demand</p>
                      <p className="text-2xl font-bold text-blue-600">
                        +{mockEnhancedData.predictions.workerDemand} workers
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Potential risks and mitigation strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockEnhancedData.predictions.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{risk.factor}</span>
                          <Badge variant={getRiskColor(risk.risk) as any}>
                            {risk.risk}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{risk.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}