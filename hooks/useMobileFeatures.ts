import { useState, useEffect, useCallback, useRef } from 'react';

// Voice Control Interface
interface VoiceCommand {
  command: string;
  action: string;
  confidence: number;
}

interface VoiceControlState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  lastCommand: VoiceCommand | null;
}

// Camera Interface
interface CameraState {
  isOpen: boolean;
  stream: MediaStream | null;
  isSupported: boolean;
  facingMode: 'user' | 'environment';
}

// Biometric Interface
interface BiometricState {
  isSupported: boolean;
  isEnrolled: boolean;
  type: 'fingerprint' | 'face' | 'none';
}

// Mobile Device Info
interface DeviceCapabilities {
  hasVibration: boolean;
  hasBattery: boolean;
  hasOrientation: boolean;
  hasMotion: boolean;
  hasProximity: boolean;
  hasAmbientLight: boolean;
  connectionType: string;
  deviceMemory: number;
  hardwareConcurrency: number;
}

export function useVoiceControl() {
  const [voiceState, setVoiceState] = useState<VoiceControlState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    lastCommand: null,
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    setVoiceState(prev => ({
      ...prev,
      isSupported: !!SpeechRecognition,
    }));

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      setVoiceState(prev => ({
        ...prev,
        transcript,
        confidence,
      }));

      if (result.isFinal) {
        const command = parseVoiceCommand(transcript);
        setVoiceState(prev => ({
          ...prev,
          lastCommand: command,
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setVoiceState(prev => ({ ...prev, isListening: false }));
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setVoiceState(prev => ({ ...prev, isListening: false }));
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setVoiceState(prev => ({ ...prev, isListening: false }));
  }, []);

  const parseVoiceCommand = (transcript: string): VoiceCommand | null => {
    const normalizedText = transcript.toLowerCase().trim();
    
    // Define voice commands
    const commands = [
      { pattern: /clock in|start work|begin shift/, action: 'clock_in' },
      { pattern: /clock out|end work|finish shift/, action: 'clock_out' },
      { pattern: /show jobs|find jobs|view jobs/, action: 'show_jobs' },
      { pattern: /show schedule|view schedule|my schedule/, action: 'show_schedule' },
      { pattern: /navigate to dashboard|go to dashboard/, action: 'navigate_dashboard' },
      { pattern: /take photo|capture image|open camera/, action: 'open_camera' },
      { pattern: /show notifications|view notifications/, action: 'show_notifications' },
    ];

    for (const cmd of commands) {
      if (cmd.pattern.test(normalizedText)) {
        return {
          command: normalizedText,
          action: cmd.action,
          confidence: 0.8,
        };
      }
    }

    return null;
  };

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    ...voiceState,
    startListening,
    stopListening,
    speak,
  };
}

export function useCameraFeatures() {
  const [cameraState, setCameraState] = useState<CameraState>({
    isOpen: false,
    stream: null,
    isSupported: false,
    facingMode: 'environment',
  });

  useEffect(() => {
    const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setCameraState(prev => ({ ...prev, isSupported }));
  }, []);

  const openCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    if (!cameraState.isSupported) return false;

    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setCameraState(prev => ({
        ...prev,
        isOpen: true,
        stream,
        facingMode,
      }));

      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      return false;
    }
  }, [cameraState.isSupported]);

  const closeCamera = useCallback(() => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
    }
    
    setCameraState(prev => ({
      ...prev,
      isOpen: false,
      stream: null,
    }));
  }, [cameraState.stream]);

  const capturePhoto = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!cameraState.stream) {
        resolve(null);
        return;
      }

      const video = document.createElement('video');
      video.srcObject = cameraState.stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      };
    });
  }, [cameraState.stream]);

  const switchCamera = useCallback(() => {
    const newFacingMode = cameraState.facingMode === 'user' ? 'environment' : 'user';
    closeCamera();
    setTimeout(() => openCamera(newFacingMode), 100);
  }, [cameraState.facingMode, closeCamera, openCamera]);

  return {
    ...cameraState,
    openCamera,
    closeCamera,
    capturePhoto,
    switchCamera,
  };
}

export function useBiometricAuth() {
  const [biometricState, setBiometricState] = useState<BiometricState>({
    isSupported: false,
    isEnrolled: false,
    type: 'none',
  });

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = useCallback(async () => {
    // Check for Web Authentication API
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        const supported = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: "Kin2 Workforce" },
            user: {
              id: new Uint8Array(16),
              name: "test@example.com",
              displayName: "Test User",
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            timeout: 60000,
            attestation: "direct",
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
            },
          },
        });

        setBiometricState({
          isSupported: true,
          isEnrolled: !!supported,
          type: 'fingerprint', // Default assumption
        });
      } catch (error) {
        // Check if it's a NotAllowedError (user cancelled) vs not supported
        const isSupported = (error as any).name !== 'NotSupportedError';
        setBiometricState({
          isSupported,
          isEnrolled: false,
          type: isSupported ? 'fingerprint' : 'none',
        });
      }
    }
  }, []);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricState.isSupported) return false;

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      });

      return !!credential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, [biometricState.isSupported]);

  const enrollBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricState.isSupported) return false;

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "Kin2 Workforce" },
          user: {
            id: new Uint8Array(16),
            name: "user@example.com",
            displayName: "User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      });

      if (credential) {
        setBiometricState(prev => ({ ...prev, isEnrolled: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      return false;
    }
  }, [biometricState.isSupported]);

  return {
    ...biometricState,
    authenticate: authenticateWithBiometric,
    enroll: enrollBiometric,
  };
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    hasVibration: false,
    hasBattery: false,
    hasOrientation: false,
    hasMotion: false,
    hasProximity: false,
    hasAmbientLight: false,
    connectionType: 'unknown',
    deviceMemory: 0,
    hardwareConcurrency: 0,
  });

  useEffect(() => {
    const checkCapabilities = () => {
      const newCapabilities: DeviceCapabilities = {
        hasVibration: 'vibrate' in navigator,
        hasBattery: 'getBattery' in navigator,
        hasOrientation: 'orientation' in screen,
        hasMotion: 'DeviceMotionEvent' in window,
        hasProximity: 'ProximitySensor' in window,
        hasAmbientLight: 'AmbientLightSensor' in window,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        deviceMemory: (navigator as any).deviceMemory || 0,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
      };

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  return capabilities;
}

export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(50), [vibrate]);
  const doubleTap = useCallback(() => vibrate([50, 100, 50]), [vibrate]);
  const longPress = useCallback(() => vibrate(200), [vibrate]);
  const success = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const error = useCallback(() => vibrate([200, 100, 200, 100, 200]), [vibrate]);

  return {
    vibrate,
    lightTap,
    doubleTap,
    longPress,
    success,
    error,
  };
}

export function useMotionSensors() {
  const [motion, setMotion] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    isSupported: false,
  });

  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        setMotion(prev => ({
          ...prev,
          acceleration: {
            x: event.acceleration?.x || 0,
            y: event.acceleration?.y || 0,
            z: event.acceleration?.z || 0,
          },
          rotationRate: {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0,
          },
          isSupported: true,
        }));
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setMotion(prev => ({
        ...prev,
        orientation: {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0,
        },
      }));
    };

    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  return motion;
}