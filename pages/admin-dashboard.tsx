import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Shield, 
  Database, 
  Zap, 
  Bell, 
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery<{
    performance: { 
      uptime: number; 
      avgResponseTime: number; 
      peakResponseTime: number; 
      errorRate: number;
      responseTimeHistory?: any[];
      memoryHistory?: any[];
    };
    integrations: { healthyCount: number; totalActive: number };
    users: { activeUsers: number; totalUsers: number };
    stats: any;
  }>({
    queryKey: ['/api/analytics/system-metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: integrationHealth } = useQuery<any[]>({
    queryKey: ['/api/integrations/health'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: workflowData } = useQuery<{
    executions?: any[];
    stats?: any;
  }>({
    queryKey: ['/api/workflows/executions'],
  });

  const { data: deploymentStatus } = useQuery<{
    database?: any;
    storage?: any;
    stripe?: any;
    readiness?: {
      ready: boolean;
      checks: any[];
      message?: string;
      timestamp?: string;
      errors?: any[];
    };
    report?: {
      status: string;
      timestamp: string;
      summary: any;
      details?: any;
      environment?: string;
      estimatedResources?: any;
      recommendations?: any[];
    };
  }>({
    queryKey: ['/api/deployment/status'],
  });

  const { data: testingResults } = useQuery<{
    database?: any;
    storage?: any;
    stripe?: any;
  }>({
    queryKey: ['/api/testing/health-check'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const runTestsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/testing/run-all'),
    onSuccess: () => {
      toast({
        title: "Tests Completed",
        description: "All system tests have been executed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/testing/health-check'] });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Some tests failed to execute",
        variant: "destructive",
      });
    },
  });

  const runIntegrationTestsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/integrations/test'),
    onSuccess: () => {
      toast({
        title: "Integration Tests Completed",
        description: "All integration tests have been executed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/health'] });
    },
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="loading-admin-dashboard">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="title-dashboard">
            System Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400" data-testid="text-dashboard-description">
            Comprehensive platform management and monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => runTestsMutation.mutate()}
            disabled={runTestsMutation.isPending}
            variant="outline"
            data-testid="button-run-tests"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {runTestsMutation.isPending ? 'Running...' : 'Run Tests'}
          </Button>
          <Button 
            onClick={() => runIntegrationTestsMutation.mutate()}
            disabled={runIntegrationTestsMutation.isPending}
            data-testid="button-test-integrations"
          >
            <Zap className="w-4 h-4 mr-2" />
            {runIntegrationTestsMutation.isPending ? 'Testing...' : 'Test Integrations'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
          <TabsTrigger value="workflows" data-testid="tab-workflows">Automation</TabsTrigger>
          <TabsTrigger value="testing" data-testid="tab-testing">Testing</TabsTrigger>
          <TabsTrigger value="deployment" data-testid="tab-deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-system-health">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Server className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-system-status">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {Math.floor((systemMetrics?.performance?.uptime || 0) / 3600)}h
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-integrations-status">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Integrations</CardTitle>
                <Zap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-integrations-healthy">
                  {systemMetrics?.integrations?.healthyCount || 0}/{systemMetrics?.integrations?.totalActive || 0}
                </div>
                <p className="text-xs text-muted-foreground">Healthy integrations</p>
              </CardContent>
            </Card>

            <Card data-testid="card-active-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-users-count">
                  {systemMetrics?.users?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {systemMetrics?.users?.totalUsers || 0}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-response-time">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-response-time">
                  {systemMetrics?.performance?.avgResponseTime || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-response-time-chart">
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>Last 24 hours performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={systemMetrics?.performance?.responseTimeHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-memory-usage-chart">
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>System memory utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={systemMetrics?.performance?.memoryHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="used" fill="#ef4444" name="Used" />
                    <Bar dataKey="free" fill="#10b981" name="Free" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Advanced Analytics */}
          <Card data-testid="card-advanced-analytics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive business intelligence and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg" data-testid="metric-total-revenue">
                  <div className="text-2xl font-bold text-green-600">$24,580</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-xs text-green-600">+12.5% vs last month</div>
                </div>
                <div className="text-center p-4 border rounded-lg" data-testid="metric-worker-satisfaction">
                  <div className="text-2xl font-bold text-blue-600">92%</div>
                  <div className="text-sm text-gray-600">Worker Satisfaction</div>
                  <div className="text-xs text-blue-600">+3.2% improvement</div>
                </div>
                <div className="text-center p-4 border rounded-lg" data-testid="metric-job-completion">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-gray-600">Job Completion Rate</div>
                  <div className="text-xs text-purple-600">On-time delivery</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Integration Health */}
          <Card data-testid="card-integration-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Integration Health Monitor
              </CardTitle>
              <CardDescription>
                Real-time status of all external service connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrationHealth?.map((integration: any) => (
                <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`integration-${integration.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: integration.status === 'healthy' ? '#22c55e' : 
                                    integration.status === 'degraded' ? '#f59e0b' : '#ef4444'
                    }} />
                    <div>
                      <div className="font-medium" data-testid={`text-integration-name-${integration.id}`}>
                        {integration.name}
                      </div>
                      <div className="text-sm text-gray-600" data-testid={`text-integration-status-${integration.id}`}>
                        {integration.status} • Response: {integration.responseTime}ms
                      </div>
                    </div>
                  </div>
                  <Badge variant={integration.status === 'healthy' ? 'default' : 'destructive'}>
                    {integration.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          {/* Workflow Automation */}
          <Card data-testid="card-workflow-automation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Workflow Automation
              </CardTitle>
              <CardDescription>
                Automated business processes and rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowData?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 border rounded-lg" data-testid="metric-total-executions">
                    <div className="text-xl font-bold">{workflowData.stats.total}</div>
                    <div className="text-sm text-gray-600">Total Executions</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg" data-testid="metric-success-rate">
                    <div className="text-xl font-bold text-green-600">
                      {workflowData.stats.successRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg" data-testid="metric-avg-duration">
                    <div className="text-xl font-bold">
                      {workflowData.stats.averageDuration.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Duration</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg" data-testid="metric-failed-executions">
                    <div className="text-xl font-bold text-red-600">{workflowData.stats.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Active Workflow Rules</h3>
                {workflowData?.executions?.slice(0, 5).map((execution: any, index: number) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`workflow-execution-${index}`}>
                    <div className="flex items-center gap-3">
                      {execution.result === 'success' ? 
                        <CheckCircle className="w-5 h-5 text-green-600" /> :
                        execution.result === 'partial' ?
                        <AlertTriangle className="w-5 h-5 text-orange-600" /> :
                        <XCircle className="w-5 h-5 text-red-600" />
                      }
                      <div>
                        <div className="font-medium" data-testid={`text-execution-rule-${index}`}>
                          {execution.ruleId}
                        </div>
                        <div className="text-sm text-gray-600" data-testid={`text-execution-time-${index}`}>
                          {new Date(execution.timestamp).toLocaleString()} • {execution.duration}ms
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{execution.executedActions.length} actions</div>
                      {execution.errors && (
                        <div className="text-xs text-red-600">{execution.errors.length} errors</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {/* Testing Dashboard */}
          <Card data-testid="card-testing-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Testing & Quality Assurance
              </CardTitle>
              <CardDescription>
                Automated testing results and quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testingResults && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg" data-testid="metric-database-test">
                      <div className="text-lg font-bold text-green-600">
                        {testingResults.database?.success ? '✓' : '✗'}
                      </div>
                      <div className="text-sm">Database</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg" data-testid="metric-storage-test">
                      <div className="text-lg font-bold text-green-600">
                        {testingResults.storage?.success ? '✓' : '✗'}
                      </div>
                      <div className="text-sm">Storage</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg" data-testid="metric-stripe-test">
                      <div className="text-lg font-bold text-green-600">
                        {testingResults.stripe?.success ? '✓' : '✗'}
                      </div>
                      <div className="text-sm">Stripe</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Test Results</h4>
                    {Object.entries(testingResults).map(([service, result]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between p-2 border rounded" data-testid={`test-result-${service}`}>
                        <span className="capitalize">{service}</span>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          {/* Deployment Status */}
          <Card data-testid="card-deployment-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Deployment Configuration
              </CardTitle>
              <CardDescription>
                Production readiness and deployment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deploymentStatus?.readiness && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-4 h-4 rounded-full ${deploymentStatus.readiness.ready ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-semibold" data-testid="text-deployment-ready">
                      {deploymentStatus.readiness.ready ? 'Ready for deployment' : 'Not ready for deployment'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(deploymentStatus.readiness.checks).map(([check, status]: [string, any]) => (
                      <div key={check} className="flex items-center justify-between p-3 border rounded" data-testid={`deployment-check-${check}`}>
                        <span className="capitalize">{check}</span>
                        <Badge variant={status ? 'default' : 'destructive'}>
                          {status ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {deploymentStatus.readiness.errors && deploymentStatus.readiness.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-red-600 mb-2">Deployment Issues:</h4>
                      <ul className="space-y-1">
                        {deploymentStatus.readiness.errors.map((error: string, index: number) => (
                          <li key={index} className="text-sm text-red-600" data-testid={`deployment-error-${index}`}>
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {deploymentStatus.report && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Deployment Report</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div data-testid="deployment-environment">
                          <strong>Environment:</strong> {deploymentStatus.report.environment}
                        </div>
                        <div data-testid="deployment-resources">
                          <strong>Resources:</strong> {deploymentStatus.report.estimatedResources.cpu}, {deploymentStatus.report.estimatedResources.memory}
                        </div>
                      </div>
                      {deploymentStatus.report.recommendations && (
                        <div className="mt-3">
                          <strong>Recommendations:</strong>
                          <ul className="mt-1 space-y-1">
                            {deploymentStatus.report.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-xs text-gray-600" data-testid={`deployment-recommendation-${index}`}>
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}