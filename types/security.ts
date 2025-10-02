// Security-related types
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'permission_change'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_attempt'
  | 'xss_attempt'
  | 'data_export'
  | 'data_import';

export interface CSRFToken {
  value: string;
  expiresAt: Date;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}