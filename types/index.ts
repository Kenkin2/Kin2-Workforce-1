// Core application types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client' | 'worker';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  logo?: string;
  website?: string;
  address: Address;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  workWeekDays: number[];
  defaultShiftLength: number;
  overtimeThreshold: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    shifts: boolean;
    timesheets: boolean;
    payments: boolean;
    announcements: boolean;
  };
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'daily' | 'monthly' | 'yearly';
  };
  requirements: string[];
  benefits: string[];
  skills: string[];
  status: 'draft' | 'active' | 'closed' | 'archived';
  organizationId: string;
  createdBy: string;
  postedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  jobId: string;
  workerId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number;
  location: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timesheet {
  id: string;
  workerId: string;
  jobId: string;
  shiftId?: string;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  breakDuration: number;
  totalHours: number;
  overtimeHours: number;
  hourlyRate: number;
  totalPay: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  description?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  workerId: string;
  organizationId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'check' | 'cash' | 'cryptocurrency';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  timesheetIds: string[];
  period: {
    start: Date;
    end: Date;
  };
  processedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  content: CourseContent[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  category: string;
  tags: string[];
  isPublished: boolean;
  prerequisiteIds: string[];
  certificateTemplate?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseContent {
  id: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'document';
  title: string;
  content: string;
  duration?: number; // minutes
  order: number;
  isRequired: boolean;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

export type ActivityType = 
  | 'shift_assigned'
  | 'shift_completed'
  | 'timesheet_submitted'
  | 'timesheet_approved'
  | 'payment_processed'
  | 'course_completed'
  | 'certificate_earned'
  | 'announcement'
  | 'system_update';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Query parameters
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Security types
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

// Form types
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touched: Record<string, boolean>;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// UI Component types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface ButtonProps extends ComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends ComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Navigation types
export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  permission?: string;
  badge?: string | number;
}

export interface NavigationState {
  currentPath: string;
  breadcrumbs: Breadcrumb[];
  isLoading: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

// Theme types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
  };
  fonts: {
    sans: string[];
    mono: string[];
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

// PWA types
export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  installPrompt: any;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Event types
export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
}

// Feature flag types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'email' | 'role' | 'organization' | 'percentage';
  operator: 'equals' | 'contains' | 'in' | 'percentage';
  value: any;
}

// Export all types (optional - files can be imported directly)