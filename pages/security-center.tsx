import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Fingerprint, 
  Smartphone, 
  Globe, 
  Server, 
  Database, 
  FileX, 
  UserX, 
  Activity,
  Clock,
  MapPin,
  Wifi,
  Monitor,
  Camera,
  Zap,
  Settings
} from "lucide-react";

interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'access' | 'threat' | 'compliance' | 'biometric';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  device?: string;
  resolved: boolean;
}

interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  status: 'active' | 'inactive' | 'error';
  location: string;
  lastUsed: string;
  accuracy: number;
}

const securityMetrics: SecurityMetric[] = [
  {
    id: 'overall-security',
    name: 'Overall Security Score',
    value: 94,
    status: 'good',
    trend: 'up',
    description: 'Comprehensive security assessment across all systems'
  },
  {
    id: 'threat-level',
    name: 'Threat Level',
    value: 15,
    status: 'good',
    trend: 'down',
    description: 'Current threat detection and response status'
  },
  {
    id: 'compliance-score',
    name: 'Compliance Score',
    value: 98,
    status: 'good',
    trend: 'stable',
    description: 'Regulatory compliance adherence level'
  },
  {
    id: 'access-control',
    name: 'Access Control',
    value: 89,
    status: 'warning',
    trend: 'up',
    description: 'User access management and permissions'
  }
];

const recentSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'biometric',
    severity: 'low',
    title: 'Biometric Authentication Success',
    description: 'Employee Sarah Chen successfully authenticated using fingerprint scanner',
    timestamp: '2 minutes ago',
    location: 'Main Office - Floor 3',
    device: 'Fingerprint Scanner #03',
    resolved: true
  },
  {
    id: '2',
    type: 'access',
    severity: 'medium',
    title: 'Unusual Access Pattern Detected',
    description: 'Multiple login attempts from new location detected for user Mike Johnson',
    timestamp: '15 minutes ago',
    location: 'Remote - San Francisco, CA',
    device: 'Mobile Device',
    resolved: false
  },
  {
    id: '3',
    type: 'compliance',
    severity: 'low',
    title: 'GDPR Compliance Check Passed',
    description: 'Automated data retention policy compliance verification completed successfully',
    timestamp: '1 hour ago',
    resolved: true
  },
  {
    id: '4',
    type: 'threat',
    severity: 'high',
    title: 'Potential Data Breach Attempt',
    description: 'Suspicious data access pattern detected on employee database',
    timestamp: '2 hours ago',
    location: 'Server Room - Database Cluster',
    resolved: false
  },
  {
    id: '5',
    type: 'login',
    severity: 'medium',
    title: 'Failed Login Attempts',
    description: '5 consecutive failed login attempts for admin account',
    timestamp: '3 hours ago',
    location: 'Remote - Unknown Location',
    resolved: true
  }
];

const biometricDevices: BiometricDevice[] = [
  {
    id: 'fp-scanner-01',
    name: 'Fingerprint Scanner #01',
    type: 'fingerprint',
    status: 'active',
    location: 'Main Entrance',
    lastUsed: '2 minutes ago',
    accuracy: 99.8
  },
  {
    id: 'face-rec-02',
    name: 'Face Recognition Camera #02',
    type: 'face',
    status: 'active',
    location: 'Server Room',
    lastUsed: '15 minutes ago',
    accuracy: 97.5
  },
  {
    id: 'iris-scan-03',
    name: 'Iris Scanner #03',
    type: 'iris',
    status: 'inactive',
    location: 'Executive Floor',
    lastUsed: '2 hours ago',
    accuracy: 99.9
  },
  {
    id: 'voice-auth-04',
    name: 'Voice Authentication #04',
    type: 'voice',
    status: 'error',
    location: 'Call Center',
    lastUsed: '1 day ago',
    accuracy: 95.2
  }
];

export default function SecurityCenter() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [quantumSecurityEnabled, setQuantumSecurityEnabled] = useState(true);

  const handleResolveEvent = (eventId: string) => {
    toast({
      title: "Event Resolved",
      description: "Security event has been marked as resolved.",
    });
  };

  const handleEnableBiometric = (deviceId: string) => {
    toast({
      title: "Biometric Device Activated",
      description: "Device has been successfully activated.",
    });
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'fingerprint': return Fingerprint;
      case 'face': return Camera;
      case 'voice': return Activity;
      case 'iris': return Eye;
      default: return Lock;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return Key;
      case 'access': return Shield;
      case 'threat': return AlertTriangle;
      case 'compliance': return CheckCircle;
      case 'biometric': return Fingerprint;
      default: return Activity;
    }
  };

  return (
    <AppLayout 
      title="Security Center"
      breadcrumbs={[{ label: "Compliance", href: "/compliance" }, { label: "Security" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Advanced Security Center
            </h2>
            <p className="text-muted-foreground">Quantum-secure enterprise protection and monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={quantumSecurityEnabled ? "default" : "outline"} className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Quantum Security {quantumSecurityEnabled ? 'Active' : 'Inactive'}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Security Settings
            </Button>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {securityMetrics.map((metric) => (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{metric.name}</h3>
                  <Badge variant="outline" className={getMetricColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-2">{metric.value}%</div>
                <Progress value={metric.value} className="mb-2" />
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Security Events</TabsTrigger>
            <TabsTrigger value="biometric" data-testid="tab-biometric">Biometric Auth</TabsTrigger>
            <TabsTrigger value="quantum" data-testid="tab-quantum">Quantum Security</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Security Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    System Integrity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">Secure</div>
                  <p className="text-sm text-muted-foreground">All systems operating normally with no detected threats</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Firewall:</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Encryption:</span>
                      <span className="text-green-600">AES-256</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Intrusion Detection:</span>
                      <span className="text-green-600">Online</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Lock className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">89%</div>
                  <p className="text-sm text-muted-foreground">Multi-factor authentication compliance rate</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Sessions:</span>
                      <span className="text-blue-600">247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>2FA Enabled:</span>
                      <span className="text-blue-600">89%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Privileged Users:</span>
                      <span className="text-blue-600">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Zap className="w-5 h-5" />
                    Quantum Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 mb-2">Active</div>
                  <p className="text-sm text-muted-foreground">Post-quantum cryptography enabled</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Algorithm:</span>
                      <span className="text-purple-600">CRYSTALS-Kyber</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Key Rotation:</span>
                      <span className="text-purple-600">Daily</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Threat Level:</span>
                      <span className="text-purple-600">Minimal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Security Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Lock className="w-6 h-6" />
                    Force Password Reset
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <UserX className="w-6 h-6" />
                    Revoke Access
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Database className="w-6 h-6" />
                    Backup Data
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    Security Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              {recentSecurityEvents.map((event) => {
                const EventIcon = getEventIcon(event.type);
                
                return (
                  <Card key={event.id} className={`transition-all duration-300 hover:shadow-md ${
                    event.severity === 'critical' ? 'border-red-500/50' :
                    event.severity === 'high' ? 'border-orange-500/50' :
                    event.severity === 'medium' ? 'border-yellow-500/50' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(event.severity)}/20`}>
                          <EventIcon className={`w-5 h-5 ${getSeverityColor(event.severity).replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{event.title}</h3>
                            <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                            {event.resolved && <Badge variant="outline" className="text-green-600">Resolved</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.timestamp}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                            {event.device && (
                              <div className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {event.device}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!event.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveEvent(event.id)}
                              data-testid={`button-resolve-${event.id}`}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="biometric" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {biometricDevices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.type);
                
                return (
                  <Card key={device.id} className={`transition-all duration-300 hover:shadow-lg ${
                    device.status === 'active' ? 'border-green-500/50 bg-green-500/5' :
                    device.status === 'error' ? 'border-red-500/50 bg-red-500/5' : ''
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            device.status === 'active' ? 'bg-green-500/20 text-green-600' :
                            device.status === 'error' ? 'bg-red-500/20 text-red-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            <DeviceIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{device.name}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">{device.type} Scanner</p>
                          </div>
                        </div>
                        <Badge variant={
                          device.status === 'active' ? 'default' :
                          device.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {device.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{device.location}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Used:</span>
                          <p className="font-medium">{device.lastUsed}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Accuracy:</span>
                          <span className="font-medium">{device.accuracy}%</span>
                        </div>
                        <Progress value={device.accuracy} className="h-2" />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant={device.status === 'active' ? "outline" : "default"}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEnableBiometric(device.id)}
                          data-testid={`button-toggle-${device.id}`}
                        >
                          {device.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Calibrate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="quantum" className="space-y-6">
            <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Zap className="w-6 h-6" />
                  Quantum Security Suite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Key className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Quantum Key Distribution</h3>
                      <p className="text-sm text-muted-foreground">Secure key exchange using quantum mechanics</p>
                      <Badge className="mt-2 bg-purple-500 text-white">Active</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Post-Quantum Cryptography</h3>
                      <p className="text-sm text-muted-foreground">NIST-approved quantum-resistant algorithms</p>
                      <Badge className="mt-2 bg-blue-500 text-white">Enabled</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Quantum Threat Detection</h3>
                      <p className="text-sm text-muted-foreground">Real-time quantum attack monitoring</p>
                      <Badge className="mt-2 bg-green-500 text-white">Monitoring</Badge>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Quantum Security Status</h3>
                  <div className="grid gap-4">
                    {[
                      { name: 'Quantum Key Rotation', status: 'Daily', health: 100 },
                      { name: 'Algorithm Strength', status: 'CRYSTALS-Kyber-768', health: 98 },
                      { name: 'Threat Assessment', status: 'Low Risk', health: 95 },
                      { name: 'Quantum Readiness', status: 'Fully Prepared', health: 100 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.health}%</p>
                          <Progress value={item.health} className="w-20 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'GDPR Compliance', status: 'Compliant', score: 98, lastAudit: '2 days ago' },
                { name: 'SOC 2 Type II', status: 'Certified', score: 96, lastAudit: '1 week ago' },
                { name: 'ISO 27001', status: 'Compliant', score: 94, lastAudit: '2 weeks ago' },
                { name: 'HIPAA Security', status: 'Compliant', score: 99, lastAudit: '3 days ago' }
              ].map((compliance, index) => (
                <Card key={index}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{compliance.name}</CardTitle>
                      <Badge variant="outline" className="text-green-600">
                        {compliance.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Compliance Score:</span>
                        <span className="font-medium">{compliance.score}%</span>
                      </div>
                      <Progress value={compliance.score} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Last Audit:</span>
                      <span>{compliance.lastAudit}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}