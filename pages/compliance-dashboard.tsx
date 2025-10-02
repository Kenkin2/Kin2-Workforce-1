import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  Download,
  TrendingUp,
  Users,
  Database,
  Lock,
  Eye,
  Activity
} from "lucide-react";

interface ComplianceOverview {
  totalRegulations: number;
  compliantRegulations: number;
  partialCompliance: number;
  nonCompliantRegulations: number;
  overallScore: number;
  activeIncidents: number;
  pendingAssessments: number;
  dataRetentionCompliance: number;
}

interface Regulation {
  id: string;
  name: string;
  description: string;
  jurisdiction: string[];
  status: 'compliant' | 'partial' | 'non_compliant';
  score: number;
  lastAssessed: number;
  nextAssessment: number;
  gaps: number;
  incidents: number;
  keyRequirements: number;
}

type ComplianceRegulation = Regulation;

interface ComplianceIncident {
  id: string;
  timestamp: number;
  regulation: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affectedUsers: number;
  affectedRecords: number;
}

interface AuditLog {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  userId?: string;
  regulations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function ComplianceDashboard() {
  const [selectedRegulation, setSelectedRegulation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const { data: overview } = useQuery<{
    overallScore: number;
    compliantRegulations: number;
    totalRegulations: number;
    activeIncidents: number;
    dataRetentionCompliance: number;
    pendingAssessments: number;
  }>({
    queryKey: ['/api/compliance/overview'],
    refetchInterval: 30000
  });

  const { data: regulations } = useQuery<ComplianceRegulation[]>({
    queryKey: ['/api/compliance/regulations'],
    refetchInterval: 60000
  });

  const { data: incidents } = useQuery<ComplianceIncident[]>({
    queryKey: ['/api/compliance/incidents', timeRange],
    refetchInterval: 30000
  });

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/compliance/audit-logs', timeRange],
    refetchInterval: 15000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'non_compliant': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const triggerAssessment = async (regulationId: string) => {
    try {
      await fetch(`/api/compliance/assess/${regulationId}`, { method: 'POST' });
      // Refresh data
    } catch (error) {
      console.error('Assessment failed:', error);
    }
  };

  const exportComplianceReport = async () => {
    try {
      const response = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regulation: selectedRegulation,
          timeRange,
          format: 'pdf'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${Date.now()}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" />
            Compliance & Regulatory Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor compliance status, conduct assessments, and maintain regulatory adherence
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportComplianceReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => triggerAssessment('all')}>
            <Search className="w-4 h-4 mr-2" />
            Run Assessment
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overallScore.toFixed(1)}%</div>
              <Progress value={overview.overallScore} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {overview.compliantRegulations}/{overview.totalRegulations} regulations compliant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overview.activeIncidents}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Retention</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.dataRetentionCompliance.toFixed(1)}%</div>
              <Progress value={overview.dataRetentionCompliance} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                Retention policy compliance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Due for review
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="regulations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regulations">Regulations</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Regulations Tab */}
        <TabsContent value="regulations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {regulations?.map((regulation: Regulation) => (
              <Card key={regulation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{regulation.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {regulation.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={`${getStatusColor(regulation.status)} text-white`}
                      variant="secondary"
                    >
                      {regulation.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Compliance Score */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Compliance Score</span>
                        <span className="font-medium">{regulation.score.toFixed(1)}%</span>
                      </div>
                      <Progress value={regulation.score} />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Gaps</div>
                        <div className="font-medium text-red-600">{regulation.gaps}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Incidents</div>
                        <div className="font-medium text-orange-600">{regulation.incidents}</div>
                      </div>
                    </div>

                    {/* Last Assessment */}
                    <div className="text-sm text-muted-foreground">
                      Last assessed: {new Date(regulation.lastAssessed).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowDetails(regulation.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => triggerAssessment(regulation.id)}
                      >
                        <Search className="w-4 h-4 mr-1" />
                        Assess
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          {incidents && incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident: ComplianceIncident) => (
                <Alert key={incident.id} className={
                  incident.severity === 'critical' ? 'border-red-500' :
                  incident.severity === 'high' ? 'border-orange-500' :
                  incident.severity === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{incident.regulation} - {incident.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {incident.status.toUpperCase()}
                      </Badge>
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>{incident.description}</p>
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span>Affected: {incident.affectedUsers} users, {incident.affectedRecords} records</span>
                        <span className="ml-4">
                          Reported: {new Date(incident.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Active Incidents</h3>
                <p className="text-muted-foreground">All compliance incidents have been resolved</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Audit Activity
              </CardTitle>
              <CardDescription>
                Comprehensive audit trail for compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.slice(0, 10).map((log: AuditLog) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                        {log.regulations.map(reg => (
                          <Badge key={reg} variant="secondary" className="text-xs">
                            {reg}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm">{log.message}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.userId && ` • User: ${log.userId}`}
                      </div>
                    </div>
                    <Badge className={getSeverityColor(log.riskLevel)}>
                      {log.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Schedule</CardTitle>
              <CardDescription>
                Manage and track compliance assessments across all regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regulations?.map((regulation: Regulation) => (
                  <div key={regulation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{regulation.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last: {new Date(regulation.lastAssessed).toLocaleDateString()} • 
                        Next: {new Date(regulation.nextAssessment).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{regulation.score.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Current Score</div>
                      </div>
                      <Button size="sm" onClick={() => triggerAssessment(regulation.id)}>
                        Run Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Compliance Summary
                </CardTitle>
                <CardDescription>
                  Executive summary of overall compliance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  GDPR Report
                </CardTitle>
                <CardDescription>
                  Detailed GDPR compliance assessment and evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Security Audit
                </CardTitle>
                <CardDescription>
                  Security controls and audit trail analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Data Subject Rights
                </CardTitle>
                <CardDescription>
                  Summary of data subject requests and responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Data Retention
                </CardTitle>
                <CardDescription>
                  Data retention policy compliance and cleanup status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Incident Summary
                </CardTitle>
                <CardDescription>
                  Compliance incidents and remediation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}