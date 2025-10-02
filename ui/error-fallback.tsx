import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  type?: 'network' | 'auth' | 'not-found' | 'generic';
  minimal?: boolean;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  type = 'generic',
  minimal = false 
}: ErrorFallbackProps) {
  const [, setLocation] = useLocation();
  
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Lost',
          message: 'Please check your internet connection and try again.',
          actionText: 'Retry',
          color: 'text-orange-500'
        };
      case 'auth':
        return {
          icon: AlertTriangle,
          title: 'Authentication Required',
          message: 'Please log in to access this content.',
          actionText: 'Go to Login',
          color: 'text-yellow-500'
        };
      case 'not-found':
        return {
          icon: AlertTriangle,
          title: 'Page Not Found',
          message: 'The page you\'re looking for doesn\'t exist.',
          actionText: 'Go Home',
          color: 'text-blue-500'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          actionText: 'Try Again',
          color: 'text-destructive'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  const handleAction = () => {
    if (type === 'auth') {
      setLocation('/auth');
    } else if (type === 'not-found') {
      setLocation('/');
    } else if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  if (minimal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Icon className={`w-8 h-8 mx-auto ${config.color}`} />
          <p className="text-sm text-muted-foreground">{config.message}</p>
          <Button onClick={handleAction} size="sm" variant="outline">
            {config.actionText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <CardTitle className={config.color}>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {config.message}
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded-lg text-left">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAction} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              {config.actionText}
            </Button>
            {type !== 'not-found' && (
              <Button onClick={() => setLocation('/')} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error components for common scenarios
export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return <ErrorFallback type="network" resetError={resetError} />;
}

export function AuthErrorFallback() {
  return <ErrorFallback type="auth" />;
}

export function NotFoundErrorFallback() {
  return <ErrorFallback type="not-found" />;
}

export function MinimalErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return <ErrorFallback error={error} resetError={resetError} minimal />;
}