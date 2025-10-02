import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDeviceCapabilities } from '@/hooks/useMobileFeatures';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Zap, 
  Activity,
  Download,
  Upload,
  Clock,
  HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: number;
  connectionSpeed: number;
  batteryLevel: number;
  isCharging: boolean;
  loadTime: number;
  renderTime: number;
  apiLatency: number;
  cacheHitRate: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function MobilePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    connectionSpeed: 0,
    batteryLevel: 0,
    isCharging: false,
    loadTime: 0,
    renderTime: 0,
    apiLatency: 0,
    cacheHitRate: 0,
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const deviceCapabilities = useDeviceCapabilities();

  // Monitor performance metrics
  useEffect(() => {
    const updateMetrics = async () => {
      try {
        // Memory usage
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          setMetrics(prev => ({ ...prev, memoryUsage }));
        }

        // Battery status
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        }

        // Network information
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          setNetworkInfo({
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false,
          });
        }

        // API latency simulation
        const startTime = performance.now();
        try {
          await fetch('/api/health');
          const endTime = performance.now();
          setMetrics(prev => ({ ...prev, apiLatency: endTime - startTime }));
        } catch (error) {
          console.error('API latency test failed:', error);
        }

        // Cache hit rate (from service worker)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'GET_CACHE_STATS'
          });
        }

      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    };

    if (isMonitoring) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  // Listen for cache stats from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CACHE_STATS') {
        setMetrics(prev => ({
          ...prev,
          cacheHitRate: event.data.hitRate || 0,
        }));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const optimizePerformance = useCallback(async () => {
    // Clear unnecessary caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        !name.includes('kin2-workforce') || 
        name.includes('old') || 
        name.includes('temp')
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }

    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Reload metrics
    if (isMonitoring) {
      setTimeout(() => window.location.reload(), 1000);
    }
  }, [isMonitoring]);

  const getPerformanceScore = () => {
    const scores = [
      Math.max(0, 100 - metrics.memoryUsage), // Memory score
      metrics.apiLatency < 100 ? 100 : Math.max(0, 100 - (metrics.apiLatency - 100) / 10), // API score
      metrics.cacheHitRate, // Cache score
      networkInfo.effectiveType === '4g' ? 100 : networkInfo.effectiveType === '3g' ? 60 : 30, // Network score
    ];
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const performanceScore = getPerformanceScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Performance Monitor
          </div>
          <Badge 
            variant={performanceScore >= 80 ? 'default' : performanceScore >= 60 ? 'secondary' : 'destructive'}
          >
            Score: {performanceScore}
          </Badge>
        </CardTitle>
        <CardDescription>Real-time mobile app performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monitoring</span>
          <Button
            size="sm"
            variant={isMonitoring ? 'destructive' : 'default'}
            onClick={() => setIsMonitoring(!isMonitoring)}
            data-testid="button-toggle-monitoring"
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </Button>
        </div>

        {isMonitoring && (
          <>
            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>

            {/* Battery Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {metrics.batteryLevel < 20 ? (
                    <BatteryLow className="w-4 h-4 mr-2 text-red-500" />
                  ) : (
                    <Battery className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm">Battery</span>
                </div>
                <div className="flex items-center space-x-1">
                  {metrics.isCharging && <Zap className="w-3 h-3 text-green-500" />}
                  <span className="text-sm text-muted-foreground">
                    {metrics.batteryLevel}%
                  </span>
                </div>
              </div>
              <Progress value={metrics.batteryLevel} className="h-2" />
            </div>

            {/* Network Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {navigator.onLine ? (
                    <Wifi className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 mr-2 text-red-500" />
                  )}
                  <span className="text-sm">Network</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {networkInfo.effectiveType.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Downlink:</span>
                  <span>{networkInfo.downlink} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">RTT:</span>
                  <span>{networkInfo.rtt} ms</span>
                </div>
              </div>
            </div>

            {/* API Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">API Latency</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.apiLatency.toFixed(1)} ms
                </span>
              </div>
              <Progress 
                value={Math.min(100, (200 - metrics.apiLatency) / 2)} 
                className="h-2" 
              />
            </div>

            {/* Cache Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="text-sm">Cache Hit Rate</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.cacheHitRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-2" />
            </div>

            {/* Performance Actions */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={optimizePerformance}
                  data-testid="button-optimize-performance"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Optimize
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  data-testid="button-refresh-app"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function NetworkOptimization() {
  const [optimization, setOptimization] = useState({
    dataSaver: false,
    preloadEnabled: true,
    compressionEnabled: true,
  });

  const toggleDataSaver = useCallback(() => {
    const newValue = !optimization.dataSaver;
    setOptimization(prev => ({ ...prev, dataSaver: newValue }));
    
    // Apply data saver settings
    if (newValue) {
      document.documentElement.classList.add('data-saver');
    } else {
      document.documentElement.classList.remove('data-saver');
    }
    
    localStorage.setItem('mobile-data-saver', newValue.toString());
  }, [optimization.dataSaver]);

  useEffect(() => {
    // Load saved preferences
    const savedDataSaver = localStorage.getItem('mobile-data-saver') === 'true';
    setOptimization(prev => ({ ...prev, dataSaver: savedDataSaver }));
    
    if (savedDataSaver) {
      document.documentElement.classList.add('data-saver');
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Wifi className="w-5 h-5 mr-2" />
          Network Optimization
        </CardTitle>
        <CardDescription>Optimize app performance for your connection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Data Saver Mode</p>
              <p className="text-xs text-muted-foreground">Reduce data usage and improve performance</p>
            </div>
            <Button
              size="sm"
              variant={optimization.dataSaver ? 'default' : 'outline'}
              onClick={toggleDataSaver}
              data-testid="button-toggle-data-saver"
            >
              {optimization.dataSaver ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Image Compression</p>
              <p className="text-xs text-muted-foreground">Compress images for faster loading</p>
            </div>
            <Badge variant="secondary">Auto</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Preload Critical Resources</p>
              <p className="text-xs text-muted-foreground">Load important content in advance</p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>
        </div>

        {optimization.dataSaver && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Data Saver mode is active. Images and videos will be compressed, and background updates will be reduced.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}