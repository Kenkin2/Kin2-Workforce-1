import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Bell, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Share,
  Globe,
  Shield,
  Zap,
  Camera,
  MapPin,
  Info
} from 'lucide-react';
import { NetworkStatus } from '@/components/ui/offline-indicator';

export default function PWASettings() {
  const {
    isInstallable,
    isInstalled,
    isOffline,
    installApp,
    updateAvailable,
    updateApp,
    sendNotification,
    shareContent,
    getDeviceInfo,
    requestPermissions,
    requestNotificationPermission
  } = usePWA();

  const [permissions, setPermissions] = useState({
    notifications: false,
    geolocation: false,
    camera: false
  });

  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Get device information
    setDeviceInfo(getDeviceInfo());
    
    // Check current permission states
    setNotificationsEnabled(Notification.permission === 'granted');
  }, [getDeviceInfo]);

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      // Installation started
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    setPermissions(granted);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleTestNotification = () => {
    sendNotification('Test Notification', {
      body: 'This is a test notification from Kin2 Workforce',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    });
  };

  const handleShare = async () => {
    await shareContent({
      title: 'Kin2 Workforce',
      text: 'Check out this amazing workforce management platform!',
      url: window.location.origin
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">PWA Settings</h1>
        <p className="text-muted-foreground">
          Manage your app installation, offline features, and permissions
        </p>
      </div>

      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>App Installation</span>
          </CardTitle>
          <CardDescription>
            Install Kin2 Workforce as a native app on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Installation Status</p>
              <div className="flex items-center space-x-2">
                {isInstalled ? (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Installed
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      App is installed on your device
                    </span>
                  </>
                ) : isInstallable ? (
                  <>
                    <Badge variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Ready to install
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">
                      <Globe className="w-3 h-3 mr-1" />
                      Web App
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Running in browser
                    </span>
                  </>
                )}
              </div>
            </div>
            {isInstallable && !isInstalled && (
              <Button onClick={handleInstallApp}>
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>

          {updateAvailable && (
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>A new version is available!</span>
                <Button onClick={updateApp} size="sm">
                  Update Now
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            <span>Network & Offline</span>
          </CardTitle>
          <CardDescription>
            Monitor your connection status and offline capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Status</p>
              <NetworkStatus />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Offline Features</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• View cached data and documents</li>
                <li>• Clock in/out (syncs when back online)</li>
                <li>• Access learning courses</li>
                <li>• Submit timesheets (queued for sync)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Background Sync</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Automatic data synchronization</li>
                <li>• Queued actions when offline</li>
                <li>• Smart conflict resolution</li>
                <li>• Periodic background updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Permissions</span>
          </CardTitle>
          <CardDescription>
            Manage app permissions for enhanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4" />
                <div>
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get important updates and reminders
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
                {notificationsEnabled && (
                  <Button onClick={handleTestNotification} size="sm" variant="outline">
                    Test
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4" />
                <div>
                  <Label>Location Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable location-based features and tracking
                  </p>
                </div>
              </div>
              <Badge variant={permissions.geolocation ? 'default' : 'secondary'}>
                {permissions.geolocation ? 'Granted' : 'Not Granted'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-4 h-4" />
                <div>
                  <Label>Camera Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Take photos for job documentation
                  </p>
                </div>
              </div>
              <Badge variant={permissions.camera ? 'default' : 'secondary'}>
                {permissions.camera ? 'Granted' : 'Not Granted'}
              </Badge>
            </div>
          </div>

          <Button onClick={handleRequestPermissions} variant="outline" className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Request All Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Device Information</span>
          </CardTitle>
          <CardDescription>
            Information about your device and supported features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Device Type</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>Mobile: {deviceInfo.isMobile ? 'Yes' : 'No'}</p>
                <p>Tablet: {deviceInfo.isTablet ? 'Yes' : 'No'}</p>
                <p>Desktop: {deviceInfo.isDesktop ? 'Yes' : 'No'}</p>
                <p>iOS: {deviceInfo.isIOS ? 'Yes' : 'No'}</p>
                <p>Android: {deviceInfo.isAndroid ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Supported Features</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>Notifications: {deviceInfo.supportsNotifications ? 'Yes' : 'No'}</p>
                <p>Sharing: {deviceInfo.supportsShare ? 'Yes' : 'No'}</p>
                <p>Location: {deviceInfo.supportsGeolocation ? 'Yes' : 'No'}</p>
                <p>Camera: {deviceInfo.supportsCamera ? 'Yes' : 'No'}</p>
                <p>Connection: {deviceInfo.connectionType}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share className="w-5 h-5" />
            <span>Share App</span>
          </CardTitle>
          <CardDescription>
            Share Kin2 Workforce with your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleShare} className="w-full">
            <Share className="w-4 h-4 mr-2" />
            Share Kin2 Workforce
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}