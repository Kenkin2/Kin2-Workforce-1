import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Play, CheckCircle } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or data-testid
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  highlight?: boolean;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  tourType: 'welcome' | 'compliance' | 'jobs' | 'scheduling';
}

const tourSteps: Record<string, TourStep[]> = {
  welcome: [
    {
      id: '1',
      title: 'Welcome to Kin2 Workforce',
      description: 'Get started with the most comprehensive workforce management platform. This tour will show you the key features.',
      target: '[data-testid="text-page-title"]',
      position: 'bottom'
    },
    {
      id: '2',
      title: 'Navigation Menu',
      description: 'Access all platform features from the sidebar. Each section is organized by business function.',
      target: 'nav',
      position: 'right'
    },
    {
      id: '3',
      title: 'Dashboard Overview',
      description: 'Monitor key metrics, active jobs, worker performance, and recent activities from your main dashboard.',
      target: '[data-testid="card-active-jobs"]',
      position: 'top'
    },
    {
      id: '4',
      title: 'Quick Actions',
      description: 'Create new jobs, schedule shifts, and manage workers with one-click actions.',
      target: '[data-testid="button-create-job"]',
      position: 'bottom'
    },
    {
      id: '5',
      title: 'User Profile',
      description: 'Access your profile, settings, and logout from the sidebar. Your KarmaCoins are displayed here too.',
      target: '[data-testid="text-user-name"]',
      position: 'right'
    }
  ],
  compliance: [
    {
      id: '1',
      title: 'Compliance Dashboard',
      description: 'Monitor compliance across 7 major regulations including GDPR, HIPAA, SOX, and ISO 27001.',
      target: '[data-testid="nav-compliance"]',
      position: 'right'
    },
    {
      id: '2',
      title: 'Regulatory Overview',
      description: 'View overall compliance scores, active incidents, and data retention status at a glance.',
      target: '.grid',
      position: 'bottom'
    },
    {
      id: '3',
      title: 'Assessment Tools',
      description: 'Run automated compliance assessments and export detailed reports for auditors.',
      target: '[data-testid="button-run-assessment"]',
      position: 'left'
    },
    {
      id: '4',
      title: 'Audit Logs',
      description: 'Access comprehensive audit trails for all user actions and system events with real-time monitoring.',
      target: '[data-testid="tab-audit-logs"]',
      position: 'top'
    }
  ],
  jobs: [
    {
      id: '1',
      title: 'Job Management',
      description: 'Create, edit, and manage all your job postings from this central hub.',
      target: '[data-testid="nav-jobs"]',
      position: 'right'
    },
    {
      id: '2',
      title: 'Create New Job',
      description: 'Click here to post a new job. Fill in details like title, description, pay rate, and requirements.',
      target: '[data-testid="button-create-job"]',
      position: 'bottom'
    },
    {
      id: '3',
      title: 'Job Status Tracking',
      description: 'Monitor job status: Draft, Active, Paused, or Completed. Filter and sort jobs by status.',
      target: '[data-testid="filter-status"]',
      position: 'top'
    },
    {
      id: '4',
      title: 'Worker Assignment',
      description: 'Assign qualified workers to jobs and track their progress throughout the project.',
      target: '[data-testid="button-assign-worker"]',
      position: 'left'
    }
  ],
  scheduling: [
    {
      id: '1',
      title: 'Advanced Scheduling',
      description: 'Create optimized schedules with AI-powered recommendations and conflict detection.',
      target: '[data-testid="nav-advanced-scheduling"]',
      position: 'right'
    },
    {
      id: '2',
      title: 'Calendar View',
      description: 'View all shifts in calendar format. Drag and drop to reschedule or create new shifts.',
      target: '.calendar-view',
      position: 'top'
    },
    {
      id: '3',
      title: 'Availability Management',
      description: 'Set worker availability and preferences to optimize scheduling decisions.',
      target: '[data-testid="tab-availability"]',
      position: 'bottom'
    },
    {
      id: '4',
      title: 'Recurring Shifts',
      description: 'Create templates for recurring shifts and generate schedules automatically.',
      target: '[data-testid="button-create-recurring"]',
      position: 'left'
    }
  ]
};

export function GuidedTour({ isOpen, onClose, tourType }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const steps = tourSteps[tourType] || [];
  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen && step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        if (step.highlight !== false) {
          element.classList.add('tour-highlight');
          setTimeout(() => element.classList.remove('tour-highlight'), 3000);
        }
      }
    }
  }, [currentStep, isOpen, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      setTimeout(() => {
        onClose();
        setCurrentStep(0);
        setIsCompleted(false);
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen || !step) return null;

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center p-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tour Complete!</h3>
            <p className="text-muted-foreground">
              You're all set to start using {tourType === 'welcome' ? 'Kin2 Workforce' : `the ${tourType} features`}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      {/* Tour Overlay */}
      <div className="absolute inset-0" onClick={handleSkip} />
      
      {/* Tour Card */}
      <div className="fixed bottom-6 right-6 max-w-sm">
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {tourType}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>
            
            {step.action && (
              <div className="bg-muted p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Try it:</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{step.action}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-primary' : 
                      index < currentStep ? 'bg-primary/50' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// CSS for highlighting elements during tour
const tourStyles = `
  .tour-highlight {
    position: relative;
    z-index: 40;
    box-shadow: 0 0 0 4px rgb(59 130 246 / 0.5), 0 0 0 8px rgb(59 130 246 / 0.2);
    border-radius: 8px;
    animation: tour-pulse 2s ease-in-out infinite;
  }
  
  @keyframes tour-pulse {
    0%, 100% { 
      box-shadow: 0 0 0 4px rgb(59 130 246 / 0.5), 0 0 0 8px rgb(59 130 246 / 0.2);
    }
    50% { 
      box-shadow: 0 0 0 6px rgb(59 130 246 / 0.7), 0 0 0 12px rgb(59 130 246 / 0.3);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = tourStyles;
  document.head.appendChild(styleSheet);
}