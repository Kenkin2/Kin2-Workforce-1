import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Security monitoring hooks
export function useSecurityMonitoring() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');
  const { toast } = useToast();

  interface SecurityEvent {
    id: string;
    type: 'suspicious_activity' | 'failed_login' | 'rate_limit' | 'csrf_attempt' | 'xss_attempt';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
    details?: Record<string, any>;
  }

  const logSecurityEvent = useCallback((event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setSecurityEvents(prev => [...prev.slice(-99), newEvent]); // Keep last 100 events

    // Update threat level based on recent events
    const recentEvents = securityEvents.filter(
      e => Date.now() - e.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    const highSeverityCount = recentEvents.filter(e => e.severity === 'high').length;
    const mediumSeverityCount = recentEvents.filter(e => e.severity === 'medium').length;

    if (highSeverityCount >= 3 || mediumSeverityCount >= 5) {
      setThreatLevel('high');
      toast({
        title: 'Security Alert',
        description: 'Multiple security events detected. Please review your account.',
        variant: 'destructive'
      });
    } else if (highSeverityCount >= 1 || mediumSeverityCount >= 2) {
      setThreatLevel('medium');
    } else {
      setThreatLevel('low');
    }

    // Log to server for audit trail
    fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(console.error);

  }, [securityEvents, toast]);

  return {
    securityEvents,
    threatLevel,
    logSecurityEvent
  };
}

// Rate limiting hook
export function useRateLimit(maxRequests: number, windowMs: number) {
  const [requests, setRequests] = useState<number[]>([]);
  const [isLimited, setIsLimited] = useState(false);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      setIsLimited(true);
      return false;
    }

    // Add current request
    setRequests([...recentRequests, now]);
    setIsLimited(false);
    return true;
  }, [requests, maxRequests, windowMs]);

  const getRemainingRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, maxRequests - recentRequests.length);
  }, [requests, maxRequests, windowMs]);

  const getResetTime = useCallback(() => {
    if (requests.length === 0) return null;
    const oldestRequest = Math.min(...requests);
    return new Date(oldestRequest + windowMs);
  }, [requests, windowMs]);

  return {
    checkRateLimit,
    isLimited,
    remainingRequests: getRemainingRequests(),
    resetTime: getResetTime()
  };
}

// Input sanitization hook
export function useInputSanitizer() {
  const sanitizeText = useCallback((input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break attributes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();
  }, []);

  const sanitizeHtml = useCallback((html: string): string => {
    // Basic HTML sanitization - in production, use DOMPurify
    const allowedTags = /<\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote)>/gi;
    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/<(?!\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote)\b)[^>]*>/gi, ''); // Remove non-allowed tags
  }, []);

  const validateUrl = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, []);

  return {
    sanitizeText,
    sanitizeHtml,
    validateUrl
  };
}

// Password strength monitoring
export function usePasswordStrength() {
  const [strength, setStrength] = useState({
    score: 0,
    feedback: [] as string[],
    isStrong: false
  });

  const evaluatePassword = useCallback((password: string) => {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    if (password.length >= 12) {
      score += 1;
    } else if (password.length >= 8) {
      feedback.push('Consider using 12+ characters for better security');
    }

    // Character variety checks
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add uppercase letters (A-Z)');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add lowercase letters (a-z)');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add numbers (0-9)');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add special characters (!@#$%^&*)');
    }

    // Common password patterns (weak)
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common password patterns');
    }

    // Sequential characters (weak)
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid repeating characters');
    }

    const result = {
      score: Math.min(score, 6),
      feedback,
      isStrong: score >= 4 && feedback.length <= 1
    };

    setStrength(result);
    return result;
  }, []);

  return {
    strength,
    evaluatePassword
  };
}

// CSRF protection hook
export function useCSRFProtection() {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Get CSRF token from meta tag or fetch from server
    const metaToken = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (metaToken?.content) {
      setCsrfToken(metaToken.content);
    } else {
      // Fetch token from server
      fetch('/api/csrf-token')
        .then(res => res.json())
        .then(data => setCsrfToken(data.token))
        .catch(console.error);
    }
  }, []);

  const addCSRFHeader = useCallback((headers: HeadersInit = {}): HeadersInit => {
    if (!csrfToken) return headers;
    
    return {
      ...headers,
      'X-CSRF-Token': csrfToken
    };
  }, [csrfToken]);

  const validateCSRF = useCallback((token: string): boolean => {
    return token === csrfToken;
  }, [csrfToken]);

  return {
    csrfToken,
    addCSRFHeader,
    validateCSRF
  };
}

// Session security monitoring
export function useSessionSecurity() {
  const [sessionInfo, setSessionInfo] = useState({
    isValid: true,
    expiresAt: null as Date | null,
    lastActivity: new Date(),
    warningShown: false
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Monitor session activity
    const handleActivity = () => {
      setSessionInfo(prev => ({
        ...prev,
        lastActivity: new Date(),
        warningShown: false
      }));
    };

    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session validity periodically
    const sessionCheck = setInterval(() => {
      fetch('/api/auth/session-check')
        .then(res => res.json())
        .then(data => {
          if (!data.valid) {
            setSessionInfo(prev => ({ ...prev, isValid: false }));
            toast({
              title: 'Session Expired',
              description: 'Please log in again to continue.',
              variant: 'destructive'
            });
            // Redirect to login
            setLocation('/login');
          } else {
            const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
            const now = new Date();
            
            // Show warning 5 minutes before expiration
            if (expiresAt && !sessionInfo.warningShown) {
              const timeToExpiry = expiresAt.getTime() - now.getTime();
              if (timeToExpiry < 5 * 60 * 1000 && timeToExpiry > 0) {
                setSessionInfo(prev => ({ ...prev, warningShown: true }));
                toast({
                  title: 'Session Expiring Soon',
                  description: 'Your session will expire in 5 minutes. Save your work.',
                  duration: 10000
                });
              }
            }
            
            setSessionInfo(prev => ({
              ...prev,
              isValid: true,
              expiresAt
            }));
          }
        })
        .catch(console.error);
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionCheck);
    };
  }, [sessionInfo.warningShown, toast, setLocation]);

  const extendSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSessionInfo(prev => ({
          ...prev,
          expiresAt: new Date(data.expiresAt),
          warningShown: false
        }));
        toast({
          title: 'Session Extended',
          description: 'Your session has been extended successfully.'
        });
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }, [toast]);

  return {
    sessionInfo,
    extendSession
  };
}

// Content Security Policy violation monitoring
export function useCSPMonitoring() {
  const { logSecurityEvent } = useSecurityMonitoring();

  useEffect(() => {
    const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
      logSecurityEvent({
        type: 'csrf_attempt',
        severity: 'high',
        message: `CSP violation: ${e.violatedDirective}`,
        details: {
          blockedURI: e.blockedURI,
          documentURI: e.documentURI,
          violatedDirective: e.violatedDirective,
          originalPolicy: e.originalPolicy
        }
      });
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, [logSecurityEvent]);
}

export default {
  useSecurityMonitoring,
  useRateLimit,
  useInputSanitizer,
  usePasswordStrength,
  useCSRFProtection,
  useSessionSecurity,
  useCSPMonitoring
};