import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  Edit,
  Cookie,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface DataRequest {
  id: string;
  requestType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  responseData?: any;
}

interface PrivacyData {
  cookie_preferences: CookiePreferences;
  data_requests: DataRequest[];
  consents: any[];
  last_updated: string;
}

export default function Privacy() {
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's privacy data
  const { data: privacyData, isLoading } = useQuery<PrivacyData>({
    queryKey: ['/api/gdpr/privacy-data'],
    retry: false,
  });

  // Update cookie preferences when data loads
  useEffect(() => {
    if (privacyData?.cookie_preferences) {
      setCookiePrefs(privacyData.cookie_preferences);
    }
  }, [privacyData]);

  // Update cookie consent
  const updateCookieConsent = useMutation({
    mutationFn: async (consents: CookiePreferences) => {
      return apiRequest('POST', '/api/gdpr/cookie-consent', { consents });
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your cookie preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr/privacy-data'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update cookie preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit data request
  const submitDataRequest = useMutation({
    mutationFn: async (requestType: string) => {
      return apiRequest('POST', '/api/gdpr/data-request', { requestType });
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your data request has been submitted and will be processed within 30 days.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gdpr/privacy-data'] });
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: "Failed to submit data request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCookieChange = (type: keyof CookiePreferences, value: boolean) => {
    const newPrefs = { ...cookiePrefs, [type]: value };
    setCookiePrefs(newPrefs);
    updateCookieConsent.mutate(newPrefs);
  };

  const handleDataRequest = (requestType: string) => {
    submitDataRequest.mutate(requestType);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'access': return 'Data Access Request';
      case 'portability': return 'Data Export Request';
      case 'erasure': return 'Data Deletion Request';
      case 'rectification': return 'Data Correction Request';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="privacy-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Shield className="w-8 h-8 mr-3 text-primary" />
          Privacy & Data Protection
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your data privacy preferences and exercise your GDPR rights
        </p>
      </div>

      {/* Cookie Preferences */}
      <Card className="mb-6" data-testid="cookie-preferences-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cookie className="w-5 h-5 mr-2" />
            Cookie Preferences
          </CardTitle>
          <CardDescription>
            Control how we use cookies and tracking technologies on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Necessary Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Essential for the website to function properly
              </p>
            </div>
            <Switch
              checked={cookiePrefs.necessary}
              disabled={true}
              data-testid="switch-necessary-cookies"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Analytics Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Help us understand how you use our website
              </p>
            </div>
            <Switch
              checked={cookiePrefs.analytics}
              onCheckedChange={(checked) => handleCookieChange('analytics', checked)}
              data-testid="switch-analytics-cookies"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Marketing Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Used to show you relevant advertisements
              </p>
            </div>
            <Switch
              checked={cookiePrefs.marketing}
              onCheckedChange={(checked) => handleCookieChange('marketing', checked)}
              data-testid="switch-marketing-cookies"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Functional Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Enable enhanced functionality and personalization
              </p>
            </div>
            <Switch
              checked={cookiePrefs.functional}
              onCheckedChange={(checked) => handleCookieChange('functional', checked)}
              data-testid="switch-functional-cookies"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card className="mb-6" data-testid="data-rights-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Your Data Rights
          </CardTitle>
          <CardDescription>
            Exercise your rights under GDPR and other data protection laws
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => handleDataRequest('access')}
              disabled={submitDataRequest.isPending}
              data-testid="button-access-data"
            >
              <div className="flex items-center mb-2">
                <Eye className="w-4 h-4 mr-2" />
                <span className="font-medium">Access My Data</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Get a copy of all data we have about you
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/api/gdpr/export-data', '_blank')}
              data-testid="button-export-data"
            >
              <div className="flex items-center mb-2">
                <Download className="w-4 h-4 mr-2" />
                <span className="font-medium">Export My Data</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Download your data in a portable format
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => handleDataRequest('rectification')}
              disabled={submitDataRequest.isPending}
              data-testid="button-correct-data"
            >
              <div className="flex items-center mb-2">
                <Edit className="w-4 h-4 mr-2" />
                <span className="font-medium">Correct My Data</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Request corrections to inaccurate data
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left border-red-200 hover:bg-red-50"
              onClick={() => {
                if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                  handleDataRequest('erasure');
                }
              }}
              disabled={submitDataRequest.isPending}
              data-testid="button-delete-data"
            >
              <div className="flex items-center mb-2">
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                <span className="font-medium text-red-600">Delete My Data</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Permanently delete all your personal data
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request History */}
      {privacyData?.data_requests && privacyData.data_requests.length > 0 && (
        <Card data-testid="request-history-card">
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>
              Track the status of your privacy requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {privacyData.data_requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium" data-testid={`request-type-${request.id}`}>
                      {formatRequestType(request.requestType)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      {request.completedAt && (
                        <span> • Completed: {new Date(request.completedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <div data-testid={`request-status-${request.id}`}>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Alert className="mt-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your privacy matters to us.</strong> We process your data according to GDPR and other 
          applicable data protection laws. Data requests are typically processed within 30 days. 
          For questions about our privacy practices, please contact our Data Protection Officer.
        </AlertDescription>
      </Alert>
    </div>
  );
}