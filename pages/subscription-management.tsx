import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Download,
  RefreshCw,
  Plus,
  Minus,
  X
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";
import type { OrganizationSubscription, PricingPlan } from "@shared/schema";

interface BillingMetrics {
  totalRevenue: number;
  activeSubscriptions: number;
  averageEmployeeCount: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  upcomingRenewals: number;
  failedPayments: number;
  usageOverage: number;
}

interface UsageData {
  date: string;
  employees: number;
  apiCalls: number;
  storage: number;
  cost: number;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl?: string;
}

export default function SubscriptionManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingCancellation, setPendingCancellation] = useState<string | null>(null);

  // Fetch subscription data
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<OrganizationSubscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  // Fetch billing metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<BillingMetrics>({
    queryKey: ["/api/billing/metrics"],
  });

  // Fetch usage data
  const { data: usageData = [], isLoading: usageLoading } = useQuery<UsageData[]>({
    queryKey: ["/api/billing/usage", selectedPeriod],
  });

  // Fetch payment history
  const { data: paymentHistory = [], isLoading: paymentsLoading } = useQuery<PaymentHistory[]>({
    queryKey: ["/api/billing/payments"],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      setPendingCancellation(null);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upgrade/downgrade subscription mutation
  const changeSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, newPlanId }: { subscriptionId: string; newPlanId: string }) => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/change`, { newPlanId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription plan has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6" data-testid="subscription-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Subscription Management</h2>
          <p className="text-muted-foreground">Manage your subscriptions, billing, and usage analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-download-invoice">
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
          <Button data-testid="button-upgrade-plan">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="metric-mrr">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(metrics?.monthlyRecurringRevenue || 0)}
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
              {metrics?.activeSubscriptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="w-3 h-3 inline mr-1" />
              +3 new this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-upcoming-renewals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.upcomingRenewals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-failed-payments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.failedPayments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payment History</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card data-testid="chart-revenue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly recurring revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card data-testid="chart-usage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Overview
                </CardTitle>
                <CardDescription>Employee count and API usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageData}>
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
                    <Line type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={2} name="Employees" />
                    <Line type="monotone" dataKey="apiCalls" stroke="#10b981" strokeWidth={2} name="API Calls" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card data-testid="recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Payment Successful</p>
                    <p className="text-sm text-muted-foreground">Professional plan - £89.00</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Usage Alert</p>
                    <p className="text-sm text-muted-foreground">95% of employee limit reached</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium">Renewal Reminder</p>
                    <p className="text-sm text-muted-foreground">Subscription renews in 7 days</p>
                  </div>
                  <span className="text-sm text-muted-foreground">3 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} data-testid={`subscription-${subscription.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Professional Plan
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </CardTitle>
                      <CardDescription>
                        Next billing: {new Date(subscription.nextBillDate || '').toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">£89.00</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Current Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Employees</span>
                          <span>{subscription.employeeCount}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(subscription.employeeCount / 100) * 100}%` }}
                          />
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
                          <span>AI Workforce Insights</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Priority Support</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-upgrade-${subscription.id}`}
                        onClick={() => changeSubscriptionMutation.mutate({ 
                          subscriptionId: subscription.id, 
                          newPlanId: 'enterprise' 
                        })}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-modify-${subscription.id}`}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Modify Subscription
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        data-testid={`button-cancel-${subscription.id}`}
                        onClick={() => setPendingCancellation(subscription.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Usage Analytics</h3>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  data-testid={`button-period-${period}`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {/* Detailed Usage Chart */}
            <Card data-testid="detailed-usage-chart">
              <CardHeader>
                <CardTitle>Detailed Usage Breakdown</CardTitle>
                <CardDescription>Track your usage patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={usageData}>
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
                    <Line type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={2} name="Active Employees" />
                    <Line type="monotone" dataKey="apiCalls" stroke="#10b981" strokeWidth={2} name="API Calls (thousands)" />
                    <Line type="monotone" dataKey="storage" stroke="#f59e0b" strokeWidth={2} name="Storage (GB)" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="usage-employees">
                <CardHeader>
                  <CardTitle className="text-sm">Employee Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current</span>
                      <span>95/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '95%' }} />
                    </div>
                    <p className="text-xs text-orange-600">95% of limit reached</p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="usage-api">
                <CardHeader>
                  <CardTitle className="text-sm">API Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>This month</span>
                      <span>78K/100K</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">78% of monthly limit</p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="usage-storage">
                <CardHeader>
                  <CardTitle className="text-sm">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Used</span>
                      <span>45GB/100GB</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">45% of storage used</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card data-testid="payment-history">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all your past payments and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">{payment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      {payment.invoiceUrl && (
                        <Button variant="outline" size="sm" data-testid={`download-invoice-${payment.id}`}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6">
            <Card data-testid="billing-settings">
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>Manage your billing preferences and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CreditCard className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-update-payment">
                      Update
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Billing Address</h4>
                  <div className="p-3 border rounded-lg">
                    <p>Acme Corporation</p>
                    <p>123 Business Street</p>
                    <p>London, UK SW1A 1AA</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" data-testid="button-update-address">
                    Update Address
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Billing Notifications</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked data-testid="checkbox-payment-reminders" />
                      <span>Payment reminders</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked data-testid="checkbox-usage-alerts" />
                      <span>Usage limit alerts</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" data-testid="checkbox-renewal-notifications" />
                      <span>Renewal notifications</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscription Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        open={!!pendingCancellation}
        onOpenChange={(open) => !open && setPendingCancellation(null)}
        title="Cancel Subscription"
        description="Are you sure you want to cancel this subscription? This action cannot be undone and you will lose access to premium features at the end of the billing period."
        confirmText="Cancel Subscription"
        variant="destructive"
        onConfirm={() => {
          if (pendingCancellation) {
            cancelSubscriptionMutation.mutate(pendingCancellation);
          }
        }}
        isLoading={cancelSubscriptionMutation.isPending}
      />
    </div>
  );
}