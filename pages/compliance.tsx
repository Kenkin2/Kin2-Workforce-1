import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Download, FileDown, Trash2, ListChecks, Search, UserCheck, Eye, Settings, Archive, Calendar } from "lucide-react";

export default function Compliance() {
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

  return (
    <AppLayout 
      title="Compliance"
      breadcrumbs={[{ label: "Compliance" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Compliance & GDPR</h2>
            <p className="text-muted-foreground">Data protection and regulatory compliance tools</p>
          </div>
        </div>

        {/* Compliance Status */}
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Your platform is GDPR compliant. Last audit completed on August 15, 2025.
          </AlertDescription>
        </Alert>

        {/* GDPR Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-data-requests">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-3 h-5 w-5 text-primary" />
                Data Subject Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Handle data export and deletion requests from users
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-data-export-request">
                  <FileDown className="mr-2 h-4 w-4" />
                  Process Data Export
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-data-deletion-request">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Process Data Deletion
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-audit-trail">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListChecks className="mr-3 h-5 w-5 text-secondary" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                View and export system audit logs
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-audit-log">
                  <Search className="mr-2 h-4 w-4" />
                  View Audit Log
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-export-audit">
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-consent-management">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-3 h-5 w-5 text-accent" />
                Consent Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Manage user consent and privacy preferences
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-consent-overview">
                  <Eye className="mr-2 h-4 w-4" />
                  Consent Overview
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-privacy-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-data-retention">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Archive className="mr-3 h-5 w-5 text-primary" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Configure data retention policies and schedules
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-retention-policies">
                  <Calendar className="mr-2 h-4 w-4" />
                  Retention Policies
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-auto-cleanup">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Auto Cleanup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Compliance Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Compliance Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Download className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Data Export Request</p>
                    <p className="text-sm text-muted-foreground">User requested data export - Completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge>Completed</Badge>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Security Audit</p>
                    <p className="text-sm text-muted-foreground">Monthly security review completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">Passed</Badge>
                  <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Data Deletion</p>
                    <p className="text-sm text-muted-foreground">Automated data cleanup executed</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge>Completed</Badge>
                  <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
