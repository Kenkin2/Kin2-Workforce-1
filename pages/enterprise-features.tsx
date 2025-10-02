import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Shield, 
  Database, 
  Zap, 
  Brain, 
  Building, 
  Smartphone, 
  Network, 
  BarChart3,
  Lock,
  Globe,
  Archive,
  AlertTriangle
} from 'lucide-react';

export default function EnterpriseFeatures() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('ai-analytics');

  // AI Analytics Data
  const { data: aiInsights, isLoading: insightsLoading } = useQuery<any[]>({
    queryKey: ['/api/ai/insights'],
  });

  const { data: aiMetrics, isLoading: metricsLoading } = useQuery<{
    efficiency: number;
    satisfaction: number;
    productivity: number;
  }>({
    queryKey: ['/api/ai/metrics'],
  });

  // Business Intelligence Data
  const { data: forecast } = useQuery<any[]>({
    queryKey: ['/api/bi/forecast/revenue'],
  });

  // Marketplace Apps
  const { data: marketplaceApps } = useQuery<any[]>({
    queryKey: ['/api/marketplace/apps'],
  });

  // Backup Analytics
  const { data: backupAnalytics } = useQuery<{
    totalBackups: number;
    lastBackup: string;
    successRate: number;
    storageUsed: number;
  }>({
    queryKey: ['/api/enterprise/backup/analytics'],
  });

  // Mutations
  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/enterprise/backup'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/backup/analytics'] });
    },
  });

  const installAppMutation = useMutation({
    mutationFn: (appId: string) => apiRequest('POST', `/api/marketplace/install/${appId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/apps'] });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Features</h1>
          <p className="text-gray-600 mt-1">Advanced capabilities for enterprise organizations</p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Enterprise Plan
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-analytics" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analytics
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* AI Analytics Tab */}
        <TabsContent value="ai-analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Predictive Insights
                </CardTitle>
                <CardDescription>AI-powered workforce analytics</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiInsights?.slice(0, 3).map((insight: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        <p className="text-xs text-blue-600">{insight.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workforce Metrics</CardTitle>
                <CardDescription>Real-time performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="h-2 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Efficiency</span>
                        <span className="text-sm font-medium">{aiMetrics?.efficiency?.toFixed(1)}%</span>
                      </div>
                      <Progress value={aiMetrics?.efficiency || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Satisfaction</span>
                        <span className="text-sm font-medium">{aiMetrics?.satisfaction?.toFixed(1)}%</span>
                      </div>
                      <Progress value={aiMetrics?.satisfaction || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Productivity</span>
                        <span className="text-sm font-medium">{aiMetrics?.productivity?.toFixed(1)}%</span>
                      </div>
                      <Progress value={aiMetrics?.productivity || 0} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>AI-powered financial predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-6 gap-4">
                {forecast?.map((period: any, index: number) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ${period.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{period.period}</div>
                    <div className="text-xs text-gray-400">
                      {(period.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                App Marketplace
              </CardTitle>
              <CardDescription>Extend your platform with third-party applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceApps?.slice(0, 6).map((app: any) => (
                  <div key={app.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-500">{app.developer}</p>
                      </div>
                      <Badge>{app.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{app.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⭐ {app.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({app.installs} installs)</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => installAppMutation.mutate(app.id)}
                        disabled={installAppMutation.isPending}
                        data-testid={`button-install-app-${app.id}`}
                      >
                        Install
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Features Tab */}
        <TabsContent value="mobile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Mobile App Features
                </CardTitle>
                <CardDescription>Native mobile experience for workers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { feature: 'Offline Mode', status: 'Active', icon: '📱' },
                    { feature: 'Push Notifications', status: 'Enabled', icon: '🔔' },
                    { feature: 'Biometric Login', status: 'Available', icon: '🔐' },
                    { feature: 'GPS Tracking', status: 'Enabled', icon: '📍' },
                    { feature: 'Voice Commands', status: 'Beta', icon: '🎤' },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2">
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="text-sm">{item.feature}</span>
                      </div>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobile Analytics</CardTitle>
                <CardDescription>Usage statistics and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">847</div>
                      <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">98.5%</div>
                      <div className="text-sm text-gray-500">Uptime</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">App Store Rating</span>
                      <span className="text-sm font-medium">4.8/5.0</span>
                    </div>
                    <Progress value={96} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Enterprise SSO
                </CardTitle>
                <CardDescription>Single Sign-On configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { provider: 'Azure AD', status: 'Connected', users: 234 },
                    { provider: 'Okta', status: 'Configured', users: 89 },
                    { provider: 'SAML', status: 'Available', users: 0 },
                  ].map((sso, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <span className="font-medium">{sso.provider}</span>
                        <p className="text-sm text-gray-500">{sso.users} users</p>
                      </div>
                      <Badge variant={sso.status === 'Connected' ? 'default' : 'secondary'}>
                        {sso.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Status
                </CardTitle>
                <CardDescription>Real-time security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Security Score</span>
                    <span className="text-lg font-bold text-green-600">94/100</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SSL/TLS Encryption</span>
                      <span className="text-green-600">✓ Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Two-Factor Auth</span>
                      <span className="text-green-600">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GDPR Compliance</span>
                      <span className="text-green-600">✓ Compliant</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Audit Logging</span>
                      <span className="text-yellow-600">⚠ Partial</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup & Recovery Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backup Management
                </CardTitle>
                <CardDescription>Automated backup and disaster recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupAnalytics && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{backupAnalytics.totalBackups}</div>
                          <div className="text-sm text-gray-500">Total Backups</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {backupAnalytics.successRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Last Backup</span>
                          <span>{new Date(backupAnalytics.lastBackup).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage Used</span>
                          <span>{(backupAnalytics.storageUsed / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </>
                  )}
                  <Button
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                    className="w-full"
                    data-testid="button-create-backup"
                  >
                    {createBackupMutation.isPending ? 'Creating...' : 'Create Backup Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Disaster Recovery
                </CardTitle>
                <CardDescription>Emergency response and recovery procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Recovery Time Objective</span>
                    <Badge>15 minutes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Recovery Point Objective</span>
                    <Badge>5 minutes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last DR Test</span>
                    <Badge variant="secondary">Passed (90 days ago)</Badge>
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-test-dr">
                    Test Recovery Procedures
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Multi-Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Complete organization isolation with custom branding and domain support.
            </p>
            <Badge variant="secondary">Enterprise Ready</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Global Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Worldwide deployment with edge caching and regional data compliance.
            </p>
            <Badge variant="secondary">Production Ready</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Optimized for speed with advanced caching and real-time updates.
            </p>
            <Badge variant="secondary">99.9% Uptime</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}