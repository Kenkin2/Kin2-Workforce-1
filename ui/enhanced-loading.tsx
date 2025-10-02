import { useState, useEffect } from "react";
import { Loader2, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface EnhancedLoaderProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "detailed";
}

export function EnhancedLoader({ 
  message = "Loading...", 
  progress = 0,
  showProgress = false,
  size = "md",
  variant = "default"
}: EnhancedLoaderProps) {
  const [dots, setDots] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <span className="ml-2 text-sm text-muted-foreground">
          {message}{".".repeat(dots)}
        </span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading</h3>
            <p className="text-sm text-muted-foreground">
              {message}{".".repeat(dots)}
            </p>
          </div>
          {showProgress && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <Loader2 className={`${sizeClasses[size]} text-primary animate-spin mx-auto`} />
        <p className="text-sm text-muted-foreground">
          {message}{".".repeat(dots)}
        </p>
      </div>
    </div>
  );
}

interface SmartLoaderProps {
  isOnline?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  message?: string;
}

export function SmartLoader({ 
  isOnline = true, 
  hasError = false, 
  onRetry,
  message = "Loading content..."
}: SmartLoaderProps) {
  if (hasError) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">Loading Error</h3>
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading content.
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isOnline) {
    return (
      <Card className="w-full max-w-md mx-auto border-orange-200 dark:border-orange-800">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Offline Mode</h3>
            <p className="text-sm text-muted-foreground">
              You're currently offline. Some features may be limited.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>Connected</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Pulse animation component for skeleton loading
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={`bg-muted animate-pulse rounded ${className}`} />
  );
}

// Shimmer effect for loading states
export function ShimmerLoader({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}