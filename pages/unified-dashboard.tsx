import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Bell,
  Settings,
  Plus,
  RefreshCw,
  BarChart3,
  Activity,
  Shield,
  Zap
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart, Area, AreaChart, Legend } from "recharts";
import { Link } from "wouter";
import { SiGithub, SiSlack, SiNotion, SiDropbox, SiSpotify } from "react-icons/si";

interface DashboardMetrics {
  subscriptions: {
    active: number;
    revenue: number;
    upcomingRenewals: number;
    failedPayments: number;
  };
  connections: {
    total: number;
    active: number;
    pending: number;
    errors: number;
  };
  usage: {
    employees: number;
    apiCalls: number;
    dataTransfer: number;
    storageUsed: number;
  };
}

interface TrendData {
  date: string;
  revenue: number;
  connections: number;
  usage: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  variant: 'default' | 'outline' | 'secondary';
}

const mockMetrics: DashboardMetrics = {
  subscriptions: {
    active: 3,
    revenue: 12450,
    upcomingRenewals: 2,
    failedPayments: 0
  },
  connections: {
    total: 12,
    active: 6,
    pending: 1,
    errors: 1
  },
  usage: {
    employees: 95,
    apiCalls: 15420,
    dataTransfer: 234.5,
    storageUsed: 45.2
  }
};

const mockTrendData: TrendData[] = [
  { date: '01/10', revenue: 8900, connections: 4, usage: 12000 },
  { date: '08/10', revenue: 9200, connections: 5, usage: 13500 },
  { date: '15/10', revenue: 10100, connections: 5, usage: 14200 },
  { date: '22/10', revenue: 11300, connections: 6, usage: 15100 },
  { date: '29/10', revenue: 12450, connections: 6, usage: 15420 }
];

const quickActions: QuickAction[] = [
  {
    id: 'upgrade-plan',
    title: 'Upgrade Plan',
    description: 'Unlock more features',
    icon: ArrowUpRight,
    href: '/subscription-plans',
    variant: 'default'
  },
  {
    id: 'add-connection',
    title: 'Add Connection',
    description: 'Connect new service',
    icon: Plus,
    href: '/connections',
    variant: 'outline'
  },
  {
    id: 'billing-settings',
    title: 'Billing Settings',
    description: 'Manage payments',
    icon: Settings,
    href: '/subscription/billing',
    variant: 'outline'
  },
  {
    id: 'usage-analytics',
    title: 'Usage Analytics',
    description: 'View detailed metrics',
    icon: BarChart3,
    href: '/subscription/usage',
    variant: 'secondary'
  }
];

export default function UnifiedDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch dashboard metrics
  const { data: metrics = mockMetrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    initialData: mockMetrics
  });

  // Fetch trend data
  const { data: trendData = mockTrendData, isLoading: trendLoading } = useQuery<TrendData[]>({
    queryKey: ["/api/dashboard/trends", selectedPeriod],
    initialData: mockTrendData
  });

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  return (
    <div className="space-y-6" data-testid="unified-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Subscriptions & Connections</h2>
          <p className="text-muted-foreground">Manage your billing, usage, and external integrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-refresh-all">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Link href="/subscription-plans">
            <Button data-testid="button-manage-subscriptions">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscriptions
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="metric-monthly-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(metrics.subscriptions.revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-active-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.subscriptions.active}
            </div>
            <p className="text-xs text-muted-foreground">
              Professional & Enterprise plans
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-connected-services">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Services</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.connections.active}/{metrics.connections.total}
            </div>
            <p className="text-xs text-muted-foreground">
              External integrations active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-api-usage">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.usage.apiCalls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Calls this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      {(metrics.subscriptions.failedPayments > 0 || metrics.connections.errors > 0 || metrics.subscriptions.upcomingRenewals > 0) && (
        <div className="space-y-3">
          {metrics.subscriptions.failedPayments > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800 dark:text-red-200">Payment Failed</p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {metrics.subscriptions.failedPayments} payment(s) failed. Update your payment method.
                </p>
              </div>
              <Link href="/subscription/billing">
                <Button variant="outline" size="sm" data-testid="button-fix-payment">
                  Fix Payment
                </Button>
              </Link>
            </div>
          )}

          {metrics.connections.errors > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">Connection Issues</p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {metrics.connections.errors} connection(s) need attention. Check your integrations.
                </p>
              </div>
              <Link href="/connections">
                <Button variant="outline" size="sm" data-testid="button-fix-connections">
                  View Connections
                </Button>
              </Link>
            </div>
          )}

          {metrics.subscriptions.upcomingRenewals > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">Upcoming Renewals</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {metrics.subscriptions.upcomingRenewals} subscription(s) renewing in the next 30 days.
                </p>
              </div>
              <Link href="/subscription">
                <Button variant="outline" size="sm" data-testid="button-view-renewals">
                  View Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-connections">Connections</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Usage Trends */}
            <Card data-testid="trends-chart">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue & Usage Trends</CardTitle>
                    <CardDescription>Track growth over time</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {(['7d', '30d', '90d'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                        data-testid={`button-period-${period}`}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : Number(value).toLocaleString(),
                        name === 'revenue' ? 'Revenue' : name === 'connections' ? 'Connections' : 'API Usage'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="usage" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card data-testid="quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {quickActions.map((action) => (
                    <Link key={action.id} href={action.href}>
                      <Button 
                        variant={action.variant} 
                        className="w-full justify-start h-auto p-4"
                        data-testid={`quick-action-${action.id}`}
                      >
                        <action.icon className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm opacity-70">{action.description}</div>
                        </div>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Status */}
            <Card data-testid="subscription-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Professional Plan</p>
                      <p className="text-sm text-muted-foreground">Active until Dec 1, 2024</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{metrics.usage.employees}/100</div>
                    <div className="text-sm text-muted-foreground">Employees</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.subscriptions.revenue)}</div>
                    <div className="text-sm text-muted-foreground">Monthly Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card data-testid="connection-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{metrics.connections.active}</div>
                    <div className="text-sm text-muted-foreground">Connected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{metrics.connections.errors}</div>
                    <div className="text-sm text-muted-foreground">Issues</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <SiGithub className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                    <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SiNotion className="w-4 h-4" />
                    <span className="text-sm">Notion</span>
                    <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SiSlack className="w-4 h-4" />
                    <span className="text-sm">Slack</span>
                    <Clock className="w-3 h-3 text-gray-400 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Subscription Management</h3>
            <Link href="/subscription">
              <Button data-testid="button-full-subscription-management">
                View Full Management
              </Button>
            </Link>
          </div>

          <div className="grid gap-6">
            <Card data-testid="current-plan-summary">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Professional Plan Details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Usage Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Employees</span>
                        <span>{metrics.usage.employees}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(metrics.usage.employees / 100) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-orange-600">95% of limit reached</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Billing Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Cost</span>
                        <span>£89.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Billing</span>
                        <span>Dec 1, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method</span>
                        <span>•••• 4242</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Advanced Analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>AI Insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Priority Support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Connection Overview</h3>
            <Link href="/connections">
              <Button data-testid="button-full-connections-management">
                Manage All Connections
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Connected Services */}
            <Card data-testid="connected-services">
              <CardHeader>
                <CardTitle className="text-sm">Connected Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SiGithub className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SiNotion className="w-4 h-4" />
                    <span className="text-sm">Notion</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SiDropbox className="w-4 h-4" />
                    <span className="text-sm">Dropbox</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pending Connections */}
            <Card data-testid="pending-connections">
              <CardHeader>
                <CardTitle className="text-sm">Pending Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SiSlack className="w-4 h-4" />
                    <span className="text-sm">Slack</span>
                  </div>
                  <Badge variant="outline">Setup Required</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full" data-testid="button-setup-slack">
                  <Plus className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              </CardContent>
            </Card>

            {/* Connection Issues */}
            <Card data-testid="connection-issues">
              <CardHeader>
                <CardTitle className="text-sm">Attention Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SiGithub className="w-4 h-4" />
                    <span className="text-sm">Linear</span>
                  </div>
                  <Badge variant="destructive">Token Expired</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full" data-testid="button-fix-linear">
                  <Shield className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            {/* Usage Analytics */}
            <Card data-testid="usage-analytics">
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Detailed usage metrics across all services</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="usage" fill="#3b82f6" name="API Usage" />
                    <Bar dataKey="connections" fill="#10b981" name="Active Connections" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="employees-usage">
                <CardHeader>
                  <CardTitle className="text-sm">Employee Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.usage.employees}</div>
                  <div className="text-sm text-muted-foreground mb-2">Active employees</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '95%' }} />
                  </div>
                  <div className="text-xs text-orange-600 mt-1">95% of limit</div>
                </CardContent>
              </Card>

              <Card data-testid="api-usage">
                <CardHeader>
                  <CardTitle className="text-sm">API Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.usage.apiCalls.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mb-2">Calls this month</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">68% of monthly limit</div>
                </CardContent>
              </Card>

              <Card data-testid="storage-usage">
                <CardHeader>
                  <CardTitle className="text-sm">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.usage.storageUsed}GB</div>
                  <div className="text-sm text-muted-foreground mb-2">Used storage</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">45% of allocated storage</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}