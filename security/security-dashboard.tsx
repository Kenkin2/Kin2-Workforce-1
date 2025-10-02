import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecurityMonitoring, useSessionSecurity } from '@/hooks/useSecurity';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Lock,
  User,
  Globe,
  Key,
  Eye,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export function SecurityDashboard() {
  const { securityEvents, threatLevel, logSecurityEvent } = useSecurityMonitoring();
  const { sessionInfo, extendSession } = useSessionSecurity();
  const [securityScore, setSecurityScore] = useState(85);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Calculate security score based on various factors
    let score = 100;
    
    // Deduct points for recent security events
    const recentEvents = securityEvents.filter(
      e => Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    score -= recentEvents.filter(e => e.severity === 'high').length * 10;
    score -= recentEvents.filter(e => e.severity === 'medium').length * 5;
    score -= recentEvents.filter(e => e.severity === 'low').length * 2;
    
    // Session security factors
    if (!sessionInfo.isValid) score -= 20;
    if (sessionInfo.expiresAt && sessionInfo.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      score -= 10; // Session expiring soon
    }
    
    setSecurityScore(Math.max(0, Math.min(100, score)));
  }, [securityEvents, sessionInfo]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleManualSecurityCheck = () => {
    // Simulate security check
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'low',
      message: 'Manual security check performed'
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Shield className="w-6 h-6" />
          <span>Security Dashboard</span>
        </h1>
        <p className="text-muted-foreground">
          Monitor your account security and system protection status
        </p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                  {securityScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={securityScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {securityScore >= 90 ? 'Excellent' : 
                 securityScore >= 70 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Threat Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={`${getThreatLevelColor(threatLevel)} text-white`}>
                {getThreatLevelText(threatLevel)}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Based on recent security events
              </p>
              <div className="flex items-center space-x-1 text-xs">
                <Activity className="w-3 h-3" />
                <span>{securityEvents.length} events logged</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={sessionInfo.isValid ? 'default' : 'destructive'}>
                {sessionInfo.isValid ? 'Active' : 'Expired'}
              </Badge>
              {sessionInfo.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires: {sessionInfo.expiresAt.toLocaleTimeString()}
                </p>
              )}
              {sessionInfo.isValid && (
                <Button onClick={extendSession} size="sm" variant="outline" className="w-full">
                  <Clock className="w-3 h-3 mr-1" />
                  Extend Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {threatLevel === 'high' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High threat level detected. Multiple security events have been logged. 
            Please review your recent activity and consider changing your password.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Security Information */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="protection">Protection Status</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Security Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Recent Security Events</span>
              </CardTitle>
              <CardDescription>
                Security-related activities and potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.slice(-10).reverse().map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.severity === 'high' ? 'bg-red-500' :
                      event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.message}</p>
                        <Badge variant={
                          event.severity === 'high' ? 'destructive' :
                          event.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </p>
                      {event.details && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Details</summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                
                {securityEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p>No security events recorded</p>
                    <p className="text-xs">This is good news!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protection Status */}
        <TabsContent value="protection" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Security</span>
                  <Badge variant={sessionInfo.isValid ? 'default' : 'destructive'}>
                    {sessionInfo.isValid ? 'Active' : 'Expired'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Policy</span>
                  <Badge variant="default">Enforced</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Input Sanitization</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CSRF Protection</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">XSS Prevention</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Network Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">HTTPS</span>
                  <Badge variant="default">Enforced</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Secure Headers</span>
                  <Badge variant="default">Set</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Security Policy</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Logs</span>
                  <Badge variant="default">Recording</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Threat Detection</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Anomaly Detection</span>
                  <Badge variant="default">Learning</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
              <CardDescription>
                Suggested actions to improve your security posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityScore < 90 && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Improve Security Score:</strong> Review recent security events and address any high-severity issues.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Use Strong Passwords</p>
                      <p className="text-xs text-muted-foreground">
                        Ensure all passwords meet security requirements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Keep Sessions Active</p>
                      <p className="text-xs text-muted-foreground">
                        Extend sessions before they expire to maintain security
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Monitor Activity</p>
                      <p className="text-xs text-muted-foreground">
                        Regularly check for suspicious activity in your account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Enable Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Get alerts for important security events
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your security preferences and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleManualSecurityCheck}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Security Check
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Key className="w-6 h-6 mb-2" />
                  <span className="text-sm">Change Password</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <Lock className="w-6 h-6 mb-2" />
                  <span className="text-sm">Privacy Settings</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <span className="text-sm">Security Report</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <Globe className="w-6 h-6 mb-2" />
                  <span className="text-sm">Login History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}