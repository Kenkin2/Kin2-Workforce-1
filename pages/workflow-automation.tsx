import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Bell,
  Mail,
  Webhook
} from 'lucide-react';

const ruleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().min(1, 'Description is required'),
  triggerType: z.enum(['job_created', 'shift_completed', 'payment_processed', 'user_registered', 'schedule_time']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']),
    value: z.string()
  })),
  actions: z.array(z.object({
    type: z.enum(['send_notification', 'assign_worker', 'update_status', 'create_task', 'send_email', 'webhook_call']),
    config: z.record(z.any())
  })),
  isActive: z.boolean().default(true)
});

type RuleFormData = z.infer<typeof ruleSchema>;

export default function WorkflowAutomation() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/workflows/rules'],
  });

  const { data: executions = { stats: null, executions: [] } } = useQuery<{
    stats: {
      total: number;
      successRate: number;
      averageDuration: number;
      failed: number;
    } | null;
    executions: any[];
  }>({
    queryKey: ['/api/workflows/executions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      description: '',
      triggerType: 'job_created',
      conditions: [],
      actions: [],
      isActive: true
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: RuleFormData) => apiRequest('POST', '/api/workflows/rules', data),
    onSuccess: () => {
      toast({
        title: "Rule Created",
        description: "Workflow rule has been created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/workflows/rules'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow rule",
        variant: "destructive",
      });
    },
  });

  const triggerRuleMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: any }) => 
      apiRequest('POST', `/api/workflows/trigger/${ruleId}`, data),
    onSuccess: () => {
      toast({
        title: "Rule Triggered",
        description: "Workflow rule has been executed manually",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows/executions'] });
    },
  });

  const onSubmit = (data: RuleFormData) => {
    createRuleMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="loading-workflow-automation">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="workflow-automation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="title-workflow-automation">
            Workflow Automation
          </h1>
          <p className="text-gray-600 dark:text-gray-400" data-testid="text-workflow-description">
            Automate business processes with custom rules and triggers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-rule">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workflow Rule</DialogTitle>
              <DialogDescription>
                Define automated business processes and triggers
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter rule name" {...field} data-testid="input-rule-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what this rule does" {...field} data-testid="textarea-rule-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Event</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trigger-type">
                            <SelectValue placeholder="Select trigger event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="job_created">Job Created</SelectItem>
                          <SelectItem value="shift_completed">Shift Completed</SelectItem>
                          <SelectItem value="payment_processed">Payment Processed</SelectItem>
                          <SelectItem value="user_registered">User Registered</SelectItem>
                          <SelectItem value="schedule_time">Scheduled Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this rule to run automatically
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-rule-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRuleMutation.isPending} data-testid="button-save-rule">
                    {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
          <TabsTrigger value="executions" data-testid="tab-executions">Executions</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule: any) => (
              <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        {rule.name}
                        <Badge variant={rule.isActive ? 'default' : 'secondary'} data-testid={`badge-rule-status-${rule.id}`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerRuleMutation.mutate({ ruleId: rule.id, data: {} })}
                        disabled={triggerRuleMutation.isPending}
                        data-testid={`button-trigger-rule-${rule.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-edit-rule-${rule.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Trigger:</span>
                      <Badge variant="outline" className="ml-2" data-testid={`badge-trigger-${rule.id}`}>
                        {rule.trigger.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Actions: </span>
                      {rule.actions.map((action: any, index: number) => (
                        <Badge key={index} variant="secondary" className="ml-1" data-testid={`badge-action-${rule.id}-${index}`}>
                          {action.type === 'send_notification' && <Bell className="w-3 h-3 mr-1" />}
                          {action.type === 'send_email' && <Mail className="w-3 h-3 mr-1" />}
                          {action.type === 'webhook_call' && <Webhook className="w-3 h-3 mr-1" />}
                          {action.type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span data-testid={`text-executions-${rule.id}`}>
                        Executed {rule.executionCount} times
                      </span>
                      {rule.lastExecuted && (
                        <span data-testid={`text-last-executed-${rule.id}`}>
                          Last: {new Date(rule.lastExecuted).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card data-testid="card-execution-stats">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-total-executions">
                      {executions.stats?.total ?? 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Executions</div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-success-rate">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-success-rate">
                      {executions.stats?.successRate?.toFixed(1) ?? 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-avg-duration">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid="text-avg-duration">
                      {executions.stats?.averageDuration?.toFixed(0) ?? 0}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Duration</div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-failed-count">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600" data-testid="text-failed-count">
                      {executions.stats?.failed ?? 0}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card data-testid="card-recent-executions">
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest workflow automation executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.executions?.map((execution: any, index: number) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`execution-${index}`}>
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
                        <div className="text-sm text-gray-600" data-testid={`text-execution-timestamp-${index}`}>
                          {new Date(execution.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        execution.result === 'success' ? 'default' :
                        execution.result === 'partial' ? 'secondary' : 'destructive'
                      } data-testid={`badge-execution-result-${index}`}>
                        {execution.result}
                      </Badge>
                      <div className="text-xs text-gray-600 mt-1">
                        {execution.duration}ms • {execution.executedActions.length} actions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {/* Pre-built workflow templates */}
            <Card data-testid="card-template-job-assignment">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Auto Job Assignment
                </CardTitle>
                <CardDescription>
                  Automatically assign qualified workers to new job postings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Trigger:</strong> Job Created
                  </div>
                  <div className="text-sm">
                    <strong>Actions:</strong> Find best match worker, assign job, send notifications
                  </div>
                  <Button size="sm" variant="outline" data-testid="button-use-job-template">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-template-payment-reminder">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Payment Reminders
                </CardTitle>
                <CardDescription>
                  Send automatic payment reminders for overdue invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Trigger:</strong> Scheduled (Weekly)
                  </div>
                  <div className="text-sm">
                    <strong>Actions:</strong> Check overdue payments, send email reminders
                  </div>
                  <Button size="sm" variant="outline" data-testid="button-use-payment-template">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-template-timesheet-reminder">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Timesheet Reminders
                </CardTitle>
                <CardDescription>
                  Remind workers to submit timesheets at end of week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Trigger:</strong> Scheduled (Friday 5 PM)
                  </div>
                  <div className="text-sm">
                    <strong>Actions:</strong> Check incomplete timesheets, send reminders
                  </div>
                  <Button size="sm" variant="outline" data-testid="button-use-timesheet-template">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}