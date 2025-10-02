import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface LoadingStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
  duration?: number;
}

interface AdvancedLoaderProps {
  steps?: LoadingStep[];
  currentStep?: string;
  progress?: number;
  title?: string;
  description?: string;
  showSteps?: boolean;
  variant?: "default" | "minimal" | "detailed" | "steps";
}

export function AdvancedLoader({
  steps = [],
  currentStep,
  progress = 0,
  title = "Loading",
  description = "Please wait while we prepare everything for you...",
  showSteps = false,
  variant = "default"
}: AdvancedLoaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const getStepIcon = (status: LoadingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStepBadgeVariant = (status: LoadingStep["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "loading":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (variant === "minimal") {
    return (
      <div className="flex items-center space-x-3 p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    );
  }

  if (variant === "steps" && showSteps) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3">
                {getStepIcon(step.status)}
                <span className={`flex-1 text-sm ${
                  step.status === "completed" ? "text-foreground" : 
                  step.status === "loading" ? "text-primary font-medium" :
                  "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
                <Badge variant={getStepBadgeVariant(step.status)} className="text-xs">
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
          
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(animatedProgress)}%</span>
              </div>
              <Progress value={animatedProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {currentStep && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Current step:</p>
            <p className="text-sm font-medium">{currentStep}</p>
          </div>
        )}

        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={animatedProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(animatedProgress)}% complete
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for managing loading states
export function useLoadingSteps(initialSteps: LoadingStep[]) {
  const [steps, setSteps] = useState<LoadingStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<string | undefined>();

  const updateStep = (stepId: string, status: LoadingStep["status"]) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    
    if (status === "loading") {
      setCurrentStep(stepId);
    }
  };

  const startStep = (stepId: string) => updateStep(stepId, "loading");
  const completeStep = (stepId: string) => updateStep(stepId, "completed");
  const errorStep = (stepId: string) => updateStep(stepId, "error");

  const progress = (steps.filter(s => s.status === "completed").length / steps.length) * 100;

  return {
    steps,
    currentStep: steps.find(s => s.id === currentStep)?.label,
    progress,
    startStep,
    completeStep,
    errorStep,
    updateStep
  };
}