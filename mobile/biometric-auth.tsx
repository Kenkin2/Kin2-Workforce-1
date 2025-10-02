import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useBiometricAuth, useHapticFeedback } from '@/hooks/useMobileFeatures';
import { Fingerprint, Shield, ShieldCheck, ShieldX, Eye, Lock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BiometricAuthProps {
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function BiometricAuthSetup() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  const {
    isSupported,
    isEnrolled,
    type,
    authenticate,
    enroll,
  } = useBiometricAuth();

  const { success, error } = useHapticFeedback();

  useEffect(() => {
    // Load biometric preference from storage
    const savedPreference = localStorage.getItem('biometric-auth-enabled');
    setIsEnabled(savedPreference === 'true' && isEnrolled);
  }, [isEnrolled]);

  const enableBiometricMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('POST', '/api/mobile/biometric', { enabled });
    },
    onSuccess: () => {
      success();
    },
    onError: () => {
      error();
    },
  });

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled && !isEnrolled) {
      setShowSetup(true);
      return;
    }

    setIsEnabled(enabled);
    localStorage.setItem('biometric-auth-enabled', enabled.toString());
    await enableBiometricMutation.mutateAsync(enabled);
  };

  const handleEnrollBiometric = async () => {
    const enrolled = await enroll();
    if (enrolled) {
      setIsEnabled(true);
      setShowSetup(false);
      localStorage.setItem('biometric-auth-enabled', 'true');
      await enableBiometricMutation.mutateAsync(true);
      success();
    } else {
      error();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ShieldX className="w-5 h-5 mr-2" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Biometric authentication is not supported on this device
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              {type === 'fingerprint' ? (
                <Fingerprint className="w-5 h-5 mr-2" />
              ) : (
                <Eye className="w-5 h-5 mr-2" />
              )}
              Biometric Authentication
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Use {type === 'fingerprint' ? 'fingerprint' : 'face recognition'} to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Enable Biometric Login</p>
              <p className="text-xs text-muted-foreground">
                {isEnrolled 
                  ? 'Quick and secure access to your account'
                  : 'Set up biometric authentication first'
                }
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleBiometric}
              disabled={enableBiometricMutation.isPending}
              data-testid="switch-biometric-auth"
            />
          </div>

          {!isEnrolled && (
            <Button
              onClick={() => setShowSetup(true)}
              className="w-full"
              data-testid="button-setup-biometric"
            >
              <Shield className="w-4 h-4 mr-2" />
              Set Up Biometric Authentication
            </Button>
          )}

          {isEnabled && isEnrolled && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Biometric Authentication Active
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Your account is protected with {type} authentication
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Biometric Authentication</DialogTitle>
            <DialogDescription>
              Secure your account with {type === 'fingerprint' ? 'fingerprint' : 'face'} authentication
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center space-y-4">
              {type === 'fingerprint' ? (
                <Fingerprint className="w-16 h-16 mx-auto text-primary" />
              ) : (
                <Eye className="w-16 h-16 mx-auto text-primary" />
              )}
              
              <div>
                <h3 className="text-lg font-medium">Enable {type === 'fingerprint' ? 'Fingerprint' : 'Face'} Authentication</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {type === 'fingerprint' 
                    ? 'Place your finger on the sensor when prompted'
                    : 'Look at your device camera when prompted'
                  }
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSetup(false)}
              data-testid="button-cancel-biometric"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnrollBiometric}
              data-testid="button-enroll-biometric"
            >
              <Shield className="w-4 h-4 mr-2" />
              Set Up Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BiometricLoginPrompt({ onSuccess, onFailure }: BiometricAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  
  const { isSupported, isEnrolled, type, authenticate } = useBiometricAuth();
  const { success, error } = useHapticFeedback();

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await authenticate();
      if (result) {
        success();
        onSuccess?.();
        setShowPrompt(false);
      } else {
        error();
        onFailure?.();
      }
    } catch (err) {
      error();
      onFailure?.();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    onFailure?.();
  };

  if (!isSupported || !isEnrolled || !showPrompt) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Authenticate</DialogTitle>
          <DialogDescription className="text-center">
            Use {type === 'fingerprint' ? 'fingerprint' : 'face recognition'} to unlock
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="text-center space-y-4">
            {type === 'fingerprint' ? (
              <Fingerprint className="w-20 h-20 mx-auto text-primary animate-pulse" />
            ) : (
              <Eye className="w-20 h-20 mx-auto text-primary animate-pulse" />
            )}
            
            <div>
              <p className="text-sm text-muted-foreground">
                {isAuthenticating 
                  ? 'Authenticating...'
                  : type === 'fingerprint' 
                    ? 'Touch the fingerprint sensor'
                    : 'Look at the camera'
                }
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2">
          <Button
            onClick={handleBiometricAuth}
            disabled={isAuthenticating}
            className="w-full"
            data-testid="button-biometric-authenticate"
          >
            {isAuthenticating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : type === 'fingerprint' ? (
              <Fingerprint className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {isAuthenticating ? 'Authenticating...' : 'Use Biometric'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full"
            data-testid="button-skip-biometric"
          >
            <Lock className="w-4 h-4 mr-2" />
            Use Password Instead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickBiometricAuth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const { isSupported, isEnrolled, authenticate } = useBiometricAuth();
  const { success, error } = useHapticFeedback();

  const handleQuickAuth = async () => {
    if (!isSupported || !isEnrolled) {
      onAuthenticated();
      return;
    }

    try {
      const result = await authenticate();
      if (result) {
        success();
        onAuthenticated();
      } else {
        error();
      }
    } catch (err) {
      error();
    }
  };

  if (!isSupported || !isEnrolled) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickAuth}
      data-testid="button-quick-biometric"
    >
      <Fingerprint className="w-4 h-4" />
    </Button>
  );
}