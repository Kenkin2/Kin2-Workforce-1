import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Workflow,
  Target,
  Gauge,
  Activity,
  Bot,
  Cog
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'scheduling' | 'performance' | 'notifications' | 'optimization' | 'compliance';
  trigger: {
    type: 'threshold' | 'time' | 'event' | 'ai_prediction';
    condition: string;
    value?: any;
  };
  actions: {
    type: 'notify' | 'adjust_schedule' | 'assign_task' | 'generate_report' | 'optimize_resource';
    parameters: any;
  }[];
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  executionCount: number;
  lastExecuted?: Date;
  successRate: number;
  estimatedSavings: string;
  aiConfidence: number;
}

interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  logs: string[];
}

export default function AIAutomationHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);

  // Automation rules query
  const { data: automationRules = [] } = useQuery<AutomationRule[]>({
    queryKey: ['/api/ai/automation/rules'],
    enabled: true
  });

  // Recent executions query
  const { data: recentExecutions = [] } = useQuery<AutomationExecution[]>({
    queryKey: ['/api/ai/automation/executions'],
    refetchInterval: 30000, // 30 seconds
    enabled: true
  });

  // Toggle automation rule
  const toggleRuleMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      fetch(`/api/ai/automation/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/automation/rules'] });
    }
  });

  // Create automation rule
  const createRuleMutation = useMutation({
    mutationFn: (rule: Partial<AutomationRule>) =>
      fetch('/api/ai/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/automation/rules'] });
      setIsCreateRuleOpen(false);
    }
  });

  useEffect(() => {
    setExecutions(recentExecutions);
  }, [recentExecutions]);

  // Mock data for demonstration
  const mockRules: AutomationRule[] = [
    {
      id: 'rule1',
      name: 'Auto Schedule Optimization',
      description: 'Automatically optimize schedules when efficiency drops below 75%',
      category: 'scheduling',
      trigger: {
        type: 'threshold',
        condition: 'efficiency < 75',
        value: 75
      },
      actions: [
        {
          type: 'optimize_resource',
          parameters: { type: 'schedule', target: 'efficiency' }
        },
        {
          type: 'notify',
          parameters: { recipients: ['managers'], message: 'Schedule optimized automatically' }
        }
      ],
      isActive: true,
      priority: 'high',
      executionCount: 23,
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
      successRate: 91,
      estimatedSavings: '$1,200/month',
      aiConfidence: 0.89
    },
    {
      id: 'rule2',
      name: 'Performance Alert System',
      description: 'Send alerts when team productivity falls below target',
      category: 'performance',
      trigger: {
        type: 'threshold',
        condition: 'productivity < 80',
        value: 80
      },
      actions: [
        {
          type: 'notify',
          parameters: { recipients: ['team_leads'], message: 'Productivity alert triggered' }
        },
        {
          type: 'generate_report',
          parameters: { type: 'performance_analysis' }
        }
      ],
      isActive: true,
      priority: 'medium',
      executionCount: 15,
      lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000),
      successRate: 95,
      estimatedSavings: '$800/month',
      aiConfidence: 0.92
    },
    {
      id: 'rule3',
      name: 'AI Task Assignment',
      description: 'Automatically assign tasks based on AI analysis of employee skills and availability',
      category: 'optimization',
      trigger: {
        type: 'event',
        condition: 'new_task_created',
      },
      actions: [
        {
          type: 'assign_task',
          parameters: { method: 'ai_optimization', criteria: ['skills', 'availability', 'workload'] }
        }
      ],
      isActive: false,
      priority: 'high',
      executionCount: 47,
      lastExecuted: new Date(Date.now() - 30 * 60 * 1000),
      successRate: 88,
      estimatedSavings: '$2,100/month',
      aiConfidence: 0.94
    }
  ];

  const mockExecutions: AutomationExecution[] = [
    {
      id: 'exec1',
      ruleId: 'rule1',
      ruleName: 'Auto Schedule Optimization',
      status: 'completed',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
      result: { optimized: true, efficiency_gain: '8%' },
      logs: ['Detected efficiency drop to 73%', 'Running optimization algorithm', 'Schedule updated', 'Notifications sent']
    },
    {
      id: 'exec2',
      ruleId: 'rule2',
      ruleName: 'Performance Alert System',
      status: 'completed',
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 12000),
      result: { alerts_sent: 3, report_generated: true },
      logs: ['Productivity threshold breached', 'Generating alerts', 'Report created', 'Notifications delivered']
    },
    {
      id: 'exec3',
      ruleId: 'rule3',
      ruleName: 'AI Task Assignment',
      status: 'running',
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      logs: ['New task detected', 'Analyzing employee skills', 'Calculating optimal assignment']
    }
  ];

  const currentRules = automationRules.length > 0 ? automationRules : mockRules;
  const currentExecutions = executions.length > 0 ? executions : mockExecutions;

  const filteredRules = selectedCategory === 'all' 
    ? currentRules 
    : currentRules.filter(rule => rule.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Automation Hub</h3>
          <Badge variant="outline" className="ml-2">
            <Bot className="h-3 w-3 mr-1" />
            {currentRules.filter(r => r.isActive).length} Active
          </Badge>
        </div>
        <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rule name..." />
              <Textarea placeholder="Description..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="optimization">Optimization</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => setIsCreateRuleOpen(false)}>
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Rules
        </Button>
        <Button
          variant={selectedCategory === 'scheduling' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('scheduling')}
        >
          Scheduling
        </Button>
        <Button
          variant={selectedCategory === 'performance' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('performance')}
        >
          Performance
        </Button>
        <Button
          variant={selectedCategory === 'optimization' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('optimization')}
        >
          Optimization
        </Button>
        <Button
          variant={selectedCategory === 'notifications' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('notifications')}
        >
          Notifications
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{rule.name}</CardTitle>
                      <Badge className={`text-xs ${getPriorityColor(rule.priority)}`}>
                        {rule.priority}
                      </Badge>
                    </div>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => 
                        toggleRuleMutation.mutate({ ruleId: rule.id, isActive: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Executions:</span> {rule.executionCount}
                    </div>
                    <div>
                      <span className="font-medium">Success Rate:</span> {rule.successRate}%
                    </div>
                    <div>
                      <span className="font-medium">Savings:</span> {rule.estimatedSavings}
                    </div>
                    <div>
                      <span className="font-medium">AI Confidence:</span> {Math.round(rule.aiConfidence * 100)}%
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>AI Confidence</span>
                      <span>{Math.round(rule.aiConfidence * 100)}%</span>
                    </div>
                    <Progress value={rule.aiConfidence * 100} className="h-1" />
                  </div>

                  {rule.lastExecuted && (
                    <div className="text-xs text-muted-foreground">
                      Last executed: {rule.lastExecuted.toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-1 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="space-y-3">
            {currentExecutions.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <h4 className="font-semibold text-sm">{execution.ruleName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {execution.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {execution.startedAt.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Execution Logs:</strong>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono space-y-1">
                      {execution.logs.map((log, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                    
                    {execution.result && (
                      <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs">
                        <strong>Result:</strong> {JSON.stringify(execution.result, null, 2)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentRules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {currentRules.filter(r => r.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(currentRules.reduce((sum, r) => sum + r.successRate, 0) / currentRules.length)}%
                </div>
                <p className="text-xs text-muted-foreground">Average across all rules</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Monthly Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,100</div>
                <p className="text-xs text-muted-foreground">Estimated from active rules</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}