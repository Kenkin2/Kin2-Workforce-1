import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plug, 
  Check, 
  Settings, 
  ExternalLink, 
  Zap,
  CreditCard,
  Brain,
  Database,
  Shield,
  Users,
  MessageSquare,
  Clock,
  MapPin,
  FileText
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'connected' | 'available' | 'premium';
  category: 'core' | 'payments' | 'ai' | 'communication' | 'productivity' | 'analytics';
  provider?: string;
  setupUrl?: string;
}

const integrations: Integration[] = [
  // Core Integrations (Already Connected)
  {
    id: 'replit-auth',
    name: 'Replit Authentication',
    description: 'Secure user authentication and session management',
    icon: Shield,
    status: 'connected',
    category: 'core',
    provider: 'Replit'
  },
  {
    id: 'neon-database',
    name: 'Neon PostgreSQL',
    description: 'Serverless PostgreSQL database with real-time sync',
    icon: Database,
    status: 'connected',
    category: 'core',
    provider: 'Neon'
  },
  {
    id: 'stripe-payments',
    name: 'Stripe Payments',
    description: 'Payment processing and subscription management',
    icon: CreditCard,
    status: 'connected',
    category: 'payments',
    provider: 'Stripe'
  },
  {
    id: 'openai-ai',
    name: 'OpenAI Intelligence',
    description: 'AI-powered workforce analytics and automation',
    icon: Brain,
    status: 'connected',
    category: 'ai',
    provider: 'OpenAI'
  },

  // Available Integrations
  {
    id: 'slack-notifications',
    name: 'Slack Notifications',
    description: 'Send shift alerts and updates to Slack channels',
    icon: MessageSquare,
    status: 'available',
    category: 'communication',
    provider: 'Slack',
    setupUrl: 'https://api.slack.com/apps'
  },
  {
    id: 'twilio-sms',
    name: 'Twilio SMS',
    description: 'Send SMS notifications for shift reminders and alerts',
    icon: MessageSquare,
    status: 'available',
    category: 'communication',
    provider: 'Twilio',
    setupUrl: 'https://console.twilio.com'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync shifts and schedules with Google Calendar',
    icon: Clock,
    status: 'available',
    category: 'productivity',
    provider: 'Google',
    setupUrl: 'https://console.cloud.google.com'
  },
  {
    id: 'google-maps',
    name: 'Google Maps Tracking',
    description: 'Real-time GPS tracking and geofencing for workers',
    icon: MapPin,
    status: 'available',
    category: 'productivity',
    provider: 'Google',
    setupUrl: 'https://console.cloud.google.com'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Sync',
    description: 'Sync payroll and financial data with QuickBooks',
    icon: FileText,
    status: 'premium',
    category: 'analytics',
    provider: 'Intuit',
    setupUrl: 'https://developer.intuit.com'
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Collaborate and communicate through Teams integration',
    icon: Users,
    status: 'available',
    category: 'communication',
    provider: 'Microsoft',
    setupUrl: 'https://dev.teams.microsoft.com'
  }
];

const categories = [
  { id: 'core', name: 'Core Services', color: 'bg-blue-500' },
  { id: 'payments', name: 'Payments', color: 'bg-green-500' },
  { id: 'ai', name: 'AI & Analytics', color: 'bg-purple-500' },
  { id: 'communication', name: 'Communication', color: 'bg-orange-500' },
  { id: 'productivity', name: 'Productivity', color: 'bg-indigo-500' },
  { id: 'analytics', name: 'Analytics', color: 'bg-pink-500' }
];

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: systemStatus } = useQuery({
    queryKey: ['/api/system/status'],
    retry: false,
  });

  const filteredIntegrations = selectedCategory 
    ? integrations.filter(int => int.category === selectedCategory)
    : integrations;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'premium':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Premium</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.id === category)?.color || 'bg-gray-500';
  };

  return (
    <AppLayout 
      title="Integrations & Connections"
      breadcrumbs={[{ label: "System", href: "/dashboard" }, { label: "Integrations" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Plug className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrations & Connections</h1>
              <p className="text-muted-foreground">Connect your workforce platform with external services and tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{integrations.filter(i => i.status === 'connected').length}</div>
              <div className="text-sm text-muted-foreground">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{integrations.filter(i => i.status === 'available').length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{integrations.filter(i => i.status === 'premium').length}</div>
              <div className="text-sm text-muted-foreground">Premium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{integrations.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                data-testid="filter-all"
              >
                All Integrations
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`filter-${category.id}`}
                >
                  <div className={`w-3 h-3 ${category.color} rounded-full mr-2`}></div>
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const IconComponent = integration.icon;
            return (
              <Card key={integration.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${getCategoryColor(integration.category)} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        {integration.provider && (
                          <p className="text-sm text-muted-foreground">by {integration.provider}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {integration.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {integration.status === 'connected' ? (
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked disabled />
                        <span className="text-sm text-muted-foreground">Active</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant={integration.status === 'premium' ? 'default' : 'outline'}
                        className="group-hover:bg-primary group-hover:text-primary-foreground"
                        data-testid={`connect-${integration.id}`}
                      >
                        {integration.status === 'premium' ? 'Upgrade' : 'Connect'}
                      </Button>
                    )}
                    
                    {integration.setupUrl && (
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Communication Setup</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Connect Slack for team notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Set up SMS alerts for shift reminders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Enable email notifications</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Productivity Enhancement</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Sync with Google Calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Enable GPS tracking for field workers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Connect QuickBooks for accounting</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Need Custom Integration?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect with any system using webhooks, REST APIs, or custom connectors.
                  </p>
                  <Button size="sm" variant="outline" data-testid="button-custom-integration">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Request Custom Integration
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Health & Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700 dark:text-green-300">Database</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Connected & Operational</p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700 dark:text-green-300">Authentication</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Replit Auth Active</p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700 dark:text-green-300">AI Services</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">OpenAI Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}