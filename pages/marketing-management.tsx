import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Mail, 
  Send, 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  MessageSquare,
  BarChart3,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Eye,
  MousePointer,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { insertMarketingCampaignSchema, insertEmailTemplateSchema, insertSocialMediaPostSchema } from "@shared/schema";
import { z } from "zod";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

type MarketingCampaign = {
  id: string;
  name: string;
  description: string;
  campaignType: 'email' | 'social' | 'paid_ads' | 'content' | 'event';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  budget: string;
  actualSpend: string;
  startDate: Date;
  endDate: Date;
  targetAudience: string;
  goals: string[];
  createdAt: Date;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
};

type SocialMediaPost = {
  id: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor: Date;
  publishedAt?: Date;
};

export default function MarketingManagement() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['/api/marketing/campaigns'],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/marketing/email-templates'],
  });

  const { data: socialPosts = [], isLoading: postsLoading } = useQuery<SocialMediaPost[]>({
    queryKey: ['/api/marketing/social-posts'],
  });

  const { data: metrics } = useQuery<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpend: number;
    totalLeads: number;
    totalConversions: number;
    roi: number;
  }>({
    queryKey: ['/api/marketing/metrics'],
  });

  const campaignForm = useForm<z.infer<typeof insertMarketingCampaignSchema>>({
    resolver: zodResolver(insertMarketingCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      campaignType: "email",
      status: "draft",
      budget: "0",
      actualSpend: "0",
      targetAudience: "",
      goals: [],
    },
  });

  const templateForm = useForm<z.infer<typeof insertEmailTemplateSchema>>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      isActive: true,
    },
  });

  const postForm = useForm<z.infer<typeof insertSocialMediaPostSchema>>({
    resolver: zodResolver(insertSocialMediaPostSchema),
    defaultValues: {
      platform: "facebook",
      content: "",
      status: "draft",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMarketingCampaignSchema>) => {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/metrics'] });
      toast({ title: "Campaign created successfully!" });
      setCreateCampaignOpen(false);
      campaignForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEmailTemplateSchema>) => {
      const response = await fetch('/api/marketing/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/email-templates'] });
      toast({ title: "Email template created successfully!" });
      setCreateTemplateOpen(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating template", description: error.message, variant: "destructive" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertSocialMediaPostSchema>) => {
      const response = await fetch('/api/marketing/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/social-posts'] });
      toast({ title: "Social media post created successfully!" });
      setCreatePostOpen(false);
      postForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
    },
  });

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 dark:bg-green-600';
      case 'scheduled': return 'bg-blue-500 dark:bg-blue-600';
      case 'completed': return 'bg-gray-500 dark:bg-gray-600';
      case 'paused': return 'bg-yellow-500 dark:bg-yellow-600';
      default: return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const campaignTypeData = campaigns.reduce((acc: any[], campaign) => {
    const existing = acc.find(item => item.name === campaign.campaignType);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: campaign.campaignType, value: 1 });
    }
    return acc;
  }, []);

  const spendByMonth = [
    { month: 'Jan', budget: 5000, spend: 4500 },
    { month: 'Feb', budget: 6000, spend: 5800 },
    { month: 'Mar', budget: 5500, spend: 5200 },
    { month: 'Apr', budget: 7000, spend: 6800 },
    { month: 'May', budget: 6500, spend: 6200 },
    { month: 'Jun', budget: 8000, spend: 7500 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Marketing Management</h1>
            <p className="text-muted-foreground mt-2">Manage campaigns, email templates, and social media content</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-total-campaigns">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-campaigns">{metrics?.totalCampaigns || 0}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-active-campaigns">
                {metrics?.activeCampaigns || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-total-budget">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-budget">${(metrics?.totalBudget || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-total-spend">
                ${(metrics?.totalSpend || 0).toLocaleString()} spent
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-total-leads">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-leads">{metrics?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-total-conversions">
                {metrics?.totalConversions || 0} conversions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-roi">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-roi">{(metrics?.roi || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Return on investment
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <Target className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="email-templates" data-testid="tab-email-templates">
              <Mail className="w-4 h-4 mr-2" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="social-media" data-testid="tab-social-media">
              <MessageSquare className="w-4 h-4 mr-2" />
              Social Media
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marketing Campaigns</h2>
              <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-campaign">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create New Campaign</DialogTitle>
                    <DialogDescription>Create a new marketing campaign to reach your audience</DialogDescription>
                  </DialogHeader>
                  <Form {...campaignForm}>
                    <form onSubmit={campaignForm.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={campaignForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Summer Promotion 2025" {...field} data-testid="input-campaign-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your campaign goals..." {...field} value={field.value || ''} data-testid="input-campaign-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="campaignType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-campaign-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="email">Email Campaign</SelectItem>
                                  <SelectItem value="social">Social Media</SelectItem>
                                  <SelectItem value="paid_ads">Paid Advertising</SelectItem>
                                  <SelectItem value="content">Content Marketing</SelectItem>
                                  <SelectItem value="event">Event Marketing</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-campaign-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget ($)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="10000" {...field} value={field.value || ''} data-testid="input-campaign-budget" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Audience</FormLabel>
                              <FormControl>
                                <Input placeholder="Small businesses" {...field} value={typeof field.value === 'string' ? field.value : ''} data-testid="input-target-audience" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                        {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaignsLoading ? (
                <div className="col-span-3 text-center py-12" data-testid="loading-campaigns">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground" data-testid="empty-campaigns">
                  No campaigns yet. Create your first campaign to get started!
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-campaign-${campaign.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.name}</CardTitle>
                          <CardDescription className="mt-1" data-testid={`text-campaign-description-${campaign.id}`}>{campaign.description}</CardDescription>
                        </div>
                        <Badge className={`${getCampaignStatusColor(campaign.status)} text-white`} data-testid={`badge-campaign-status-${campaign.id}`}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize" data-testid={`text-campaign-type-${campaign.id}`}>{campaign.campaignType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                          <span className="font-medium text-gray-900 dark:text-white" data-testid={`text-campaign-budget-${campaign.id}`}>${Number(campaign.budget).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Spend:</span>
                          <span className="font-medium text-gray-900 dark:text-white" data-testid={`text-campaign-spend-${campaign.id}`}>${Number(campaign.actualSpend).toLocaleString()}</span>
                        </div>
                        {campaign.targetAudience && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Audience:</span>
                            <span className="font-medium text-gray-900 dark:text-white" data-testid={`text-campaign-audience-${campaign.id}`}>{campaign.targetAudience}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="email-templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Templates</h2>
              <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-template">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create Email Template</DialogTitle>
                    <DialogDescription>Create a reusable email template for your campaigns</DialogDescription>
                  </DialogHeader>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit((data) => createTemplateMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={templateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Welcome Email" {...field} data-testid="input-template-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Welcome to Kin2 Workforce!" {...field} data-testid="input-template-subject" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="htmlContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HTML Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="<h1>Welcome!</h1><p>Thank you for joining...</p>" 
                                {...field} 
                                className="min-h-[150px]"
                                data-testid="input-template-html"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="textContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plain Text Content (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Welcome! Thank you for joining..." 
                                {...field} 
                                value={field.value || ''}
                                data-testid="input-template-text"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createTemplateMutation.isPending} data-testid="button-submit-template">
                        {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {templatesLoading ? (
                <div className="col-span-2 text-center py-12" data-testid="loading-templates">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground" data-testid="empty-templates">
                  No email templates yet. Create your first template!
                </div>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-template-${template.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-template-name-${template.id}`}>{template.name}</CardTitle>
                          <CardDescription className="mt-1" data-testid={`text-template-subject-${template.id}`}>{template.subject}</CardDescription>
                        </div>
                        {template.isActive && (
                          <Badge className="bg-green-500 dark:bg-green-600 text-white" data-testid={`badge-template-active-${template.id}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-preview-template-${template.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-send-template-${template.id}`}>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="social-media" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Social Media Posts</h2>
              <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-create-post">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Create Social Media Post</DialogTitle>
                    <DialogDescription>Schedule a post across your social media channels</DialogDescription>
                  </DialogHeader>
                  <Form {...postForm}>
                    <form onSubmit={postForm.handleSubmit((data) => createPostMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={postForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-post-platform">
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="twitter">Twitter</SelectItem>
                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={postForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What's happening?" 
                                {...field} 
                                className="min-h-[120px]"
                                data-testid="input-post-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={postForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-post-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createPostMutation.isPending} data-testid="button-submit-post">
                        {createPostMutation.isPending ? "Creating..." : "Create Post"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {postsLoading ? (
                <div className="col-span-3 text-center py-12" data-testid="loading-posts">Loading posts...</div>
              ) : socialPosts.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground" data-testid="empty-posts">
                  No social media posts yet. Create your first post!
                </div>
              ) : (
                socialPosts.map((post) => (
                  <Card key={post.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-post-${post.id}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded" data-testid={`icon-platform-${post.id}`}>
                          {getPlatformIcon(post.platform)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm capitalize text-gray-900 dark:text-white" data-testid={`text-post-platform-${post.id}`}>{post.platform}</CardTitle>
                          <CardDescription className="text-xs" data-testid={`text-post-status-${post.id}`}>
                            {post.status === 'scheduled' && <Clock className="w-3 h-3 inline mr-1" />}
                            {post.status === 'published' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                            {post.status === 'failed' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                            {post.status}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3" data-testid={`text-post-content-${post.id}`}>{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marketing Analytics</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-campaign-performance-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
                  <CardDescription>Budget vs actual spend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-campaign-performance">
                    <LineChart data={spendByMonth}>
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
                      <Legend />
                      <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} name="Budget" />
                      <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} name="Actual Spend" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-campaign-types-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Campaign Types</CardTitle>
                  <CardDescription>Distribution by campaign type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-campaign-types">
                    <PieChart>
                      <Pie
                        data={campaignTypeData.length > 0 ? campaignTypeData : [{ name: 'No data', value: 1 }]}
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
                        {campaignTypeData.map((entry, index) => (
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
