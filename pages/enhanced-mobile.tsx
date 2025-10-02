import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { MobileIntegrationProvider, useMobileIntegration } from '@/hooks/useMobileIntegration';
import { PullToRefresh } from '@/components/mobile/mobile-gestures';
import { MobilePerformanceMonitor, NetworkOptimization } from '@/components/mobile/mobile-performance';
import { VoiceControlWidget } from '@/components/mobile/voice-control';
import { BiometricAuthSetup } from '@/components/mobile/biometric-auth';
import { CameraCapture } from '@/components/mobile/camera-capture';
import { 
  QuickStatsWidget,
  UpcomingShiftsWidget,
  GoalsProgressWidget,
  WeatherLocationWidget,
  MotionActivityWidget,
  TimerWidget
} from '@/components/mobile/mobile-widgets';
import { 
  Smartphone, 
  Zap, 
  Camera,
  Mic,
  Fingerprint,
  Activity,
  Gauge,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react';

function EnhancedMobileContent() {
  const { user } = useAuth() as { user: any };
  const [refreshing, setRefreshing] = useState(false);
  const {
    isCameraOpen,
    isNotificationsPanelOpen,
    isBiometricSetupOpen,
    closeCamera,
    closeNotifications,
    closeBiometricSetup,
  } = useMobileIntegration();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access mobile features.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={closeCamera}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4">
            <DialogTitle>Camera</DialogTitle>
            <DialogDescription>Capture photos for job documentation</DialogDescription>
          </DialogHeader>
          <CameraCapture />
        </DialogContent>
      </Dialog>

      {/* Notifications Panel */}
      <Dialog open={isNotificationsPanelOpen} onOpenChange={closeNotifications}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Recent updates and alerts</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">New shift assigned</p>
              <p className="text-xs text-muted-foreground">Downtown Office - Tomorrow 9:00 AM</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium text-sm">Payment processed</p>
              <p className="text-xs text-muted-foreground">$1,280 deposited to your account</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biometric Setup Modal */}
      <Dialog open={isBiometricSetupOpen} onOpenChange={closeBiometricSetup}>
        <DialogContent>
          <BiometricAuthSetup />
        </DialogContent>
      </Dialog>
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mobile Hub</h1>
              <p className="text-sm text-gray-500">Enhanced mobile experience</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Smartphone className="w-3 h-3 mr-1" />
                PWA
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="px-4">
        <Tabs defaultValue="dashboard" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="dashboard" className="text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              Features
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">
              <Activity className="w-4 h-4 mr-1" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <QuickStatsWidget />
            {user?.role === 'worker' && <UpcomingShiftsWidget />}
            <GoalsProgressWidget />
            <WeatherLocationWidget />
            <MotionActivityWidget />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Advanced Mobile Features
                </CardTitle>
                <CardDescription>
                  Next-generation mobile capabilities for workforce management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Mic className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="font-medium">Voice Control</span>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Control the app with voice commands like "Clock in" or "Show jobs"
                    </p>
                    <VoiceControlWidget />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Camera className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium">Camera Integration</span>
                      </div>
                      <Badge variant="default">Ready</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Capture photos for job documentation and timesheet verification
                    </p>
                    <CameraCapture />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Fingerprint className="w-5 h-5 text-purple-500 mr-2" />
                        <span className="font-medium">Biometric Security</span>
                      </div>
                      <Badge variant="secondary">Setup</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Secure your account with fingerprint or face recognition
                    </p>
                    <BiometricAuthSetup />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <TimerWidget />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Mobile Tools
                </CardTitle>
                <CardDescription>Productivity tools for mobile workers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 border rounded-lg">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-sm font-medium">Photo Capture</div>
                    <div className="text-xs text-muted-foreground">Job documentation</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium">Voice Notes</div>
                    <div className="text-xs text-muted-foreground">Audio recording</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-sm font-medium">Activity Tracker</div>
                    <div className="text-xs text-muted-foreground">Motion sensors</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Gauge className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-sm font-medium">Performance</div>
                    <div className="text-xs text-muted-foreground">System monitor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <MobilePerformanceMonitor />
            <NetworkOptimization />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mobile Preferences</CardTitle>
                <CardDescription>Customize your mobile experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Haptic Feedback</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark Mode Auto</span>
                    <Badge variant="secondary">System</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Location Services</span>
                    <Badge variant="default">High Accuracy</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Background Sync</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Battery Optimization</span>
                    <Badge variant="secondary">Auto</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PullToRefresh>
    </div>
    </>
  );
}

export default function EnhancedMobilePage() {
  return (
    <MobileIntegrationProvider>
      <EnhancedMobileContent />
    </MobileIntegrationProvider>
  );
}