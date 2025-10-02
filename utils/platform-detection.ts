export interface PlatformInfo {
  isWeb: boolean;
  isElectron: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  platform: 'web' | 'desktop' | 'ios' | 'android' | 'unknown';
  capabilities: {
    hasCamera: boolean;
    hasGeolocation: boolean;
    hasPushNotifications: boolean;
    hasOfflineSupport: boolean;
    hasFileSystem: boolean;
    hasBiometrics: boolean;
  };
}

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}

export function detectPlatform(): PlatformInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isElectron = typeof window !== 'undefined' && !!window.electron?.isElectron;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  const isWeb = !isElectron && !isMobile;

  let platform: PlatformInfo['platform'] = 'unknown';
  if (isElectron) platform = 'desktop';
  else if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (isWeb) platform = 'web';

  const capabilities = {
    hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    hasGeolocation: 'geolocation' in navigator,
    hasPushNotifications: 'PushManager' in window && 'serviceWorker' in navigator,
    hasOfflineSupport: 'serviceWorker' in navigator && 'caches' in window,
    hasFileSystem: isElectron || ('showOpenFilePicker' in window),
    hasBiometrics: 'credentials' in navigator || isIOS || isAndroid
  };

  return {
    isWeb,
    isElectron,
    isMobile,
    isIOS,
    isAndroid,
    isPWA,
    platform,
    capabilities
  };
}

export function getPlatformFeatures() {
  const platform = detectPlatform();
  
  return {
    canUseCamera: platform.capabilities.hasCamera,
    canUseGPS: platform.capabilities.hasGeolocation,
    canUsePushNotifications: platform.capabilities.hasPushNotifications,
    canWorkOffline: platform.capabilities.hasOfflineSupport,
    canAccessFileSystem: platform.capabilities.hasFileSystem,
    canUseBiometrics: platform.capabilities.hasBiometrics,
    platformName: platform.platform,
    isNativeApp: platform.isElectron || platform.isMobile,
    displayMode: platform.isPWA ? 'standalone' : 'browser'
  };
}

export function getPlatformSpecificStyles() {
  const platform = detectPlatform();
  
  return {
    headerHeight: platform.isIOS ? '88px' : '64px',
    bottomPadding: platform.isIOS ? '34px' : '0px',
    touchTarget: platform.isMobile ? '44px' : '32px',
    fontSize: platform.isMobile ? '16px' : '14px'
  };
}

export function logPlatformInfo() {
  const info = detectPlatform();
  const features = getPlatformFeatures();
  
  console.group('🖥️ Platform Information');
  console.log('Platform:', info.platform);
  console.log('Is Electron:', info.isElectron);
  console.log('Is PWA:', info.isPWA);
  console.log('Is Mobile:', info.isMobile);
  console.log('Device:', {
    iOS: info.isIOS,
    Android: info.isAndroid,
    Web: info.isWeb
  });
  console.log('Capabilities:', info.capabilities);
  console.log('Features:', features);
  console.groupEnd();
  
  return { info, features };
}
