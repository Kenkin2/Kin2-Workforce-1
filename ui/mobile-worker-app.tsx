import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  MapPin, 
  Camera, 
  Mic, 
  Bell, 
  Star, 
  DollarSign, 
  Calendar,
  Award,
  Zap,
  Navigation,
  Wifi,
  WifiOff,
  Download,
  Upload
} from 'lucide-react';

interface WorkerApp {
  isOnline: boolean;
  location: { lat: number; lng: number; address: string } | null;
  currentShift: any | null;
  pendingSync: number;
  batteryLevel: number;
}

export function MobileWorkerApp() {
  const [appState, setAppState] = useState<WorkerApp>({
    isOnline: navigator.onLine,
    location: null,
    currentShift: null,
    pendingSync: 0,
    batteryLevel: 100
  });

  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New job available', type: 'job', priority: 'high' },
    { id: 2, title: 'Shift reminder', type: 'schedule', priority: 'medium' }
  ]);

  // PWA and offline capabilities
  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {})
        .catch(() => {});
    }

    // Handle online/offline events
    const handleOnline = () => setAppState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setAppState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Geolocation tracking
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        position => {
          setAppState(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            }
          }));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );
    }

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setAppState(prev => ({ ...prev, batteryLevel: battery.level * 100 }));
        
        battery.addEventListener('levelchange', () => {
          setAppState(prev => ({ ...prev, batteryLevel: battery.level * 100 }));
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Voice control integration
  const handleVoiceCommand = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsVoiceRecording(true);

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      processVoiceCommand(command);
      setIsVoiceRecording(false);
    };

    recognition.onerror = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (command: string) => {
    // Process voice command
    // Process voice commands here
    if (command.toLowerCase().includes('clock in')) {
      handleClockIn();
    } else if (command.toLowerCase().includes('schedule')) {
      // Navigate to schedule
    }
  };

  // Clock in/out functionality
  const handleClockIn = async () => {
    try {
      // Update current shift
      setAppState(prev => ({
        ...prev,
        currentShift: {
          id: '1',
          startTime: new Date(),
          location: prev.location,
          status: 'active'
        }
      }));
      
      // Sync with server when online
      if (appState.isOnline) {
        // API call to server
      } else {
        // Store in local storage for later sync
        setAppState(prev => ({ ...prev, pendingSync: prev.pendingSync + 1 }));
      }
    } catch (error) {
      console.error('Clock in failed:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      setAppState(prev => ({
        ...prev,
        currentShift: null
      }));
      
      if (appState.isOnline) {
        // API call to server
      } else {
        setAppState(prev => ({ ...prev, pendingSync: prev.pendingSync + 1 }));
      }
    } catch (error) {
      console.error('Clock out failed:', error);
    }
  };

  // Camera functionality for job documentation
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Process image for job documentation
        // Process captured image
      }
    };
    
    input.click();
  };

  // Sync pending data
  const syncData = async () => {
    if (!appState.isOnline || appState.pendingSync === 0) return;

    try {
      // Sync local data with server
      setAppState(prev => ({ ...prev, pendingSync: 0 }));
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {appState.isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          {appState.location && <Navigation className="w-4 h-4 text-blue-500" />}
          {appState.pendingSync > 0 && (
            <Badge variant="outline" className="text-xs">
              {appState.pendingSync} pending
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm">{Math.round(appState.batteryLevel)}%</span>
          <div className="w-6 h-3 border rounded-sm">
            <div 
              className="h-full bg-green-500 rounded-sm"
              style={{ width: `${appState.batteryLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {appState.currentShift ? (
            <Button 
              onClick={handleClockOut}
              className="h-20 bg-red-500 hover:bg-red-600"
              data-testid="button-clock-out"
            >
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Clock Out</div>
              </div>
            </Button>
          ) : (
            <Button 
              onClick={handleClockIn}
              className="h-20 bg-green-500 hover:bg-green-600"
              data-testid="button-clock-in"
            >
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Clock In</div>
              </div>
            </Button>
          )}
          
          <Button 
            onClick={handleVoiceCommand}
            className={`h-20 ${isVoiceRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
            data-testid="button-voice-command"
          >
            <div className="text-center">
              <Mic className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">
                {isVoiceRecording ? 'Listening...' : 'Voice'}
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={handleCameraCapture}
            className="h-20 bg-purple-500 hover:bg-purple-600"
            data-testid="button-camera"
          >
            <div className="text-center">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Document</div>
            </div>
          </Button>
          
          {appState.pendingSync > 0 && (
            <Button 
              onClick={syncData}
              className="h-20 bg-orange-500 hover:bg-orange-600"
              data-testid="button-sync"
            >
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Sync Data</div>
              </div>
            </Button>
          )}
        </div>

        {/* Current Shift Status */}
        {appState.currentShift && (
          <Card className="mb-6" data-testid="card-current-shift">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-500" />
                Active Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>{appState.currentShift.startTime.toLocaleTimeString()}</span>
                </div>
                {appState.location && (
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-sm">{appState.location.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-green-600">
                    {Math.floor((Date.now() - appState.currentShift.startTime.getTime()) / (1000 * 60))} min
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card data-testid="card-earnings">
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">$1,247</div>
                  <div className="text-sm text-gray-500">This month</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-rating">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">4.8</div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="mb-6" data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
                <Badge className="ml-2">{notifications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-500">{notification.type}</div>
                    </div>
                    <Badge 
                      variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card data-testid="card-schedule">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <div className="font-medium">Morning Shift</div>
                  <div className="text-sm text-gray-500">Office Building Cleaning</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">9:00 AM</div>
                  <div className="text-sm text-gray-500">4 hours</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <div className="font-medium">Afternoon Shift</div>
                  <div className="text-sm text-gray-500">Warehouse Setup</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">2:00 PM</div>
                  <div className="text-sm text-gray-500">3 hours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Progress */}
        <Card className="mb-6" data-testid="card-training">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Safety Certification</span>
                  <span>85%</span>
                </div>
                <Progress value={85} />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span>Equipment Training</span>
                  <span>92%</span>
                </div>
                <Progress value={92} />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span>Customer Service</span>
                  <span>78%</span>
                </div>
                <Progress value={78} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}