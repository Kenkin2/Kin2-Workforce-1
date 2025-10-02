import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  UserPlus, 
  Users, 
  Percent, 
  Filter, 
  Smile, 
  Handshake, 
  TrendingUp, 
  Megaphone, 
  Rocket, 
  Headphones, 
  Ticket,
  ExternalLink,
  Calendar,
  DollarSign,
  Target,
  ArrowRight,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { CrmLead, InsertCrmLead } from "@shared/schema";
import { insertCrmLeadSchema } from "@shared/schema";
import { z } from "zod";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const leadFormSchema = insertCrmLeadSchema.pick({
  companyName: true,
  contactPerson: true,
  email: true,
  phone: true,
  estimatedValue: true,
  notes: true,
  status: true,
  source: true,
}).extend({
  status: z.string().optional(),
  source: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

type Campaign = {
  id: string;
  name: string;
  campaignType: string;
  status: string;
  budget: string;
  actualSpend?: string;
  startDate: Date;
  endDate?: Date;
  targetAudience?: string;
};

type LeadSource = {
  id: string;
  name: string;
  sourceType: string;
  conversionRate?: string;
  totalLeads: number;
  qualifiedLeads: number;
  isActive: boolean;
};

type Partnership = {
  id: string;
  partnerName: string;
  partnerType: string;
  status: string;
  contractValue?: string;
};

const ThemeAwareTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function CRMManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isDeleteLeadOpen, setIsDeleteLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/marketing/campaigns'],
  });

  const { data: leadSources = [], isLoading: leadSourcesLoading } = useQuery<LeadSource[]>({
    queryKey: ['/api/marketing/lead-sources'],
  });

  const { data: partnerships = [], isLoading: partnershipsLoading } = useQuery<Partnership[]>({
    queryKey: ['/api/business-development/partnerships'],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<CrmLead[]>({
    queryKey: ['/api/crm/leads'],
  });

  const createForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      estimatedValue: '',
      notes: '',
      status: 'new',
      source: 'manual',
    },
  });

  const editForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      estimatedValue: '',
      notes: '',
      status: 'new',
      source: 'manual',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      return apiRequest<CrmLead>('/api/crm/leads', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Success",
        description: "Lead added successfully!"
      });
      setIsCreateLeadOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadFormValues }) => {
      return apiRequest<CrmLead>(`/api/crm/leads/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Success",
        description: "Lead updated successfully!"
      });
      setIsEditLeadOpen(false);
      setSelectedLead(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/crm/leads/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Success",
        description: "Lead deleted successfully!"
      });
      setIsDeleteLeadOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleEditLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    editForm.reset({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email || '',
      phone: lead.phone || '',
      estimatedValue: lead.estimatedValue || '',
      notes: lead.notes || '',
      status: lead.status,
      source: lead.source || '',
    });
    setIsEditLeadOpen(true);
  };

  const handleDeleteLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    setIsDeleteLeadOpen(true);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-crm" />
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'scheduled');
  const activeLeadSources = leadSources.filter(s => s.isActive);
  const totalLeads = leadSources.reduce((sum, source) => sum + source.totalLeads, 0);
  const qualifiedLeads = leadSources.reduce((sum, source) => sum + source.qualifiedLeads, 0);
  const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0.0';

  const leadSourceData = activeLeadSources.map(source => ({
    name: source.name,
    total: source.totalLeads,
    qualified: source.qualifiedLeads,
    conversion: source.conversionRate ? parseFloat(source.conversionRate) : 0
  }));

  const campaignPerformanceData = campaigns.slice(0, 6).map(campaign => ({
    name: campaign.name.substring(0, 15),
    budget: parseFloat(campaign.budget || '0'),
    spend: parseFloat(campaign.actualSpend || '0'),
    efficiency: campaign.actualSpend ? 
      ((parseFloat(campaign.budget) - parseFloat(campaign.actualSpend)) / parseFloat(campaign.budget) * 100).toFixed(1) 
      : 100
  }));

  return (
    <AppLayout 
      title="CRM Management"
      breadcrumbs={[{ label: "Operations", href: "/operations-management" }, { label: "CRM Management" }]}
    >
      <div className="space-y-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Relationship Management</h2>
            <p className="text-muted-foreground mt-2">Integrated lead generation, sales pipeline, and customer success with marketing & partnerships</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-crm-reports" onClick={() => toast({ title: "CRM Reports", description: "Sales analytics and reporting coming soon!" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Sales Reports
            </Button>
            <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" data-testid="button-add-lead">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">Add New Lead</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit((data) => createLeadMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Company Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Company name" 
                              {...field} 
                              data-testid="input-lead-company" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Contact Person</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contact person" 
                              {...field} 
                              data-testid="input-lead-contact" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Email" 
                              {...field} 
                              data-testid="input-lead-email" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Phone</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel"
                              placeholder="Phone" 
                              {...field} 
                              data-testid="input-lead-phone" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="estimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Estimated Value</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Estimated value" 
                              {...field} 
                              data-testid="input-lead-value" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Notes" 
                              {...field} 
                              data-testid="textarea-lead-notes" 
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit"
                      disabled={createLeadMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                      data-testid="button-submit-lead"
                    >
                      {createLeadMutation.isPending ? "Creating..." : "Add Lead"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Edit Lead</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => selectedLead && updateLeadMutation.mutate({ id: selectedLead.id, data }))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Company name" 
                          {...field} 
                          data-testid="input-edit-lead-company" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Contact Person</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contact person" 
                          {...field} 
                          data-testid="input-edit-lead-contact" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Email" 
                          {...field} 
                          data-testid="input-edit-lead-email" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Phone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="Phone" 
                          {...field} 
                          data-testid="input-edit-lead-phone" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Estimated Value</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Estimated value" 
                          {...field} 
                          data-testid="input-edit-lead-value" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes" 
                          {...field} 
                          data-testid="textarea-edit-lead-notes" 
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  disabled={updateLeadMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                  data-testid="button-submit-edit-lead"
                >
                  {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteLeadOpen} onOpenChange={setIsDeleteLeadOpen}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Delete Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the lead for <strong>{selectedLead?.companyName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setIsDeleteLeadOpen(false)}
                  disabled={deleteLeadMutation.isPending}
                  className="flex-1"
                  data-testid="button-cancel-delete-lead"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => selectedLead && deleteLeadMutation.mutate(selectedLead.id)}
                  disabled={deleteLeadMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                  data-testid="button-confirm-delete-lead"
                >
                  {deleteLeadMutation.isPending ? "Deleting..." : "Delete Lead"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-total-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-leads">{totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-qualified-leads">
                {qualifiedLeads} qualified
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Conversion Rate</CardTitle>
              <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-conversion-rate">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalLeads > 0 ? 'Based on lead sources' : 'No leads yet'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-active-campaigns">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Active Campaigns</CardTitle>
              <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-active-campaigns">{activeCampaigns.length}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-total-campaigns">
                {campaigns.length} total campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-partnerships">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Partnerships</CardTitle>
              <Handshake className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-partnerships-count">{partnerships.length}</div>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-active-partnerships">
                {partnerships.filter(p => p.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 grid w-full grid-cols-5">
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="lead-sources" data-testid="tab-lead-sources">Lead Sources</TabsTrigger>
            <TabsTrigger value="partnerships" data-testid="tab-partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Lead Management</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Track and convert leads into customers</CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No leads found. Create your first lead to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900" data-testid={`card-lead-${lead.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white" data-testid={`lead-name-${lead.id}`}>{lead.companyName}</h4>
                          <Badge 
                            className={`${lead.status === 'hot' ? 'bg-red-500 dark:bg-red-600' : lead.status === 'warm' ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-blue-500 dark:bg-blue-600'} text-white`}
                            data-testid={`lead-status-${lead.id}`}
                          >
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Contact:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`lead-contact-${lead.id}`}>{lead.contactPerson}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`lead-value-${lead.id}`}>
                              {lead.estimatedValue ? `£${parseFloat(lead.estimatedValue).toLocaleString()}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`lead-source-${lead.id}`}>{lead.source || 'N/A'}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-gray-300 dark:border-gray-600" 
                              data-testid={`button-edit-lead-${lead.id}`} 
                              onClick={() => handleEditLead(lead)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950" 
                              data-testid={`button-delete-lead-${lead.id}`} 
                              onClick={() => handleDeleteLead(lead)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white" 
                              data-testid={`button-convert-lead-${lead.id}`} 
                              onClick={() => toast({ title: "Convert Lead", description: "Lead conversion coming soon!" })}
                            >
                              Convert
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Marketing Campaigns</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View and manage integrated marketing campaigns</p>
              </div>
              <Link href="/marketing-management">
                <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" data-testid="button-manage-campaigns">
                  <Rocket className="w-4 h-4 mr-2" />
                  Manage Campaigns
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {campaignsLoading ? (
              <div className="text-center py-12" data-testid="loading-campaigns">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="text-center py-8" data-testid="empty-campaigns">
                    <Megaphone className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first marketing campaign to start generating leads</p>
                    <Link href="/marketing-management">
                      <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
                        <Rocket className="mr-2 h-4 w-4" />
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-campaign-${campaign.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.name}</CardTitle>
                          <CardDescription className="mt-1 capitalize" data-testid={`text-campaign-type-${campaign.id}`}>
                            {campaign.campaignType.replace('_', ' ')}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={`${
                            campaign.status === 'active' ? 'bg-green-500 dark:bg-green-600' : 
                            campaign.status === 'scheduled' ? 'bg-blue-500 dark:bg-blue-600' : 
                            'bg-gray-500 dark:bg-gray-600'
                          } text-white`}
                          data-testid={`badge-campaign-status-${campaign.id}`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-campaign-budget-${campaign.id}`}>
                            ${Number(campaign.budget).toLocaleString()}
                          </span>
                        </div>
                        {campaign.actualSpend && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Spend:</span>
                            <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-campaign-spend-${campaign.id}`}>
                              ${Number(campaign.actualSpend).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {campaign.targetAudience && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Audience:</span>
                            <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-campaign-audience-${campaign.id}`}>
                              {campaign.targetAudience}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lead-sources" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lead Sources</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track lead generation channels and conversion rates</p>
              </div>
              <Link href="/marketing-management">
                <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" data-testid="button-manage-lead-sources">
                  <Target className="w-4 h-4 mr-2" />
                  Manage Sources
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {leadSourcesLoading ? (
              <div className="text-center py-12" data-testid="loading-lead-sources">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading lead sources...</p>
              </div>
            ) : activeLeadSources.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="text-center py-8" data-testid="empty-lead-sources">
                    <Target className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lead Sources Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Add lead sources to track where your customers come from</p>
                    <Link href="/marketing-management">
                      <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lead Source
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeLeadSources.map((source) => (
                  <Card key={source.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-lead-source-${source.id}`}>
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-source-name-${source.id}`}>{source.name}</CardTitle>
                      <CardDescription className="capitalize" data-testid={`text-source-type-${source.id}`}>
                        {source.sourceType.replace('_', ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total Leads:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-source-total-${source.id}`}>
                            {source.totalLeads}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Qualified:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400" data-testid={`text-source-qualified-${source.id}`}>
                            {source.qualifiedLeads}
                          </span>
                        </div>
                        {source.conversionRate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Conversion:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400" data-testid={`text-source-conversion-${source.id}`}>
                              {parseFloat(source.conversionRate).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Business Partnerships</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Strategic partnerships and business relationships</p>
              </div>
              <Link href="/business-development">
                <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600" data-testid="button-manage-partnerships">
                  <Handshake className="w-4 h-4 mr-2" />
                  Manage Partnerships
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {partnershipsLoading ? (
              <div className="text-center py-12" data-testid="loading-partnerships">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading partnerships...</p>
              </div>
            ) : partnerships.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="text-center py-8" data-testid="empty-partnerships">
                    <Handshake className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Partnerships Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Build strategic partnerships to grow your business</p>
                    <Link href="/business-development">
                      <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Partnership
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {partnerships.map((partnership) => (
                  <Card key={partnership.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid={`card-partnership-${partnership.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white" data-testid={`text-partnership-name-${partnership.id}`}>
                            {partnership.partnerName}
                          </CardTitle>
                          <CardDescription className="mt-1 capitalize" data-testid={`text-partnership-type-${partnership.id}`}>
                            {partnership.partnerType.replace('_', ' ')}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={`${
                            partnership.status === 'active' ? 'bg-green-500 dark:bg-green-600' : 
                            partnership.status === 'negotiating' ? 'bg-yellow-500 dark:bg-yellow-600' : 
                            'bg-gray-500 dark:bg-gray-600'
                          } text-white`}
                          data-testid={`badge-partnership-status-${partnership.id}`}
                        >
                          {partnership.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {partnership.contractValue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Contract Value:</span>
                          <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-partnership-value-${partnership.id}`}>
                            ${Number(partnership.contractValue).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">CRM Analytics</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-lead-sources-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Lead Sources Performance</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Leads by source with conversion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {leadSourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300} data-testid="chart-lead-sources">
                      <BarChart data={leadSourceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip content={<ThemeAwareTooltip />} />
                        <Legend wrapperStyle={{ color: '#6b7280', fontSize: 12 }} />
                        <Bar dataKey="total" fill={COLORS[0]} name="Total Leads" />
                        <Bar dataKey="qualified" fill={COLORS[1]} name="Qualified" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400" data-testid="empty-lead-sources-chart">
                      No lead source data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="card-campaign-performance-chart">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Campaign Budget vs. Spend</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Marketing campaign financial performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300} data-testid="chart-campaign-performance">
                      <BarChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip content={<ThemeAwareTooltip />} />
                        <Legend wrapperStyle={{ color: '#6b7280', fontSize: 12 }} />
                        <Bar dataKey="budget" fill={COLORS[4]} name="Budget" />
                        <Bar dataKey="spend" fill={COLORS[3]} name="Actual Spend" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400" data-testid="empty-campaign-performance-chart">
                      No campaign data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
