import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useVoiceControl, useDeviceCapabilities, useHapticFeedback, useBiometricAuth } from '@/hooks/useMobileFeatures';
import { VoiceControlWidget } from './voice-control';
import { CameraCapture, PhotoGallery } from './camera-capture';
import { BiometricAuthSetup } from './biometric-auth';
import { 
  Clock, 
  MapPin, 
  Star, 
  Zap, 
  TrendingUp, 
  Calendar,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  Camera,
  Fingerprint,
  Navigation,
  Settings
} from 'lucide-react';

interface MobileData {
  currentJobId?: string;
  currentShiftId?: string;
  schedule?: Array<{
    id: string;
    jobTitle: string;
    startTime: string;
    endTime: string;
    location?: string;
    status: string;
    requiresPhoto?: boolean;
  }>;
}

export default function EnhancedMobileDashboard() {
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const deviceCapabilities = useDeviceCapabilities();
  const { lightTap, success } = useHapticFeedback();
  const { isSupported: biometricSupported } = useBiometricAuth();
  const { isSupported: voiceSupported } = useVoiceControl();

  // Get mobile-optimized data
  const { data: mobileData, isLoading } = useQuery<MobileData>({
    queryKey: ['/api/mobile/data'],
    enabled: !!user,
  });

  const { data: nearbyJobs } = useQuery({
    queryKey: ['/api/mobile/nearby-jobs'],
    enabled: !!location && user?.role === 'worker',
  });

  // Location tracking with enhanced accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error),
        options
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Clock in/out mutation with location and device info
  const clockMutation = useMutation({
    mutationFn: async (action: 'in' | 'out') => {
      lightTap();
      return apiRequest('POST', '/api/mobile/clock', { 
        action, 
        location,
        deviceInfo: {
          userAgent: navigator.userAgent,
          connectionType: deviceCapabilities.connectionType,
          timestamp: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/data'] });
    },
  });

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      lightTap();
      return apiRequest('POST', `/api/jobs/${jobId}/accept`);
    },
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/data'] });
    },
  });

  // Device status monitoring
  const [deviceStatus, setDeviceStatus] = useState({
    isOnline: navigator.onLine,
    batteryLevel: 0,
    isCharging: false,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setDeviceStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    const updateBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setDeviceStatus(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateBatteryStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Enhanced Mobile Header with Device Status */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Hi, {user?.firstName}!
                </h1>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{user?.role}</span>
                  {location && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <Navigation className="w-3 h-3 mr-1" />
                      GPS
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Device Status Indicators */}
              <div className="flex items-center space-x-1">
                {deviceStatus.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                
                {deviceCapabilities.hasBattery && (
                  <div className="flex items-center">
                    <Battery className="w-4 h-4 text-gray-500" />
                    <span className="text-xs ml-1">{deviceStatus.batteryLevel}%</span>
                  </div>
                )}
              </div>
              
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                {user?.karmaCoins || 0}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Enhanced Quick Actions with Advanced Features */}
        {user?.role === 'worker' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Smart Actions</CardTitle>
              <CardDescription>Voice-enabled and location-aware controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  onClick={() => clockMutation.mutate('in')}
                  disabled={clockMutation.isPending}
                  className="h-16 flex-col space-y-1"
                  data-testid="button-clock-in"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Clock In</span>
                  {location && (
                    <span className="text-xs opacity-70">📍 Located</span>
                  )}
                </Button>
                
                <Button
                  onClick={() => clockMutation.mutate('out')}
                  disabled={clockMutation.isPending}
                  variant="outline"
                  className="h-16 flex-col space-y-1"
                  data-testid="button-clock-out"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Clock Out</span>
                  {location && (
                    <span className="text-xs opacity-70">📍 Located</span>
                  )}
                </Button>
              </div>
              
              {/* Quick Feature Access */}
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" className="w-full" data-testid="button-camera-quick">
                  <Camera className="w-4 h-4" />
                </Button>
                
                {voiceSupported && (
                  <Button size="sm" variant="outline" data-testid="button-voice-quick">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
                
                {biometricSupported && (
                  <Button size="sm" variant="outline" data-testid="button-biometric-quick">
                    <Fingerprint className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Schedule with Smart Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mobileData?.schedule && mobileData.schedule.length > 0 ? (
                mobileData.schedule.map((shift, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{shift.jobTitle}</p>
                      <p className="text-sm text-gray-500">
                        {shift.startTime} - {shift.endTime}
                      </p>
                      {shift.location && (
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {shift.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge>{shift.status}</Badge>
                      {shift.requiresPhoto && (
                        <CameraCapture shiftId={shift.id} />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No shifts scheduled for today</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Browse Available Jobs
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Mobile Features Tabs */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features" className="space-y-4">
            {voiceSupported && <VoiceControlWidget />}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Capabilities</CardTitle>
                <CardDescription>Available mobile features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Vibration</span>
                    <Badge variant={deviceCapabilities.hasVibration ? 'default' : 'secondary'}>
                      {deviceCapabilities.hasVibration ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Motion Sensors</span>
                    <Badge variant={deviceCapabilities.hasMotion ? 'default' : 'secondary'}>
                      {deviceCapabilities.hasMotion ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Connection</span>
                    <Badge variant="outline">
                      {deviceCapabilities.connectionType}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory</span>
                    <Badge variant="outline">
                      {deviceCapabilities.deviceMemory || 'N/A'} GB
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <BiometricAuthSetup />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mobile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High Accuracy GPS</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Background Sync</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Haptic Feedback</span>
                    <Badge variant={deviceCapabilities.hasVibration ? 'default' : 'secondary'}>
                      {deviceCapabilities.hasVibration ? 'Enabled' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Voice Control</span>
                    <Badge variant={voiceSupported ? 'default' : 'secondary'}>
                      {voiceSupported ? 'Available' : 'Not Supported'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Mobile Usage Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user?.role === 'worker' ? '89%' : '94%'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Mobile Usage
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {user?.role === 'worker' ? '45min' : '2.5hr'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Daily Screen Time
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {deviceCapabilities.connectionType === '4g' ? '4G' : '5G'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Connection Type
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {voiceSupported ? '12' : '0'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Voice Commands
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Photo Gallery for Current Job/Shift */}
        {(mobileData?.currentJobId || mobileData?.currentShiftId) && (
          <PhotoGallery 
            jobId={mobileData?.currentJobId} 
            shiftId={mobileData?.currentShiftId} 
          />
        )}
      </div>
    </div>
  );
}