import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Shield, Clock, AlertTriangle, CheckCircle, Users, 
  FileText, Calendar, TrendingUp, Target, Settings 
} from 'lucide-react';

export default function ComplianceTracking() {
  const { toast } = useToast();

  // Fetch compliance data
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['/api/compliance/overview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/compliance/overview');
      return response.json();
    }
  });

  // Run compliance check
  const runComplianceCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/compliance/check');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Compliance check completed', 
        description: `Found ${data.violations} violations and ${data.warnings} warnings` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Compliance check failed', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const mockCompliance = {
    overallScore: 94,
    criticalViolations: 0,
    warnings: 3,
    laborLawCompliance: 98,
    overtimeCompliance: 92,
    breakCompliance: 96,
    maxHoursCompliance: 100,
    violations: [
      {
        id: '1',
        severity: 'warning',
        title: 'Overtime Threshold Approaching',
        description: 'Worker John Doe has 38 hours scheduled this week',
        recommendation: 'Consider redistributing shifts to avoid overtime',
        dueDate: '2025-09-02'
      },
      {
        id: '2',
        severity: 'warning',
        title: 'Break Schedule Gap',
        description: 'Shift on Sept 1st lacks mandatory break scheduling',
        recommendation: 'Add 30-minute break to 8-hour shift',
        dueDate: '2025-09-01'
      }
    ],
    weeklyReport: {
      totalHours: 1240,
      overtimeHours: 45,
      complianceRate: 94,
      breakViolations: 2
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance & Labor Law Tracking</h3>
          <p className="text-muted-foreground">Monitor compliance with labor regulations and company policies</p>
        </div>
        <Button 
          onClick={() => runComplianceCheckMutation.mutate()}
          disabled={runComplianceCheckMutation.isPending}
          data-testid="button-run-compliance-check"
        >
          {runComplianceCheckMutation.isPending ? 'Checking...' : 'Run Compliance Check'}
        </Button>
      </div>

      {/* Compliance Score Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold text-green-600" data-testid="metric-overall-score">
                  {mockCompliance.overallScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold" data-testid="metric-critical-violations">
                  {mockCompliance.criticalViolations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overtime Hours</p>
                <p className="text-2xl font-bold" data-testid="metric-overtime-hours">
                  {mockCompliance.weeklyReport.overtimeHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Break Violations</p>
                <p className="text-2xl font-bold" data-testid="metric-break-violations">
                  {mockCompliance.weeklyReport.breakViolations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Areas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Compliance Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Labor Law Compliance</span>
                <div className="flex items-center space-x-2">
                  <Progress value={mockCompliance.laborLawCompliance} className="w-24" />
                  <span className="text-sm font-medium">{mockCompliance.laborLawCompliance}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Overtime Management</span>
                <div className="flex items-center space-x-2">
                  <Progress value={mockCompliance.overtimeCompliance} className="w-24" />
                  <span className="text-sm font-medium">{mockCompliance.overtimeCompliance}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Break Scheduling</span>
                <div className="flex items-center space-x-2">
                  <Progress value={mockCompliance.breakCompliance} className="w-24" />
                  <span className="text-sm font-medium">{mockCompliance.breakCompliance}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Maximum Hours</span>
                <div className="flex items-center space-x-2">
                  <Progress value={mockCompliance.maxHoursCompliance} className="w-24" />
                  <span className="text-sm font-medium">{mockCompliance.maxHoursCompliance}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted rounded">
                  <div className="text-2xl font-bold">{mockCompliance.weeklyReport.totalHours}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="p-3 bg-muted rounded">
                  <div className="text-2xl font-bold text-orange-600">{mockCompliance.weeklyReport.overtimeHours}</div>
                  <div className="text-sm text-muted-foreground">Overtime Hours</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{mockCompliance.weeklyReport.complianceRate}%</div>
                <div className="text-sm text-muted-foreground">Compliance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Violations */}
      {mockCompliance.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Active Compliance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCompliance.violations.map((violation: any) => (
                <Alert key={violation.id} className="border-l-4 border-orange-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{violation.title}</h4>
                        <Badge variant={violation.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{violation.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>Recommendation:</strong> {violation.recommendation}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Due:</strong> {violation.dueDate}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Compliance Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4" data-testid="button-export-compliance-report">
              <div className="text-center">
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Export Report</div>
                <div className="text-xs text-muted-foreground">Generate compliance PDF</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" data-testid="button-schedule-audit">
              <div className="text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Schedule Audit</div>
                <div className="text-xs text-muted-foreground">Review upcoming shifts</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" data-testid="button-policy-settings">
              <div className="text-center">
                <Settings className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Policy Settings</div>
                <div className="text-xs text-muted-foreground">Configure compliance rules</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}