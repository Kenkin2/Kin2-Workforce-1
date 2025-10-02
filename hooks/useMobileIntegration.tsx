import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'wouter';

// Mobile Integration Context for cross-component communication
interface MobileIntegrationState {
  isVoiceControlActive: boolean;
  isCameraOpen: boolean;
  isNotificationsPanelOpen: boolean;
  isBiometricSetupOpen: boolean;
  currentVoiceCommand: string | null;
  mobileFeatureErrors: string[];
}

interface MobileIntegrationActions {
  toggleVoiceControl: () => void;
  openCamera: () => void;
  closeCamera: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  openBiometricSetup: () => void;
  closeBiometricSetup: () => void;
  executeVoiceCommand: (command: string) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
}

type MobileIntegrationContextType = MobileIntegrationState & MobileIntegrationActions;

const MobileIntegrationContext = createContext<MobileIntegrationContextType | null>(null);

export function MobileIntegrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MobileIntegrationState>({
    isVoiceControlActive: false,
    isCameraOpen: false,
    isNotificationsPanelOpen: false,
    isBiometricSetupOpen: false,
    currentVoiceCommand: null,
    mobileFeatureErrors: [],
  });

  const toggleVoiceControl = useCallback(() => {
    setState(prev => ({ ...prev, isVoiceControlActive: !prev.isVoiceControlActive }));
  }, []);

  const openCamera = useCallback(() => {
    setState(prev => ({ ...prev, isCameraOpen: true }));
  }, []);

  const closeCamera = useCallback(() => {
    setState(prev => ({ ...prev, isCameraOpen: false }));
  }, []);

  const openNotifications = useCallback(() => {
    setState(prev => ({ ...prev, isNotificationsPanelOpen: true }));
  }, []);

  const closeNotifications = useCallback(() => {
    setState(prev => ({ ...prev, isNotificationsPanelOpen: false }));
  }, []);

  const openBiometricSetup = useCallback(() => {
    setState(prev => ({ ...prev, isBiometricSetupOpen: true }));
  }, []);

  const closeBiometricSetup = useCallback(() => {
    setState(prev => ({ ...prev, isBiometricSetupOpen: false }));
  }, []);

  const executeVoiceCommand = useCallback((command: string) => {
    setState(prev => ({ ...prev, currentVoiceCommand: command }));
    
    // Clear the command after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, currentVoiceCommand: null }));
    }, 100);
  }, []);

  const addError = useCallback((error: string) => {
    setState(prev => ({ 
      ...prev, 
      mobileFeatureErrors: [...prev.mobileFeatureErrors, error] 
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, mobileFeatureErrors: [] }));
  }, []);

  const contextValue: MobileIntegrationContextType = {
    ...state,
    toggleVoiceControl,
    openCamera,
    closeCamera,
    openNotifications,
    closeNotifications,
    openBiometricSetup,
    closeBiometricSetup,
    executeVoiceCommand,
    addError,
    clearErrors,
  };

  return (
    <MobileIntegrationContext.Provider value={contextValue}>
      {children}
    </MobileIntegrationContext.Provider>
  );
}

export function useMobileIntegration() {
  const context = useContext(MobileIntegrationContext);
  if (!context) {
    throw new Error('useMobileIntegration must be used within a MobileIntegrationProvider');
  }
  return context;
}

// Hook for handling voice command integration
export function useVoiceCommandIntegration() {
  const {
    currentVoiceCommand,
    openCamera,
    openNotifications,
    openBiometricSetup,
    addError,
  } = useMobileIntegration();
  const [, setLocation] = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentVoiceCommand && !isProcessing) {
      handleVoiceCommand(currentVoiceCommand);
    }
  }, [currentVoiceCommand, isProcessing]);

  const handleVoiceCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    
    try {
      switch (command) {
        case 'open_camera':
        case 'take_photo':
        case 'capture_image':
          openCamera();
          break;
          
        case 'show_notifications':
        case 'view_notifications':
        case 'open_notifications':
          openNotifications();
          break;
          
        case 'biometric_setup':
        case 'setup_fingerprint':
        case 'setup_biometric':
          openBiometricSetup();
          break;
          
        case 'clock_in':
          // Dispatch clock in event
          window.dispatchEvent(new CustomEvent('mobile-clock-action', { 
            detail: { action: 'in' } 
          }));
          break;
          
        case 'clock_out':
          // Dispatch clock out event
          window.dispatchEvent(new CustomEvent('mobile-clock-action', { 
            detail: { action: 'out' } 
          }));
          break;
          
        case 'show_jobs':
        case 'navigate_jobs':
          setLocation('/jobs');
          break;
          
        case 'show_schedule':
        case 'navigate_schedule':
          setLocation('/schedule');
          break;
          
        case 'navigate_dashboard':
        case 'go_home':
          setLocation('/');
          break;
          
        default:
          addError(`Voice command not recognized: ${command}`);
      }
    } catch (error) {
      console.error('Voice command execution error:', error);
      addError(`Failed to execute voice command: ${command}`);
    } finally {
      setIsProcessing(false);
    }
  }, [openCamera, openNotifications, openBiometricSetup, addError, setLocation]);

  return {
    isProcessing,
    handleVoiceCommand,
  };
}