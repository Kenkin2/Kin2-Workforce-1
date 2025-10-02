import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Heart, 
  ShoppingCart, 
  Utensils, 
  Wrench, 
  GraduationCap,
  Truck,
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react";

interface IndustryWorkflow {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: any;
  complexity: 'simple' | 'moderate' | 'complex';
  automationLevel: number;
  steps: WorkflowStep[];
  compliance: string[];
  benefits: string[];
  estimatedSavings: string;
  implementationTime: string;
  active?: boolean;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'conditional';
  duration: string;
  dependencies?: string[];
  automation?: {
    trigger: string;
    action: string;
    conditions?: string[];
  };
}

const industryWorkflows: IndustryWorkflow[] = [
  {
    id: 'healthcare-shift-management',
    name: 'Healthcare Shift Management',
    industry: 'Healthcare',
    description: 'Automated shift scheduling with compliance checks for healthcare facilities',
    icon: Heart,
    complexity: 'complex',
    automationLevel: 85,
    estimatedSavings: '40% reduction in scheduling time',
    implementationTime: '2-3 weeks',
    compliance: ['HIPAA', 'Joint Commission', 'State Healthcare Regulations'],
    benefits: [
      'Automated nurse-to-patient ratio compliance',
      'Real-time certification tracking',
      'Emergency coverage automation',
      'Break and meal compliance',
      'Overtime optimization'
    ],
    steps: [
      {
        id: 'cert-check',
        name: 'Certification Verification',
        description: 'Automatically verify staff certifications and licenses',
        type: 'automated',
        duration: '2 minutes',
        automation: {
          trigger: 'Shift assignment request',
          action: 'Check certification status and expiry dates',
          conditions: ['Valid license', 'Current certifications', 'Specialty qualifications']
        }
      },
      {
        id: 'ratio-compliance',
        name: 'Patient Ratio Compliance',
        description: 'Ensure proper nurse-to-patient ratios per unit',
        type: 'automated',
        duration: '1 minute',
        dependencies: ['cert-check'],
        automation: {
          trigger: 'Unit assignment',
          action: 'Calculate and validate staffing ratios',
          conditions: ['Minimum staffing levels', 'Acuity-based ratios', 'Unit-specific requirements']
        }
      },
      {
        id: 'emergency-coverage',
        name: 'Emergency Coverage',
        description: 'Automatically assign emergency coverage when needed',
        type: 'conditional',
        duration: '5 minutes',
        automation: {
          trigger: 'Emergency call-in or absence',
          action: 'Find and assign qualified replacement',
          conditions: ['Available qualified staff', 'Overtime limits', 'Union rules']
        }
      }
    ]
  },
  {
    id: 'retail-seasonal-staffing',
    name: 'Retail Seasonal Staffing',
    industry: 'Retail',
    description: 'Dynamic staffing optimization based on sales forecasts and foot traffic',
    icon: ShoppingCart,
    complexity: 'moderate',
    automationLevel: 75,
    estimatedSavings: '25% reduction in labor costs',
    implementationTime: '1-2 weeks',
    compliance: ['Fair Labor Standards Act', 'State Labor Laws', 'Predictive Scheduling Laws'],
    benefits: [
      'Sales-based staffing optimization',
      'Seasonal demand forecasting',
      'Customer traffic correlation',
      'Inventory management integration',
      'Performance-based scheduling'
    ],
    steps: [
      {
        id: 'demand-forecast',
        name: 'Demand Forecasting',
        description: 'Predict customer traffic and sales volume',
        type: 'automated',
        duration: '10 minutes',
        automation: {
          trigger: 'Daily scheduling run',
          action: 'Analyze historical data and predict demand',
          conditions: ['Historical sales data', 'Weather patterns', 'Local events', 'Seasonal trends']
        }
      },
      {
        id: 'skill-matching',
        name: 'Skill-Based Assignment',
        description: 'Match staff skills to department needs',
        type: 'automated',
        duration: '5 minutes',
        dependencies: ['demand-forecast'],
        automation: {
          trigger: 'Staffing requirements calculated',
          action: 'Assign staff based on skills and performance',
          conditions: ['Product knowledge', 'Sales performance', 'Customer service ratings']
        }
      },
      {
        id: 'break-optimization',
        name: 'Break Optimization',
        description: 'Schedule breaks during low-traffic periods',
        type: 'automated',
        duration: '2 minutes',
        dependencies: ['skill-matching'],
        automation: {
          trigger: 'Shift assignments completed',
          action: 'Optimize break and meal schedules',
          conditions: ['Minimum coverage', 'Peak hours avoidance', 'Legal break requirements']
        }
      }
    ]
  },
  {
    id: 'construction-safety-workflow',
    name: 'Construction Safety Workflow',
    industry: 'Construction',
    description: 'Comprehensive safety compliance and risk management system',
    icon: Building2,
    complexity: 'complex',
    automationLevel: 70,
    estimatedSavings: '60% reduction in safety incidents',
    implementationTime: '3-4 weeks',
    compliance: ['OSHA', 'State Building Codes', 'Union Safety Requirements'],
    benefits: [
      'Real-time safety monitoring',
      'Automated incident reporting',
      'Equipment inspection tracking',
      'Weather-based work decisions',
      'Crew safety certification'
    ],
    steps: [
      {
        id: 'safety-briefing',
        name: 'Daily Safety Briefing',
        description: 'Mandatory safety briefing before work begins',
        type: 'manual',
        duration: '15 minutes',
        automation: {
          trigger: 'Shift start',
          action: 'Generate safety briefing checklist',
          conditions: ['Site-specific hazards', 'Weather conditions', 'Equipment status']
        }
      },
      {
        id: 'equipment-check',
        name: 'Equipment Safety Check',
        description: 'Verify all equipment passes safety inspection',
        type: 'automated',
        duration: '10 minutes',
        dependencies: ['safety-briefing'],
        automation: {
          trigger: 'Equipment assignment',
          action: 'Check inspection status and safety records',
          conditions: ['Current inspection certificates', 'Maintenance records', 'Operator certifications']
        }
      },
      {
        id: 'weather-monitoring',
        name: 'Weather Monitoring',
        description: 'Continuous weather monitoring for safety decisions',
        type: 'automated',
        duration: 'Continuous',
        automation: {
          trigger: 'Weather alerts',
          action: 'Assess work safety and make recommendations',
          conditions: ['Wind speed limits', 'Precipitation levels', 'Temperature extremes']
        }
      }
    ]
  },
  {
    id: 'restaurant-service-optimization',
    name: 'Restaurant Service Optimization',
    industry: 'Food Service',
    description: 'Optimize staffing based on reservations, walk-ins, and service standards',
    icon: Utensils,
    complexity: 'moderate',
    automationLevel: 80,
    estimatedSavings: '30% improvement in service efficiency',
    implementationTime: '1-2 weeks',
    compliance: ['Food Safety Regulations', 'Labor Laws', 'Health Department Requirements'],
    benefits: [
      'Reservation-based staffing',
      'Kitchen-service coordination',
      'Table turnover optimization',
      'Peak hour management',
      'Food safety compliance'
    ],
    steps: [
      {
        id: 'reservation-analysis',
        name: 'Reservation Analysis',
        description: 'Analyze reservations and predict walk-in traffic',
        type: 'automated',
        duration: '5 minutes',
        automation: {
          trigger: 'Daily planning cycle',
          action: 'Calculate expected covers and timing',
          conditions: ['Reservation data', 'Historical walk-in patterns', 'Special events']
        }
      },
      {
        id: 'staff-positioning',
        name: 'Staff Positioning',
        description: 'Position staff based on expected service flow',
        type: 'automated',
        duration: '3 minutes',
        dependencies: ['reservation-analysis'],
        automation: {
          trigger: 'Cover calculations complete',
          action: 'Assign servers, hosts, and kitchen staff',
          conditions: ['Service area capacity', 'Staff experience levels', 'Menu complexity']
        }
      },
      {
        id: 'kitchen-coordination',
        name: 'Kitchen Coordination',
        description: 'Coordinate kitchen staff with service demands',
        type: 'automated',
        duration: '2 minutes',
        dependencies: ['staff-positioning'],
        automation: {
          trigger: 'Service assignments complete',
          action: 'Schedule kitchen staff and prep work',
          conditions: ['Menu prep requirements', 'Cook skill levels', 'Equipment availability']
        }
      }
    ]
  },
  {
    id: 'manufacturing-production-flow',
    name: 'Manufacturing Production Flow',
    industry: 'Manufacturing',
    description: 'Optimize production line staffing and quality control processes',
    icon: Wrench,
    complexity: 'complex',
    automationLevel: 90,
    estimatedSavings: '35% increase in production efficiency',
    implementationTime: '4-6 weeks',
    compliance: ['ISO 9001', 'Safety Regulations', 'Quality Standards'],
    benefits: [
      'Production line optimization',
      'Quality control automation',
      'Maintenance scheduling',
      'Skill-based assignments',
      'Efficiency monitoring'
    ],
    steps: [
      {
        id: 'production-planning',
        name: 'Production Planning',
        description: 'Plan production schedules based on orders and capacity',
        type: 'automated',
        duration: '15 minutes',
        automation: {
          trigger: 'Production order received',
          action: 'Calculate optimal production schedule',
          conditions: ['Order priorities', 'Machine capacity', 'Material availability']
        }
      },
      {
        id: 'skill-assignment',
        name: 'Skill-Based Assignment',
        description: 'Assign workers based on skills and certifications',
        type: 'automated',
        duration: '10 minutes',
        dependencies: ['production-planning'],
        automation: {
          trigger: 'Production schedule confirmed',
          action: 'Match worker skills to production requirements',
          conditions: ['Technical certifications', 'Experience levels', 'Quality ratings']
        }
      },
      {
        id: 'quality-checkpoints',
        name: 'Quality Checkpoints',
        description: 'Schedule quality control inspections',
        type: 'automated',
        duration: '5 minutes',
        dependencies: ['skill-assignment'],
        automation: {
          trigger: 'Production assignments complete',
          action: 'Schedule quality control checkpoints',
          conditions: ['Quality standards', 'Inspector availability', 'Checkpoint intervals']
        }
      }
    ]
  }
];

export default function IndustryWorkflows() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<IndustryWorkflow | null>(null);
  const [activeWorkflows, setActiveWorkflows] = useState<string[]>(['healthcare-shift-management']);

  const handleActivateWorkflow = (workflowId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to activate workflows.",
        variant: "destructive",
      });
      return;
    }

    const workflow = industryWorkflows.find(w => w.id === workflowId);
    if (!workflow) return;

    if (activeWorkflows.includes(workflowId)) {
      setActiveWorkflows(prev => prev.filter(id => id !== workflowId));
      toast({
        title: "Workflow Deactivated",
        description: `${workflow.name} has been deactivated.`,
      });
    } else {
      setActiveWorkflows(prev => [...prev, workflowId]);
      toast({
        title: "Workflow Activated",
        description: `${workflow.name} is now running automatically.`,
      });
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'complex': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const industries = ['All', 'Healthcare', 'Retail', 'Construction', 'Food Service', 'Manufacturing'];
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  const filteredWorkflows = selectedIndustry === 'All' 
    ? industryWorkflows 
    : industryWorkflows.filter(w => w.industry === selectedIndustry);

  return (
    <AppLayout 
      title="Industry Workflows"
      breadcrumbs={[{ label: "Operations", href: "/operations-management" }, { label: "Industry Workflows" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Industry-Specific Workflows
            </h2>
            <p className="text-muted-foreground">Automated workflows tailored for your industry</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {activeWorkflows.length} Active
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Workflow Settings
            </Button>
          </div>
        </div>

        {/* Industry Filter */}
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <Button
              key={industry}
              variant={selectedIndustry === industry ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedIndustry(industry)}
              data-testid={`button-filter-${industry.toLowerCase()}`}
            >
              {industry}
            </Button>
          ))}
        </div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => {
            const Icon = workflow.icon;
            const isActive = activeWorkflows.includes(workflow.id);
            
            return (
              <Card 
                key={workflow.id} 
                className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  isActive ? 'border-green-500/50 bg-green-500/5' : ''
                }`}
                onClick={() => setSelectedWorkflow(workflow)}
                data-testid={`card-workflow-${workflow.id}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{workflow.industry}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isActive && <Badge className="bg-green-500 text-white">Active</Badge>}
                      <div className={`w-2 h-2 rounded-full ${getComplexityColor(workflow.complexity)}`} title={workflow.complexity} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Automation Level:</span>
                      <span className="font-medium">{workflow.automationLevel}%</span>
                    </div>
                    <Progress value={workflow.automationLevel} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Savings:</span>
                      <p className="font-medium text-green-600">{workflow.estimatedSavings}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setup Time:</span>
                      <p className="font-medium">{workflow.implementationTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={isActive ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateWorkflow(workflow.id);
                      }}
                      data-testid={`button-activate-${workflow.id}`}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkflow(workflow);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Workflow Detail Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <selectedWorkflow.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{selectedWorkflow.name}</CardTitle>
                      <p className="text-muted-foreground">{selectedWorkflow.industry} Industry</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkflow(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{selectedWorkflow.description}</p>
                
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="steps">Steps</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="benefits">Benefits</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                          <p className="text-sm font-medium">Automation</p>
                          <p className="text-lg font-bold">{selectedWorkflow.automationLevel}%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm font-medium">Setup Time</p>
                          <p className="text-lg font-bold">{selectedWorkflow.implementationTime}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                          <p className="text-sm font-medium">Savings</p>
                          <p className="text-sm font-bold text-green-600">{selectedWorkflow.estimatedSavings}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${
                            selectedWorkflow.complexity === 'simple' ? 'text-green-500' :
                            selectedWorkflow.complexity === 'moderate' ? 'text-yellow-500' : 'text-red-500'
                          }`} />
                          <p className="text-sm font-medium">Complexity</p>
                          <p className="text-lg font-bold capitalize">{selectedWorkflow.complexity}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="steps" className="space-y-4">
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => (
                        <Card key={step.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{step.name}</h4>
                                  <Badge variant={
                                    step.type === 'automated' ? 'default' :
                                    step.type === 'conditional' ? 'secondary' : 'outline'
                                  }>
                                    {step.type}
                                  </Badge>
                                  <Badge variant="outline">{step.duration}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                {step.automation && (
                                  <div className="bg-muted/50 p-3 rounded-lg">
                                    <p className="text-xs font-medium mb-1">Automation Details:</p>
                                    <p className="text-xs"><strong>Trigger:</strong> {step.automation.trigger}</p>
                                    <p className="text-xs"><strong>Action:</strong> {step.automation.action}</p>
                                    {step.automation.conditions && (
                                      <div className="mt-1">
                                        <p className="text-xs"><strong>Conditions:</strong></p>
                                        <ul className="text-xs list-disc list-inside ml-2">
                                          {step.automation.conditions.map((condition, idx) => (
                                            <li key={idx}>{condition}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="compliance" className="space-y-4">
                    <div className="grid gap-4">
                      {selectedWorkflow.compliance.map((requirement, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-green-500" />
                            <span className="font-medium">{requirement}</span>
                            <Badge variant="outline" className="ml-auto">Compliant</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="benefits" className="space-y-4">
                    <div className="grid gap-3">
                      {selectedWorkflow.benefits.map((benefit, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>{benefit}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleActivateWorkflow(selectedWorkflow.id);
                      setSelectedWorkflow(null);
                    }}
                    data-testid={`button-modal-activate-${selectedWorkflow.id}`}
                  >
                    {activeWorkflows.includes(selectedWorkflow.id) ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Deactivate Workflow
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Activate Workflow
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}