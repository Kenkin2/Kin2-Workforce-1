import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Clock, Plug, Gauge, Users, Check, X, FlaskConical } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SystemMetrics {
  performance?: {
    avgResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    requestsPerMinute: number;
    responseTimeHistory?: any[];
    memoryHistory?: any[];
  };
  integrations?: {
    totalActive: number;
    healthyCount: number;
    degradedCount: number;
    downCount: number;
  };
  database?: {
    connectionPool: number;
    queryPerformance: number;
    activeConnections: number;
    tableStats: any[];
  };
  users?: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    retention: number;
  };
}

interface IntegrationTest {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  responseTime: number;
  details: string;
  lastRun: Date;
}

export default function SystemAnalytics() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/analytics/system-metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: integrationHealth } = useQuery<any[]>({
    queryKey: ['/api/integrations/health'],
    refetchInterval: 60000, // Refresh every minute
  });

  const runIntegrationTests = async () => {
    setIsRunningTests(true);
    try {
      const response = await apiRequest('POST', '/api/integrations/test');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Failed to run integration tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      disconnected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.disconnected;
  };

  if (metricsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
          <p className="text-muted-foreground mt-2">Monitor platform performance, integrations, and health metrics</p>
        </div>
        <Button 
          onClick={runIntegrationTests}
          disabled={isRunningTests}
          data-testid="button-run-tests"
        >
          {isRunningTests ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Running Tests...
            </>
          ) : (
            'Run Integration Tests'
          )}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.performance?.uptime ? Math.floor(metrics.performance.uptime / 3600) : 0}h</div>
                <p className="text-xs text-muted-foreground">Since last restart</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                <Plug className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.integrations?.totalActive || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.integrations?.healthyCount || 0} healthy, {metrics?.integrations?.degradedCount || 0} degraded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Gauge className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.performance?.avgResponseTime || 0}ms</div>
                <p className="text-xs text-muted-foreground">Average API response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.users?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.users?.retention || 0}% retention rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
              <CardDescription>Real-time status of all platform integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrationHealth?.map((integration: any) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`} />
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.responseTime ? `${integration.responseTime}ms` : 'No data'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>API response time over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.performance?.responseTimeHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Server memory consumption patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.performance?.memoryHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="used" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="free" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Current system performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">{metrics?.performance?.cpuUsage || 0}%</span>
                  </div>
                  <Progress value={metrics?.performance?.cpuUsage || 0} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">{metrics?.performance?.memoryUsage || 0}%</span>
                  </div>
                  <Progress value={metrics?.performance?.memoryUsage || 0} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Database Load</span>
                    <span className="text-sm font-medium">{metrics?.database?.connectionPool || 0}%</span>
                  </div>
                  <Progress value={metrics?.database?.connectionPool || 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Health Distribution</CardTitle>
                <CardDescription>Status breakdown of all integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Healthy', value: metrics?.integrations?.healthyCount || 0, fill: '#22c55e' },
                        { name: 'Degraded', value: metrics?.integrations?.degradedCount || 0, fill: '#eab308' },
                        { name: 'Down', value: metrics?.integrations?.downCount || 0, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Healthy', value: metrics?.integrations?.healthyCount || 0, fill: '#22c55e' },
                        { name: 'Degraded', value: metrics?.integrations?.degradedCount || 0, fill: '#eab308' },
                        { name: 'Down', value: metrics?.integrations?.downCount || 0, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Response Times</CardTitle>
                <CardDescription>Average response times by service</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={integrationHealth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responseTime" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Details</CardTitle>
              <CardDescription>Comprehensive status of all platform integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationHealth?.map((integration: any) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(integration.status)}`} />
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {new Date(integration.lastChecked).toLocaleString()}
                        </p>
                        {integration.error && (
                          <p className="text-sm text-red-600 mt-1">{integration.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusBadge(integration.status)}>
                        {integration.status}
                      </Badge>
                      {integration.responseTime && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {integration.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Pool Status</CardTitle>
                <CardDescription>Database connection utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Connections</span>
                    <span className="font-mono">{metrics?.database?.activeConnections || 0}/20</span>
                  </div>
                  <Progress value={(metrics?.database?.activeConnections || 0) / 20 * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span>Query Performance</span>
                    <span className="font-mono">{metrics?.database?.queryPerformance || 0}ms avg</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (metrics?.database?.queryPerformance || 0) / 10)} 
                    className="bg-green-100" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Table Statistics</CardTitle>
                <CardDescription>Database table sizes and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.database?.tableStats?.map((table: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{table.name}</span>
                      <div className="text-right">
                        <p className="text-sm font-mono">{table.rows} rows</p>
                        <p className="text-xs text-muted-foreground">{table.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Test Results</CardTitle>
                <CardDescription>
                  Last run: {new Date(testResults.timestamp).toLocaleString()}
                  {testResults.passed ? (
                    <Badge className="ml-2 bg-green-100 text-green-800">All Tests Passed</Badge>
                  ) : (
                    <Badge className="ml-2 bg-red-100 text-red-800">Some Tests Failed</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(testResults.results).map(([key, result]: [string, any]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium capitalize">{key} Integration</h4>
                        <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {result.success ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                      
                      {result.tests && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(result.tests).map(([testName, passed]: [string, any]) => (
                            <div key={testName} className="flex items-center space-x-2">
                              {passed ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                              <span className="text-sm capitalize">{testName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 rounded text-red-800 dark:text-red-300 text-sm">
                          {result.error}
                        </div>
                      )}
                      
                      {result.responseTime && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Response time: {result.responseTime}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {!testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Testing</CardTitle>
                <CardDescription>Run comprehensive tests on all platform integrations</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <FlaskConical className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <p className="text-muted-foreground mb-6">
                  Click "Run Integration Tests" to validate all platform integrations and connections
                </p>
                <Button onClick={runIntegrationTests} disabled={isRunningTests} data-testid="button-start-tests">
                  {isRunningTests ? 'Running Tests...' : 'Start Integration Tests'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}