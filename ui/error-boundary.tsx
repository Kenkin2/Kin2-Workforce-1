import { Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { AlertTriangle, RefreshCw, Bug, Home, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with services like Sentry, LogRocket, etc.
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // Use router history for navigation instead of window.location
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  private getErrorMessage = (error: Error) => {
    // Provide user-friendly error messages for common issues
    if (error.message.includes('ChunkLoadError')) {
      return {
        title: 'Update Available',
        message: 'A new version of the application is available. Please refresh to get the latest features.',
        action: 'Refresh Page'
      };
    }

    if (error.message.includes('Network Error')) {
      return {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        action: 'Retry'
      };
    }

    if (error.message.includes('Permission denied')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.',
        action: 'Go Home'
      };
    }

    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Our team has been notified.',
      action: 'Try Again'
    };
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDetails = this.getErrorMessage(this.state.error!);
      const isComponentLevel = this.props.level === 'component';

      if (isComponentLevel) {
        return (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-medium text-destructive">{errorDetails.title}</h4>
                  <p className="text-xs text-muted-foreground">{errorDetails.message}</p>
                  <Button onClick={this.handleReset} size="sm" variant="outline">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {errorDetails.action}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive text-xl">{errorDetails.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                {errorDetails.message}
              </p>

              {this.state.errorId && (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Error ID:</p>
                  <Badge variant="outline" className="font-mono">
                    {this.state.errorId}
                  </Badge>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full">
                      <Bug className="w-4 h-4 mr-2" />
                      Show Technical Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1">Error:</p>
                        <p className="text-xs font-mono break-all">{this.state.error.message}</p>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <p className="text-xs font-semibold text-destructive mb-1">Stack Trace:</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {errorDetails.action}
                </Button>
                <Button onClick={this.handleGoHome} variant="secondary" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload App
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open('mailto:support@kin2workforce.com')}>
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}