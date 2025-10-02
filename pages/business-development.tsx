import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Handshake, 
  Plus, 
  TrendingUp, 
  Target,
  FileBarChart,
  Rocket,
  DollarSign,
  Calendar,
  Users,
  Globe,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  LineChart
} from "lucide-react";
import { insertPartnershipSchema, insertMarketAnalysisSchema, insertStrategicPlanSchema, insertGrowthMetricSchema } from "@shared/schema";
import { z } from "zod";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

type Partnership = {
  id: string;
  partnerName: string;
  partnerType: 'vendor' | 'reseller' | 'technology' | 'strategic' | 'affiliate' | 'channel';
  status: 'prospecting' | 'negotiating' | 'active' | 'inactive' | 'terminated';
  contractValue?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  description: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
};

type MarketAnalysis = {
  id: string;
  analysisType: 'competitor' | 'market_sizing' | 'trend_analysis' | 'customer_segments' | 'swot';
  title: string;
  description: string;
  findings: any;
  recommendations: string[];
  analysisDate: Date;
};

type StrategicPlan = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: Date;
  endDate: Date;
  budget: string;
  actualSpend?: string;
  goals: string[];
  kpis: any;
  progress: number;
};

type GrowthMetric = {
  id: string;
  metricType: 'revenue' | 'users' | 'market_share' | 'customer_acquisition' | 'retention';
  metricName: string;
  value: string;
  targetValue?: string;
  trend: 'up' | 'down' | 'stable';
  periodStart: Date;
  periodEnd: Date;
};

export default function BusinessDevelopment() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("partnerships");
  const [createPartnershipOpen, setCreatePartnershipOpen] = useState(false);
  const [createAnalysisOpen, setCreateAnalysisOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);

  const { data: partnerships = [], isLoading: partnershipsLoading } = useQuery<Partnership[]>({
    queryKey: ['/api/business-development/partnerships'],
  });

  const { data: marketAnalyses = [], isLoading: analysesLoading } = useQuery<MarketAnalysis[]>({
    queryKey: ['/api/business-development/market-analysis'],
  });

  const { data: strategicPlans = [], isLoading: plansLoading } = useQuery<StrategicPlan[]>({
    queryKey: ['/api/business-development/strategic-plans'],
  });

  const { data: growthMetrics = [], isLoading: metricsLoading } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/business-development/growth-metrics'],
  });

  const { data: summary } = useQuery<{
    partnerships: {
      totalPartnerships: number;
      activePartnerships: number;
      totalContractValue: number;
      averageContractDuration: number;
    };
  }>({
    queryKey: ['/api/business-development/metrics/summary'],
  });

  const partnershipForm = useForm<z.infer<typeof insertPartnershipSchema>>({
    resolver: zodResolver(insertPartnershipSchema),
    defaultValues: {
      partnerName: "",
      partnerType: "technology",
      status: "prospecting",
      ownerId: "demo-user",
      description: "",
    },
  });

  const analysisForm = useForm<z.infer<typeof insertMarketAnalysisSchema>>({
    resolver: zodResolver(insertMarketAnalysisSchema),
    defaultValues: {
      analysisType: "competitor",
      title: "",
      description: "",
      findings: {},
      recommendations: [],
      analysisDate: new Date(),
    },
  });

  const planForm = useForm<z.infer<typeof insertStrategicPlanSchema>>({
    resolver: zodResolver(insertStrategicPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      planType: "annual",
      ownerId: "demo-user",
      budget: "0",
      progress: 0,
    },
  });

  const createPartnershipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPartnershipSchema>) => {
      const response = await fetch('/api/business-development/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create partnership');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-development/partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-development/metrics/summary'] });
      toast({ title: "Partnership created successfully!" });
      setCreatePartnershipOpen(false);
      partnershipForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating partnership", description: error.message, variant: "destructive" });
    },
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMarketAnalysisSchema>) => {
      const response = await fetch('/api/business-development/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create market analysis');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-development/market-analysis'] });
      toast({ title: "Market analysis created successfully!" });
      setCreateAnalysisOpen(false);
      analysisForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating market analysis", description: error.message, variant: "destructive" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertStrategicPlanSchema>) => {
      const response = await fetch('/api/business-development/strategic-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create strategic plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-development/strategic-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-development/metrics/summary'] });
      toast({ title: "Strategic plan created successfully!" });
      setCreatePlanOpen(false);
      planForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating strategic plan", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 dark:bg-green-600';
      case 'in_progress': return 'bg-blue-500 dark:bg-blue-600';
      case 'completed': return 'bg-purple-500 dark:bg-purple-600';
      case 'negotiating': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'suspended': return 'bg-orange-500 dark:bg-orange-600';
      case 'terminated': return 'bg-red-500 dark:bg-red-600';
      default: return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const partnerTypeData = partnerships.reduce((acc: any[], partnership) => {
    const existing = acc.find(item => item.name === partnership.partnerType);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: partnership.partnerType, value: 1 });
    }
    return acc;
  }, []);

  const growthTrendData = [
    { month: 'Jan', revenue: 120000, users: 2500, marketShare: 12 },
    { month: 'Feb', revenue: 135000, users: 2850, marketShare: 13.2 },
    { month: 'Mar', revenue: 148000, users: 3100, marketShare: 14.1 },
    { month: 'Apr', revenue: 162000, users: 3450, marketShare: 15.3 },
    { month: 'May', revenue: 178000, users: 3800, marketShare: 16.8 },
    { month: 'Jun', revenue: 195000, users: 4200, marketShare: 18.2 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Business Development</h1>
            <p className="text-muted-foreground mt-2">Manage partnerships, market analysis, and strategic planning</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-total-partnerships">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Partnerships</CardTitle>
              <Handshake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-partnerships">{summary?.partnerships.totalPartnerships || 0}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-active-partnerships">
                {summary?.partnerships.activePartnerships || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-contract-value">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-contract-value">
                ${(summary?.partnerships.totalContractValue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total contract value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-market-analyses">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Market Analyses</CardTitle>
              <FileBarChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-market-analyses-count">{marketAnalyses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Research conducted
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-strategic-plans">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Strategic Plans</CardTitle>
              <Rocket className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-strategic-plans-count">{strategicPlans.length}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-strategic-plans-in-progress">
                {strategicPlans.filter(p => p.status === 'active' || p.status === 'in_progress').length} in progress
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="partnerships" data-testid="tab-partnerships">
              <Handshake className="w-4 h-4 mr-2" />
              Partnerships
            </TabsTrigger>
            <TabsTrigger value="market-analysis" data-testid="tab-market-analysis">
              <FileBarChart className="w-4 h-4 mr-2" />
              Market Analysis
            </TabsTrigger>
            <TabsTrigger value="strategic-plans" data-testid="tab-strategic-plans">
              <Rocket className="w-4 h-4 mr-2" />
              Strategic Plans
            </TabsTrigger>
            <TabsTrigger value="growth-metrics" data-testid="tab-growth-metrics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Growth Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partnerships" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Partnerships</h2>
              <Dialog open={createPartnershipOpen} onOpenChange={setCreatePartnershipOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-partnership">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Partnership
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create New Partnership</DialogTitle>
                    <DialogDescription>Add a new business partnership or collaboration</DialogDescription>
                  </DialogHeader>
                  <Form {...partnershipForm}>
                    <form onSubmit={partnershipForm.handleSubmit((data) => createPartnershipMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={partnershipForm.control}
                        name="partnerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Partner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corporation" {...field} data-testid="input-partner-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={partnershipForm.control}
                          name="partnerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Partnership Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-partner-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="strategic">Strategic</SelectItem>
                                  <SelectItem value="vendor">Vendor</SelectItem>
                                  <SelectItem value="reseller">Reseller</SelectItem>
                                  <SelectItem value="affiliate">Affiliate</SelectItem>
                                  <SelectItem value="channel">Channel</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partnershipForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-partner-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="prospecting">Prospecting</SelectItem>
                                  <SelectItem value="negotiating">Negotiating</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="terminated">Terminated</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={partnershipForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the partnership..." {...field} value={field.value || ''} data-testid="input-partner-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={partnershipForm.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} value={field.value || ''} data-testid="input-contact-person" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partnershipForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@partner.com" {...field} value={field.value || ''} data-testid="input-contact-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={partnershipForm.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} data-testid="input-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={partnershipForm.control}
                        name="contractValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Value ($) (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100000" {...field} value={field.value || ''} data-testid="input-contract-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createPartnershipMutation.isPending} data-testid="button-submit-partnership">
                        {createPartnershipMutation.isPending ? "Creating..." : "Create Partnership"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partnershipsLoading ? (
                <div className="col-span-3 text-center py-12" data-testid="loading-partnerships">Loading partnerships...</div>
              ) : partnerships.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground" data-testid="empty-partnerships">
                  No partnerships yet. Add your first partnership to get started!
                </div>
              ) : (
                partnerships.map((partnership) => (
                  <Card key={partnership.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-partnership-${partnership.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-partnership-name-${partnership.id}`}>{partnership.partnerName}</CardTitle>
                          <CardDescription className="mt-1 capitalize" data-testid={`text-partnership-type-${partnership.id}`}>{partnership.partnerType.replace('_', ' ')}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(partnership.status)} text-white`} data-testid={`badge-partnership-status-${partnership.id}`}>
                          {partnership.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2" data-testid={`text-partnership-description-${partnership.id}`}>{partnership.description}</p>
                      {partnership.contractValue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Contract Value:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-partnership-contract-value-${partnership.id}`}>${Number(partnership.contractValue).toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="market-analysis" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Market Analysis</h2>
              <Dialog open={createAnalysisOpen} onOpenChange={setCreateAnalysisOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-analysis">
                    <Plus className="w-4 h-4 mr-2" />
                    New Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create Market Analysis</DialogTitle>
                    <DialogDescription>Document your market research and competitive intelligence</DialogDescription>
                  </DialogHeader>
                  <Form {...analysisForm}>
                    <form onSubmit={analysisForm.handleSubmit((data) => createAnalysisMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={analysisForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Analysis Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Q4 2025 Market Expansion Study" {...field} data-testid="input-analysis-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={analysisForm.control}
                        name="analysisType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Analysis Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-analysis-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="competitor">Competitor Analysis</SelectItem>
                                <SelectItem value="market_sizing">Market Sizing</SelectItem>
                                <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                                <SelectItem value="customer_segments">Customer Segments</SelectItem>
                                <SelectItem value="swot">SWOT Analysis</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={analysisForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the analysis and key questions..." {...field} value={field.value || ''} className="min-h-[100px]" data-testid="input-analysis-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createAnalysisMutation.isPending} data-testid="button-submit-analysis">
                        {createAnalysisMutation.isPending ? "Creating..." : "Create Analysis"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {analysesLoading ? (
                <div className="col-span-2 text-center py-12" data-testid="loading-analyses">Loading analyses...</div>
              ) : marketAnalyses.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground" data-testid="empty-analyses">
                  No market analyses yet. Create your first analysis!
                </div>
              ) : (
                marketAnalyses.map((analysis) => (
                  <Card key={analysis.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-analysis-${analysis.id}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded" data-testid={`icon-analysis-${analysis.id}`}>
                          <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-analysis-title-${analysis.id}`}>{analysis.title}</CardTitle>
                          <CardDescription className="mt-1 capitalize" data-testid={`text-analysis-type-${analysis.id}`}>{analysis.analysisType.replace('_', ' ')}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3" data-testid={`text-analysis-description-${analysis.id}`}>{analysis.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span data-testid={`text-analysis-date-${analysis.id}`}>Analysis Date: {new Date(analysis.analysisDate).toLocaleDateString()}</span>
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <Badge variant="outline" data-testid={`badge-analysis-recommendations-${analysis.id}`}>{analysis.recommendations.length} Recommendations</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="strategic-plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Strategic Plans</h2>
              <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-plan">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create Strategic Plan</DialogTitle>
                    <DialogDescription>Define a strategic initiative for business growth</DialogDescription>
                  </DialogHeader>
                  <Form {...planForm}>
                    <form onSubmit={planForm.handleSubmit((data) => createPlanMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={planForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input placeholder="2025 International Expansion" {...field} data-testid="input-plan-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the strategic plan..." {...field} value={field.value || ''} data-testid="input-plan-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={planForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-plan-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="on_hold">On Hold</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={planForm.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget ($)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="500000" {...field} value={field.value || ''} data-testid="input-plan-budget" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createPlanMutation.isPending} data-testid="button-submit-plan">
                        {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plansLoading ? (
                <div className="col-span-3 text-center py-12" data-testid="loading-plans">Loading plans...</div>
              ) : strategicPlans.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground" data-testid="empty-plans">
                  No strategic plans yet. Create your first plan!
                </div>
              ) : (
                strategicPlans.map((plan) => (
                  <Card key={plan.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-plan-${plan.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-plan-title-${plan.id}`}>{plan.title}</CardTitle>
                          <CardDescription className="mt-1" data-testid={`text-plan-description-${plan.id}`}>{plan.description}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(plan.status)} text-white`} data-testid={`badge-plan-status-${plan.id}`}>
                          {plan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-plan-budget-${plan.id}`}>${Number(plan.budget).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-plan-progress-${plan.id}`}>{plan.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" data-testid={`progress-bar-container-${plan.id}`}>
                          <div 
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${plan.progress || 0}%` }}
                            data-testid={`progress-bar-fill-${plan.id}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="growth-metrics" className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Growth Metrics Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-revenue-growth-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Revenue Growth Trend</CardTitle>
                  <CardDescription>Monthly revenue progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-revenue-growth">
                    <AreaChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(31 41 55)',
                          border: '1px solid rgb(75 85 99)',
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-partnership-distribution-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Partnership Distribution</CardTitle>
                  <CardDescription>By partnership type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-partnership-distribution">
                    <PieChart>
                      <Pie
                        data={partnerTypeData.length > 0 ? partnerTypeData : [{ name: 'No data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {partnerTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(31 41 55)',
                          border: '1px solid rgb(75 85 99)',
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-user-growth-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">User Growth</CardTitle>
                  <CardDescription>Monthly user acquisition</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-user-growth">
                    <BarChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(31 41 55)',
                          border: '1px solid rgb(75 85 99)',
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="users" fill="#10b981" strokeWidth={2} stroke="#fff" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-market-share-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Market Share Growth</CardTitle>
                  <CardDescription>Percentage of total market</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-market-share">
                    <AreaChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(31 41 55)',
                          border: '1px solid rgb(75 85 99)',
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                      <Area type="monotone" dataKey="marketShare" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
