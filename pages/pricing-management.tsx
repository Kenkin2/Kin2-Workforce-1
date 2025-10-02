import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Calculator, TrendingUp, Users, CreditCard, Settings, DollarSign } from "lucide-react";
import type { PricingPlan, OrganizationSubscription } from "@shared/schema";

interface PricingCalculation {
  basePrice: number;
  discount: number;
  finalPrice: number;
  appliedRules: string[];
}

interface BillingMetrics {
  totalRevenue: number;
  activeSubscriptions: number;
  averageEmployeeCount: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
}

export default function PricingManagement() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [employeeCount, setEmployeeCount] = useState(10);
  const [organizationId, setOrganizationId] = useState("");
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pricing plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<PricingPlan[]>({
    queryKey: ["/api/pricing/plans"],
  });

  // Fetch billing metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<BillingMetrics>({
    queryKey: ["/api/pricing/metrics"],
  });

  // Calculate pricing mutation
  const calculatePricingMutation = useMutation({
    mutationFn: async (data: { planId: string; employeeCount: number; organizationId?: string }) => {
      const response = await apiRequest("POST", "/api/pricing/calculate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setPricingCalculation(data);
      toast({
        title: "Pricing Calculated",
        description: `Final price: £${data.finalPrice} per employee per month`,
      });
    },
    onError: () => {
      toast({
        title: "Calculation Failed",
        description: "Could not calculate pricing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process billing mutation
  const processBillingMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest("POST", `/api/pricing/billing/process/${orgId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Billing Processed",
        description: "Billing cycle has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/metrics"] });
    },
    onError: () => {
      toast({
        title: "Billing Failed",
        description: "Could not process billing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCalculatePricing = () => {
    if (!selectedPlan || !employeeCount) {
      toast({
        title: "Missing Information",
        description: "Please select a plan and enter employee count.",
        variant: "destructive",
      });
      return;
    }

    calculatePricingMutation.mutate({
      planId: selectedPlan,
      employeeCount,
      organizationId: organizationId || undefined,
    });
  };

  const handleProcessBilling = () => {
    if (!organizationId) {
      toast({
        title: "Missing Organization",
        description: "Please enter an organization ID.",
        variant: "destructive",
      });
      return;
    }

    processBillingMutation.mutate(organizationId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="pricing-management-page">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Pricing Management
          </h1>
          <p className="text-muted-foreground">
            Manage pricing plans, billing automation, and revenue analytics
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calculator">Pricing Calculator</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="revenue-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-revenue">
                  {metricsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(metrics?.totalRevenue || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            <Card data-testid="subscriptions-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="active-subscriptions">
                  {metricsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    metrics?.activeSubscriptions || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Currently paying</p>
              </CardContent>
            </Card>

            <Card data-testid="mrr-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="mrr-amount">
                  {metricsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(metrics?.monthlyRecurringRevenue || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">MRR this month</p>
              </CardContent>
            </Card>

            <Card data-testid="churn-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="churn-rate">
                  {metricsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatPercent(metrics?.churnRate || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Monthly churn</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Key performance indicators for your pricing strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Average Employee Count</Label>
                  <div className="text-xl font-semibold" data-testid="avg-employee-count">
                    {metrics?.averageEmployeeCount?.toFixed(1) || "0.0"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Revenue per Employee</Label>
                  <div className="text-xl font-semibold" data-testid="revenue-per-employee">
                    {metrics?.averageEmployeeCount && metrics.totalRevenue 
                      ? formatCurrency(metrics.totalRevenue / metrics.averageEmployeeCount)
                      : formatCurrency(0)
                    }
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Market Position</Label>
                  <Badge variant="secondary" data-testid="market-position">
                    Enterprise Tier (£20-35 PEPM)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Dynamic Pricing Calculator
              </CardTitle>
              <CardDescription>
                Calculate custom pricing based on employee count and pricing rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="plan-select">Pricing Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger data-testid="plan-selector">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatCurrency(parseFloat(plan.basePrice))} per employee
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-count">Employee Count</Label>
                  <Input
                    id="employee-count"
                    type="number"
                    min="1"
                    max="10000"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 1)}
                    data-testid="input-employee-count"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization-id">Organization ID (Optional)</Label>
                  <Input
                    id="organization-id"
                    placeholder="Enter organization ID for existing rules"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    data-testid="input-organization-id"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCalculatePricing}
                disabled={calculatePricingMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-calculate-pricing"
              >
                {calculatePricingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate Pricing
              </Button>

              {pricingCalculation && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">Pricing Calculation Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-sm text-green-600">Base Price</Label>
                        <div className="text-xl font-bold text-green-800" data-testid="calculated-base-price">
                          {formatCurrency(pricingCalculation.basePrice)}
                        </div>
                        <p className="text-xs text-green-600">per employee per month</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm text-green-600">Total Discount</Label>
                        <div className="text-xl font-bold text-green-800" data-testid="calculated-discount">
                          {formatPercent(pricingCalculation.discount)}
                        </div>
                        <p className="text-xs text-green-600">off base price</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm text-green-600">Final Price</Label>
                        <div className="text-xl font-bold text-green-800" data-testid="calculated-final-price">
                          {formatCurrency(pricingCalculation.finalPrice)}
                        </div>
                        <p className="text-xs text-green-600">per employee per month</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-green-600">Monthly Total</Label>
                      <div className="text-2xl font-bold text-green-800" data-testid="calculated-monthly-total">
                        {formatCurrency(pricingCalculation.finalPrice * employeeCount)}
                      </div>
                    </div>

                    {pricingCalculation.appliedRules.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-green-600">Applied Pricing Rules</Label>
                        <div className="space-y-1">
                          {pricingCalculation.appliedRules.map((rule, index) => (
                            <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                              {rule}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const features = JSON.parse(plan.features as string) || [];
              const includedFeatures = features.filter((f: any) => f.included);
              const excludedFeatures = features.filter((f: any) => !f.included);

              return (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle data-testid={`plan-title-${plan.id}`}>{plan.name}</CardTitle>
                      {plan.discountPercent !== "0" && (
                        <Badge variant="secondary" data-testid={`plan-discount-${plan.id}`}>
                          {plan.discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardDescription data-testid={`plan-description-${plan.id}`}>
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold" data-testid={`plan-price-${plan.id}`}>
                          {formatCurrency(parseFloat(plan.basePrice))}
                        </span>
                        <span className="text-sm text-muted-foreground">per employee per month</span>
                      </div>
                      {plan.setupFee !== "0" && (
                        <div className="text-sm text-muted-foreground">
                          Setup fee: {formatCurrency(parseFloat(plan.setupFee))}
                        </div>
                      )}
                      {plan.maxEmployees && (
                        <div className="text-sm text-muted-foreground">
                          Up to {plan.maxEmployees} employees
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">Included Features</h4>
                      <div className="space-y-1">
                        {includedFeatures.slice(0, 5).map((feature: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>{feature.name}</span>
                          </div>
                        ))}
                        {includedFeatures.length > 5 && (
                          <div className="text-sm text-muted-foreground">
                            + {includedFeatures.length - 5} more features
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setSelectedPlan(plan.id)}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Billing Management
              </CardTitle>
              <CardDescription>
                Process billing cycles and manage organization subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billing-org-id">Organization ID</Label>
                    <Input
                      id="billing-org-id"
                      placeholder="Enter organization ID to process billing"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      data-testid="input-billing-org-id"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleProcessBilling}
                      disabled={processBillingMutation.isPending || !organizationId}
                      data-testid="button-process-billing"
                    >
                      {processBillingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Process Billing
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Automated Billing Status</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium text-green-800">Billing Automation</div>
                      <div className="text-sm text-green-600">Running continuously</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <div className="font-medium text-blue-800">Usage Tracking</div>
                      <div className="text-sm text-blue-600">Real-time monitoring</div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Pricing Strategy</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Volume Discounts</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>50-99 employees</span>
                        <Badge variant="outline">5% discount</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>100-249 employees</span>
                        <Badge variant="outline">10% discount</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>250+ employees</span>
                        <Badge variant="outline">20% discount</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Automated Features</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>Usage-based billing adjustments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>Prorated billing for mid-cycle changes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>Automatic trial-to-paid conversion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>Failed payment handling</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}