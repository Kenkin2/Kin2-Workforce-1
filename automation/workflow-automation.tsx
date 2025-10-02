import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Clock, Users, Mail, Calendar, Target, AlertTriangle, 
  Plus, Settings, Play, Pause, Edit 
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'time' | 'event' | 'condition';
    config: Record<string, any>;
  };
  actions: Array<{
    type: 'notification' | 'email' | 'assignment' | 'status_change';
    config: Record<string, any>;
  }>;
  isActive: boolean;
  lastTriggered?: string;
  executionCount: number;
}

export function WorkflowAutomation() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Auto-assign urgent jobs',
      description: 'Automatically assign high-priority jobs to available top-rated workers',
      trigger: {
        type: 'event',
        config: { event: 'job_posted', condition: 'priority = urgent' }
      },
      actions: [
        { type: 'assignment', config: { criteria: 'top_rated_available' } },
        { type: 'notification', config: { template: 'urgent_job_assigned' } }
      ],
      isActive: true,
      lastTriggered: '2024-08-30T10:30:00Z',
      executionCount: 15
    },
    {
      id: '2',
      name: 'Weekly performance reminder',
      description: 'Send performance summary emails every Friday',
      trigger: {
        type: 'time',
        config: { schedule: 'weekly', day: 'friday', time: '09:00' }
      },
      actions: [
        { type: 'email', config: { template: 'weekly_performance', recipients: 'all_workers' } }
      ],
      isActive: true,
      lastTriggered: '2024-08-30T09:00:00Z',
      executionCount: 4
    },
    {
      id: '3',
      name: 'Overdue timesheet alerts',
      description: 'Alert workers and managers about overdue timesheets',
      trigger: {
        type: 'condition',
        config: { check: 'timesheet_overdue', threshold: '2_days' }
      },
      actions: [
        { type: 'notification', config: { template: 'overdue_timesheet_worker' } },
        { type: 'notification', config: { template: 'overdue_timesheet_manager' } }
      ],
      isActive: true,
      executionCount: 8
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerType: 'event',
    actionType: 'notification'
  });

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'time': return <Clock className="h-4 w-4" />;
      case 'event': return <Zap className="h-4 w-4" />;
      case 'condition': return <Target className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'notification': return <AlertTriangle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'assignment': return <Users className="h-4 w-4" />;
      case 'status_change': return <Edit className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="workflow-automation">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Automate repetitive tasks and streamline your workforce management
          </p>
        </div>
        
        <Button onClick={() => setIsCreating(true)} data-testid="button-create-automation">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id} className={rule.isActive ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule(rule.id)}
                        data-testid={`switch-rule-${rule.id}`}
                      />
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Trigger</Label>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        {getTriggerTypeIcon(rule.trigger.type)}
                        <span className="text-sm capitalize">{rule.trigger.type}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Actions ({rule.actions.length})</Label>
                      <div className="flex flex-wrap gap-1">
                        {rule.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-1 p-1 bg-muted rounded text-xs">
                            {getActionTypeIcon(action.type)}
                            <span className="capitalize">{action.type.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Statistics</Label>
                      <div className="text-sm text-muted-foreground">
                        <div>Executed: {rule.executionCount} times</div>
                        {rule.lastTriggered && (
                          <div>Last: {new Date(rule.lastTriggered).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Smart Job Assignment',
                description: 'Automatically assign jobs based on worker skills and availability',
                category: 'Assignment'
              },
              {
                name: 'Payment Reminders',
                description: 'Send automated payment status updates to workers',
                category: 'Communication'
              },
              {
                name: 'Performance Alerts',
                description: 'Alert managers when worker performance drops',
                category: 'Monitoring'
              },
              {
                name: 'Shift Optimization',
                description: 'Automatically optimize shift schedules for efficiency',
                category: 'Scheduling'
              },
              {
                name: 'Training Reminders',
                description: 'Remind workers about mandatory training deadlines',
                category: 'Compliance'
              },
              {
                name: 'Client Follow-up',
                description: 'Automated follow-up with clients after job completion',
                category: 'Customer Service'
              }
            ].map((template, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                    <p className="text-2xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                    <p className="text-2xl font-bold">
                      {automationRules.reduce((sum, rule) => sum + rule.executionCount, 0)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
                    <p className="text-2xl font-bold">47h</p>
                    <p className="text-xs text-green-600">This month</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-xs text-green-600">Highly reliable</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}