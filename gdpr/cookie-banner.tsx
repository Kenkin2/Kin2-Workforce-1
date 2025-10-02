import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Cookie, Settings, X } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has already given consent
  const { data: existingConsent } = useQuery({
    queryKey: ['/api/gdpr/cookie-consent'],
    retry: false,
  });

  // Show banner if no existing consent
  useEffect(() => {
    if (existingConsent === null) {
      setIsVisible(true);
    }
  }, [existingConsent]);

  // Record cookie consent
  const recordConsent = useMutation({
    mutationFn: async (consents: CookiePreferences) => {
      return apiRequest('POST', '/api/gdpr/cookie-consent', { consents });
    },
    onSuccess: () => {
      setIsVisible(false);
      toast({
        title: "Preferences Saved",
        description: "Your cookie preferences have been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr/cookie-consent'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save cookie preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    recordConsent.mutate(allAccepted);
  };

  const handleAcceptSelected = () => {
    recordConsent.mutate(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    recordConsent.mutate(onlyNecessary);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" data-testid="cookie-banner">
      <Card className="max-w-4xl mx-auto bg-background border shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Cookie className="w-6 h-6 mr-3 text-primary" />
              <h3 className="text-lg font-semibold">Cookie Preferences</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              data-testid="button-close-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-4">
            We use cookies to enhance your experience, analyze site usage, and assist in marketing efforts. 
            You can customize your preferences or accept all cookies.
          </p>

          {showDetails && (
            <div className="mb-4 space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Necessary Cookies</h4>
                  <p className="text-sm text-muted-foreground">Essential for website functionality</p>
                </div>
                <Switch
                  checked={preferences.necessary}
                  disabled={true}
                  data-testid="switch-necessary"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">Help us improve our website</p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  data-testid="switch-analytics"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className="text-sm text-muted-foreground">Show relevant advertisements</p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  data-testid="switch-marketing"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Functional Cookies</h4>
                  <p className="text-sm text-muted-foreground">Enable enhanced features</p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => handlePreferenceChange('functional', checked)}
                  data-testid="switch-functional"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAcceptAll}
              disabled={recordConsent.isPending}
              data-testid="button-accept-all"
            >
              Accept All
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRejectAll}
              disabled={recordConsent.isPending}
              data-testid="button-reject-all"
            >
              Reject All
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              data-testid="button-customize"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide Details' : 'Customize'}
            </Button>

            {showDetails && (
              <Button
                onClick={handleAcceptSelected}
                disabled={recordConsent.isPending}
                data-testid="button-save-preferences"
              >
                Save Preferences
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            You can change your preferences at any time in your 
            <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Settings</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}