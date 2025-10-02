import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock, MessageSquare, Bell, Mail, MapPin, AlertCircle } from "lucide-react";

const INTEGRATION_SERVICES = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync schedules with Google Calendar for seamless time management',
    icon: CalendarDays,
    category: 'Calendar',
    features: ['Two-way sync', 'Event reminders', 'Recurring events']
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    description: 'Microsoft Outlook calendar integration for enterprise environments',
    icon: CalendarDays,
    category: 'Calendar',
    features: ['Exchange sync', 'Meeting requests', 'Availability tracking']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Create and manage Zoom meetings directly from schedule events',
    icon: Clock,
    category: 'Communication',
    features: ['Auto meeting links', 'Recording integration', 'Participant tracking']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for seamless communication and meetings',
    icon: MessageSquare,
    category: 'Communication',
    features: ['Team channels', 'Meeting scheduling', 'Chat integration']
  },
  {
    id: 'sms-notifications',
    name: 'SMS Notifications',
    description: 'Send SMS reminders and updates for schedule changes',
    icon: Bell,
    category: 'Notifications',
    features: ['Shift reminders', 'Schedule changes', 'Emergency alerts']
  },
  {
    id: 'email-notifications',
    name: 'Email Notifications',
    description: 'Automated email notifications for scheduling events',
    icon: Mail,
    category: 'Notifications',
    features: ['Daily digests', 'Schedule confirmations', 'Reminder emails']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect with Slack for team communication and updates',
    icon: MessageSquare,
    category: 'Communication',
    features: ['Channel notifications', 'Direct messages', 'Schedule bot']
  }
];

export default function CalendarIntegrations() {
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integration status
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations/scheduling'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/scheduling');
      return response.json();
    }
  });

  // Toggle integration
  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ serviceId, enabled }: { serviceId: string, enabled: boolean }) => {
      const response = await apiRequest('POST', `/api/integrations/${serviceId}/toggle`, { enabled });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({ 
        title: `${variables.enabled ? 'Enabled' : 'Disabled'} integration`,
        description: `${INTEGRATION_SERVICES.find(s => s.id === variables.serviceId)?.name} integration updated`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/scheduling'] });
    },
    onError: (error: any) => {
      toast({ title: 'Integration update failed', description: error.message, variant: 'destructive' });
    }
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await apiRequest('POST', `/api/integrations/${serviceId}/test`);
      return response.json();
    },
    onSuccess: (data, serviceId) => {
      toast({ 
        title: 'Connection successful',
        description: `${INTEGRATION_SERVICES.find(s => s.id === serviceId)?.name} is working correctly`
      });
    },
    onError: (error: any, serviceId) => {
      toast({ 
        title: 'Connection failed', 
        description: `Unable to connect to ${INTEGRATION_SERVICES.find(s => s.id === serviceId)?.name}`,
        variant: 'destructive' 
      });
    }
  });

  const getIntegrationStatus = (serviceId: string) => {
    return integrations.find((i: any) => i.serviceId === serviceId) || { 
      serviceId, 
      enabled: false, 
      configured: false,
      lastSync: null,
      status: 'disconnected'
    };
  };

  const handleTestConnection = (serviceId: string) => {
    setTestingConnection(serviceId);
    testConnectionMutation.mutate(serviceId);
    setTimeout(() => setTestingConnection(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Calendar & Communication Integrations</h3>
          <p className="text-muted-foreground">Connect with external services to automate scheduling workflows</p>
        </div>
        <Button variant="outline" data-testid="button-sync-all-integrations">
          Sync All
        </Button>
      </div>

      <div className="grid gap-6">
        {INTEGRATION_SERVICES.map((service) => {
          const Icon = service.icon;
          const status = getIntegrationStatus(service.id);
          
          return (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="font-semibold">{service.name}</h4>
                        <Badge variant={status.enabled ? 'default' : 'secondary'}>
                          {status.enabled ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge variant="outline">{service.category}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {service.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(service.id)}
                      disabled={!status.configured || testingConnection === service.id}
                      data-testid={`button-test-${service.id}`}
                    >
                      {testingConnection === service.id ? 'Testing...' : 'Test'}
                    </Button>
                    
                    <Switch
                      checked={status.enabled}
                      onCheckedChange={(enabled) => toggleIntegrationMutation.mutate({ serviceId: service.id, enabled })}
                      disabled={!status.configured}
                      data-testid={`switch-${service.id}`}
                    />
                  </div>
                </div>
                
                {status.enabled && status.status === 'error' && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-center text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Connection error: Unable to sync with {service.name}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}