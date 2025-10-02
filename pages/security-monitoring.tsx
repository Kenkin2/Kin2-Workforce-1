import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Bug, XCircle, Star, Settings, Search, ListChecks } from "lucide-react";

export default function SecurityMonitoring() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const securityAlerts = [
    { id: "1", type: "high", title: "Suspicious Login Attempt", description: "Multiple failed login attempts from unknown IP", time: "5 mins ago" },
    { id: "2", type: "medium", title: "Password Policy Violation", description: "User using weak password detected", time: "1 hour ago" },
    { id: "3", type: "low", title: "Session Timeout", description: "User session expired due to inactivity", time: "2 hours ago" },
  ];

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  return (
    <AppLayout title="Security Monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Cyber Security Monitoring</h2>
            <p className="text-muted-foreground">Advanced threat detection and security analytics</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-security-scan" onClick={() => toast({ title: "Security Scan", description: "Full system security scan initiated!" })}>
              <Shield className="mr-2 h-4 w-4" />
              Run Scan
            </Button>
            <Button data-testid="button-incident-report" onClick={() => toast({ title: "Incident Report", description: "Security incident reporting coming soon!" })}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </div>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">LOW</div>
              <p className="text-xs text-muted-foreground">System secure</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">Blocked today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">3</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">98/100</div>
              <p className="text-xs text-muted-foreground">Excellent</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Monitoring Interface */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts" data-testid="tab-security-alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="firewall" data-testid="tab-firewall">Firewall</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-security-compliance">Compliance</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-security-logs">Security Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <Alert key={alert.id} variant={getAlertVariant(alert.type) as any} data-testid={`alert-${alert.id}`}>
                      <Shield className="h-4 w-4" />
                      <AlertTitle data-testid={`alert-title-${alert.id}`}>{alert.title}</AlertTitle>
                      <AlertDescription data-testid={`alert-description-${alert.id}`}>
                        {alert.description} • {alert.time}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="firewall">
            <Card>
              <CardHeader>
                <CardTitle>Firewall Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Firewall Active</h3>
                  <p className="text-muted-foreground mb-4">All systems protected</p>
                  <Button onClick={() => toast({ title: "Firewall", description: "Firewall configuration panel coming soon!" })}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Security Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">ISO 27001 Compliance</p>
                      <p className="text-sm text-muted-foreground">Information security management</p>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">SOC 2 Type II</p>
                      <p className="text-sm text-muted-foreground">Security and availability controls</p>
                    </div>
                    <Badge variant="default">Certified</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">GDPR Compliance</p>
                      <p className="text-sm text-muted-foreground">Data protection regulation</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Security Event Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ListChecks className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Security Logs</h3>
                  <p className="text-muted-foreground mb-4">Detailed security event logging</p>
                  <Button onClick={() => toast({ title: "Security Logs", description: "Advanced logging dashboard coming soon!" })}>
                    <Search className="mr-2 h-4 w-4" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}