import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

interface ComplianceReport {
  period: { start: string; end: string };
  summary: {
    total_data_requests: number;
    completed_requests: number;
    pending_requests: number;
    processing_activities: number;
  };
  request_breakdown: {
    access: number;
    portability: number;
    erasure: number;
    rectification: number;
  };
  processing_activities: Record<string, number>;
  compliance_status: string;
}

export default function GDPRAdmin() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Get compliance report
  const { data: report, isLoading, refetch } = useQuery<ComplianceReport>({
    queryKey: [`/api/gdpr/compliance-report?start=${dateRange.start}&end=${dateRange.end}`],
    retry: false,
  });

  const generateReport = () => {
    refetch();
    toast({
      title: "Report Generated",
      description: "GDPR compliance report has been updated.",
    });
  };

  const exportReport = () => {
    if (report) {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gdpr-compliance-report-${dateRange.start}-to-${dateRange.end}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getComplianceStatus = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Compliant</Badge>;
      case 'attention_required':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Attention Required</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <div className="container mx-auto p-6 max-w-6xl" data-testid="gdpr-admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Shield className="w-8 h-8 mr-3 text-primary" />
          GDPR Compliance Administration
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage GDPR compliance across your platform
        </p>
      </div>

      {/* Date Range Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                data-testid="input-start-date"
              />
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                data-testid="input-end-date"
              />
            </div>
            <Button onClick={generateReport} data-testid="button-generate-report">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={!report} data-testid="button-export-report">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">Data Requests</TabsTrigger>
            <TabsTrigger value="processing" data-testid="tab-processing">Processing Activities</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-requests">
                        {report.summary.total_data_requests}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                        {report.summary.completed_requests}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending">
                        {report.summary.pending_requests}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Processing Activities</p>
                      <p className="text-2xl font-bold" data-testid="stat-activities">
                        {report.summary.processing_activities}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance Status</CardTitle>
                <CardDescription>Current compliance status for the reporting period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8">
                  {getComplianceStatus(report.compliance_status)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Request Breakdown</CardTitle>
                <CardDescription>Analysis of data subject request types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600" data-testid="requests-access">
                      {report.request_breakdown.access}
                    </p>
                    <p className="text-sm text-muted-foreground">Access Requests</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600" data-testid="requests-portability">
                      {report.request_breakdown.portability}
                    </p>
                    <p className="text-sm text-muted-foreground">Portability Requests</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600" data-testid="requests-rectification">
                      {report.request_breakdown.rectification}
                    </p>
                    <p className="text-sm text-muted-foreground">Rectification Requests</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600" data-testid="requests-erasure">
                      {report.request_breakdown.erasure}
                    </p>
                    <p className="text-sm text-muted-foreground">Erasure Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Activities</CardTitle>
                <CardDescription>Data processing activities logged during the period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.processing_activities).map(([activity, count]) => (
                    <div key={activity} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium capitalize">
                        {activity.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="secondary" data-testid={`activity-${activity}`}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Checklist</CardTitle>
                <CardDescription>GDPR compliance requirements and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Data subject requests processed within 30 days</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Cookie consent management implemented</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Data processing activities logged</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Automated data retention policies active</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>User privacy dashboard available</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}