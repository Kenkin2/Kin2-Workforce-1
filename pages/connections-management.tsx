import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Github, 
  Slack, 
  Globe, 
  Database, 
  Cloud, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  X, 
  RefreshCw,
  ExternalLink,
  Key,
  Shield,
  Activity,
  Bell,
  Zap,
  Clock,
  Users,
  BookOpen,
  Calendar,
  Mail,
  FileText,
  Smartphone,
  Building2
} from "lucide-react";
import { SiGithub, SiSlack, SiNotion, SiSpotify, SiDropbox, SiLinear, SiGoogle } from "react-icons/si";

interface Connection {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  icon: any;
  brandIcon: any;
  lastSync?: string;
  syncFrequency?: string;
  permissions?: string[];
  usage?: {
    apiCalls: number;
    dataTransferred: number;
    lastActivity: string;
  };
  webhookUrl?: string;
  config?: Record<string, any>;
}

interface ConnectionCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  connections: Connection[];
}

const availableConnections: ConnectionCategory[] = [
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Connect your essential productivity tools',
    icon: Activity,
    connections: [
      {
        id: 'github',
        name: 'GitHub',
        type: 'github',
        status: 'connected',
        description: 'Sync repositories, issues, and pull requests for project management',
        icon: Github,
        brandIcon: SiGithub,
        lastSync: '2 minutes ago',
        syncFrequency: 'Real-time',
        permissions: ['repo', 'issues', 'pull_requests'],
        usage: {
          apiCalls: 1250,
          dataTransferred: 45.2,
          lastActivity: '1 hour ago'
        },
        webhookUrl: 'https://api.kin2workforce.com/webhooks/github'
      },
      {
        id: 'notion',
        name: 'Notion',
        type: 'notion',
        status: 'connected',
        description: 'Import documents, databases, and knowledge bases',
        icon: BookOpen,
        brandIcon: SiNotion,
        lastSync: '5 minutes ago',
        syncFrequency: 'Every 15 minutes',
        permissions: ['read_content', 'read_databases'],
        usage: {
          apiCalls: 890,
          dataTransferred: 12.8,
          lastActivity: '30 minutes ago'
        }
      },
      {
        id: 'slack',
        name: 'Slack',
        type: 'slack',
        status: 'disconnected',
        description: 'Team communications and workforce notifications',
        icon: Slack,
        brandIcon: SiSlack,
        permissions: ['channels:read', 'chat:write', 'users:read']
      },
      {
        id: 'linear',
        name: 'Linear',
        type: 'linear',
        status: 'error',
        description: 'Project management and issue tracking integration',
        icon: Zap,
        brandIcon: SiLinear,
        lastSync: '2 hours ago',
        syncFrequency: 'Every 30 minutes',
        permissions: ['issues:read', 'projects:read']
      }
    ]
  },
  {
    id: 'storage',
    name: 'Cloud Storage',
    description: 'Connect your cloud storage providers',
    icon: Cloud,
    connections: [
      {
        id: 'dropbox',
        name: 'Dropbox',
        type: 'dropbox',
        status: 'connected',
        description: 'File storage and document management',
        icon: Cloud,
        brandIcon: SiDropbox,
        lastSync: '1 hour ago',
        syncFrequency: 'Every hour',
        permissions: ['files.content.read', 'files.content.write'],
        usage: {
          apiCalls: 345,
          dataTransferred: 234.5,
          lastActivity: '2 hours ago'
        }
      },
      {
        id: 'onedrive',
        name: 'OneDrive',
        type: 'onedrive',
        status: 'disconnected',
        description: 'Microsoft cloud storage integration',
        icon: Cloud,
        brandIcon: Building2,
        permissions: ['Files.Read', 'Files.ReadWrite']
      },
      {
        id: 'sharepoint',
        name: 'SharePoint',
        type: 'sharepoint',
        status: 'disconnected',
        description: 'Enterprise document management and collaboration',
        icon: FileText,
        brandIcon: Building2,
        permissions: ['Sites.Read.All', 'Files.ReadWrite.All']
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Email and calendar integrations',
    icon: Mail,
    connections: [
      {
        id: 'outlook',
        name: 'Outlook',
        type: 'outlook',
        status: 'connected',
        description: 'Email and calendar synchronization',
        icon: Mail,
        brandIcon: Building2,
        lastSync: '10 minutes ago',
        syncFrequency: 'Every 5 minutes',
        permissions: ['Mail.Read', 'Calendars.Read'],
        usage: {
          apiCalls: 567,
          dataTransferred: 8.9,
          lastActivity: '15 minutes ago'
        }
      },
      {
        id: 'google_workspace',
        name: 'Google Workspace',
        type: 'google',
        status: 'pending',
        description: 'Gmail, Calendar, and Drive integration',
        icon: Calendar,
        brandIcon: SiGoogle,
        permissions: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar']
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'Lifestyle',
    description: 'Entertainment and lifestyle integrations',
    icon: Smartphone,
    connections: [
      {
        id: 'spotify',
        name: 'Spotify',
        type: 'spotify',
        status: 'connected',
        description: 'Music streaming for workplace wellness',
        icon: Smartphone,
        brandIcon: SiSpotify,
        lastSync: '30 minutes ago',
        syncFrequency: 'Manual',
        permissions: ['user-read-playback-state', 'user-modify-playback-state'],
        usage: {
          apiCalls: 123,
          dataTransferred: 2.1,
          lastActivity: '45 minutes ago'
        }
      }
    ]
  }
];

export default function ConnectionsManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('productivity');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connections data
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
    initialData: availableConnections
  });

  // Connect service mutation
  const connectServiceMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest("POST", `/api/connections/${connectionId}/connect`);
      return response.json();
    },
    onSuccess: (data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      const connection = connections.flatMap(cat => cat.connections).find(conn => conn.id === connectionId);
      toast({
        title: "Connection Successful",
        description: `${connection?.name} has been connected successfully.`,
      });
    },
    onError: (error, connectionId) => {
      const connection = connections.flatMap(cat => cat.connections).find(conn => conn.id === connectionId);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${connection?.name}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Disconnect service mutation
  const disconnectServiceMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest("POST", `/api/connections/${connectionId}/disconnect`);
      return response.json();
    },
    onSuccess: (data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      const connection = connections.flatMap(cat => cat.connections).find(conn => conn.id === connectionId);
      toast({
        title: "Disconnected",
        description: `${connection?.name} has been disconnected.`,
      });
    },
    onError: () => {
      toast({
        title: "Disconnection Failed",
        description: "Could not disconnect service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync connection mutation
  const syncConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest("POST", `/api/connections/${connectionId}/sync`);
      return response.json();
    },
    onSuccess: (data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      const connection = connections.flatMap(cat => cat.connections).find(conn => conn.id === connectionId);
      toast({
        title: "Sync Started",
        description: `Syncing ${connection?.name} data...`,
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <X className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      connected: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      disconnected: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      error: { variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      pending: { variant: 'outline', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    };
    
    return (
      <Badge {...variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const filteredConnections = connections.map(category => ({
    ...category,
    connections: category.connections.filter(conn => 
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.connections.length > 0);

  return (
    <div className="space-y-6" data-testid="connections-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Connections Management</h2>
          <p className="text-muted-foreground">Connect and manage external services and integrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-sync-all">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
          <Button data-testid="button-add-connection">
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-connections"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="stat-total-connections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {connections.flatMap(cat => cat.connections).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available integrations
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-connections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {connections.flatMap(cat => cat.connections).filter(conn => conn.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently connected
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-pending-connections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {connections.flatMap(cat => cat.connections).filter(conn => conn.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting setup
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-error-connections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {connections.flatMap(cat => cat.connections).filter(conn => conn.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-connections">All Connections</TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {connections.map((category) => {
              const activeCount = category.connections.filter(conn => conn.status === 'connected').length;
              const totalCount = category.connections.length;
              
              return (
                <Card key={category.id} data-testid={`category-${category.id}`} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <category.icon className="w-4 h-4" />
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Connected</span>
                        <span className="font-medium">{activeCount}/{totalCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card data-testid="recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <SiGithub className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">GitHub sync completed</p>
                    <p className="text-sm text-muted-foreground">Synced 23 repositories and 45 issues</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <SiNotion className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">Notion database updated</p>
                    <p className="text-sm text-muted-foreground">12 new pages imported from workspace</p>
                  </div>
                  <span className="text-sm text-muted-foreground">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <SiLinear className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">Linear connection error</p>
                    <p className="text-sm text-muted-foreground">API key expired, reconnection required</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          {filteredConnections.map((category) => (
            <Card key={category.id} data-testid={`connections-category-${category.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="w-5 h-5" />
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {category.connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <connection.brandIcon className="w-6 h-6" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{connection.name}</h4>
                            {getStatusBadge(connection.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{connection.description}</p>
                          {connection.lastSync && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last sync: {connection.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.status === 'connected' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => syncConnectionMutation.mutate(connection.id)}
                              data-testid={`button-sync-${connection.id}`}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-settings-${connection.id}`}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => disconnectServiceMutation.mutate(connection.id)}
                              data-testid={`button-disconnect-${connection.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {connection.status !== 'connected' && (
                          <Button 
                            onClick={() => connectServiceMutation.mutate(connection.id)}
                            data-testid={`button-connect-${connection.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6">
            {connections.flatMap(cat => cat.connections)
              .filter(conn => conn.status === 'connected' && conn.usage)
              .map((connection) => (
                <Card key={connection.id} data-testid={`usage-${connection.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <connection.brandIcon className="w-5 h-5" />
                      {connection.name} Usage
                    </CardTitle>
                    <CardDescription>API usage and data transfer statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">API Calls</Label>
                        <div className="text-2xl font-bold">{connection.usage?.apiCalls.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Data Transferred</Label>
                        <div className="text-2xl font-bold">{connection.usage?.dataTransferred} MB</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Last Activity</Label>
                        <div className="text-2xl font-bold">{connection.usage?.lastActivity}</div>
                        <p className="text-xs text-muted-foreground">Recent sync</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card data-testid="security-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Overview
              </CardTitle>
              <CardDescription>Monitor connection security and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">OAuth 2.0 Authentication</p>
                      <p className="text-sm text-muted-foreground">All connections use secure OAuth</p>
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Token Encryption</p>
                      <p className="text-sm text-muted-foreground">All tokens are encrypted at rest</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Token Refresh</p>
                      <p className="text-sm text-muted-foreground">Automatic token renewal</p>
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Permissions */}
          <Card data-testid="connection-permissions">
            <CardHeader>
              <CardTitle>Connection Permissions</CardTitle>
              <CardDescription>Review permissions granted to each service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.flatMap(cat => cat.connections)
                  .filter(conn => conn.status === 'connected' && conn.permissions)
                  .map((connection) => (
                    <div key={connection.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <connection.brandIcon className="w-5 h-5" />
                        <h4 className="font-medium">{connection.name}</h4>
                        {getStatusBadge(connection.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {connection.permissions?.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}