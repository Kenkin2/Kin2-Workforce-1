import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installPrompt: PWAInstallPrompt | null;
  showInstallBanner: boolean;
}

export function usePWA() {
  const [pwaStatus, setPWAStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    installPrompt: null,
    showInstallBanner: false
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setPWAStatus(prev => ({ ...prev, isInstalled }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as any as PWAInstallPrompt;
      
      setPWAStatus(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent,
        showInstallBanner: !isInstalled && !localStorage.getItem('pwa-install-dismissed')
      }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setPWAStatus(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
        showInstallBanner: false
      }));
      
      // Track installation
      if ('gtag' in window) {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'PWA Installation'
        });
      }
    };

    // Listen for online/offline status
    const handleOnline = () => setPWAStatus(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setPWAStatus(prev => ({ ...prev, isOffline: true }));

    // Service worker update detection
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          handleServiceWorkerUpdate();
        }
      });

      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(() => {
          // SW registration failed
        });
    }

    // Set initial offline status
    setPWAStatus(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!pwaStatus.installPrompt) return false;

    try {
      const result = await pwaStatus.installPrompt.prompt();
      const outcome = await pwaStatus.installPrompt.userChoice;
      
      setPWAStatus(prev => ({
        ...prev,
        installPrompt: null,
        showInstallBanner: false
      }));

      return outcome.outcome === 'accepted';
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  };

  const dismissInstallBanner = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setPWAStatus(prev => ({ ...prev, showInstallBanner: false }));
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
    return null;
  };

  const shareContent = async (data: ShareData): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Failed to share:', error);
        return false;
      }
    }
    
    // Fallback to clipboard
    if (navigator.clipboard && data.url) {
      try {
        await navigator.clipboard.writeText(data.url);
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    }
    
    return false;
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    
    return {
      isIOS,
      isAndroid,
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      supportsNotifications: 'Notification' in window,
      supportsShare: 'share' in navigator,
      supportsGeolocation: 'geolocation' in navigator,
      supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };
  };

  const requestPermissions = async () => {
    const permissions = {
      notifications: false,
      geolocation: false,
      camera: false
    };

    // Request notification permission
    try {
      permissions.notifications = await requestNotificationPermission();
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }

    // Request geolocation permission
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        permissions.geolocation = true;
      } catch (error) {
        console.error('Geolocation permission denied:', error);
      }
    }

    // Check camera permission
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        permissions.camera = true;
      } catch (error) {
        console.error('Camera permission denied:', error);
      }
    }

    return permissions;
  };

  return {
    ...pwaStatus,
    updateAvailable,
    installApp,
    dismissInstallBanner,
    updateApp,
    sendNotification,
    shareContent,
    getDeviceInfo,
    requestPermissions,
    requestNotificationPermission
  };
}

// Separate hook for offline status monitoring
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show "back online" message briefly
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  };
}

// Simplified hook specifically for PWA installation
export function usePWAInstall() {
  const pwa = usePWA();
  
  return {
    isInstallable: pwa.isInstallable,
    isInstalled: pwa.isInstalled,
    promptInstall: pwa.installApp,
    dismissInstallBanner: pwa.dismissInstallBanner
  };
}