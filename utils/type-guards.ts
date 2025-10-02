// Type guard utilities for better type safety
import { User, Organization, Job, Shift, Timesheet, Payment, Course, Activity } from '@/types';

// User type guards
export const isUser = (obj: any): obj is User => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    ['admin', 'client', 'worker'].includes(obj.role) &&
    typeof obj.isActive === 'boolean'
  );
};

export const isAdmin = (user: User): boolean => {
  return user.role === 'admin';
};

export const isClient = (user: User): boolean => {
  return user.role === 'client';
};

export const isWorker = (user: User): boolean => {
  return user.role === 'worker';
};

// Organization type guards
export const isOrganization = (obj: any): obj is Organization => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.industry === 'string' &&
    ['small', 'medium', 'large', 'enterprise'].includes(obj.size)
  );
};

// Job type guards
export const isJob = (obj: any): obj is Job => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.location === 'string' &&
    ['full-time', 'part-time', 'contract', 'temporary'].includes(obj.employmentType) &&
    ['entry', 'mid', 'senior', 'executive'].includes(obj.experienceLevel) &&
    ['draft', 'active', 'closed', 'archived'].includes(obj.status)
  );
};

export const isActiveJob = (job: Job): boolean => {
  return job.status === 'active';
};

export const isPublishedJob = (job: Job): boolean => {
  return job.status === 'active' && job.postedAt !== undefined;
};

// Shift type guards
export const isShift = (obj: any): obj is Shift => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.jobId === 'string' &&
    obj.date instanceof Date &&
    typeof obj.startTime === 'string' &&
    typeof obj.endTime === 'string' &&
    ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(obj.status)
  );
};

export const isUpcomingShift = (shift: Shift): boolean => {
  const now = new Date();
  return shift.date > now && ['scheduled', 'confirmed'].includes(shift.status);
};

export const isActiveShift = (shift: Shift): boolean => {
  return shift.status === 'in-progress';
};

// Timesheet type guards
export const isTimesheet = (obj: any): obj is Timesheet => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.workerId === 'string' &&
    typeof obj.jobId === 'string' &&
    obj.date instanceof Date &&
    obj.clockIn instanceof Date &&
    typeof obj.totalHours === 'number' &&
    ['draft', 'submitted', 'approved', 'rejected', 'paid'].includes(obj.status)
  );
};

export const isPendingTimesheet = (timesheet: Timesheet): boolean => {
  return timesheet.status === 'submitted';
};

export const isApprovedTimesheet = (timesheet: Timesheet): boolean => {
  return timesheet.status === 'approved';
};

// Payment type guards
export const isPayment = (obj: any): obj is Payment => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.workerId === 'string' &&
    typeof obj.organizationId === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.currency === 'string' &&
    ['bank_transfer', 'check', 'cash', 'cryptocurrency'].includes(obj.method) &&
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(obj.status)
  );
};

export const isPendingPayment = (payment: Payment): boolean => {
  return ['pending', 'processing'].includes(payment.status);
};

export const isCompletedPayment = (payment: Payment): boolean => {
  return payment.status === 'completed';
};

// Course type guards
export const isCourse = (obj: any): obj is Course => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.content) &&
    ['beginner', 'intermediate', 'advanced'].includes(obj.difficulty) &&
    typeof obj.estimatedDuration === 'number' &&
    typeof obj.isPublished === 'boolean'
  );
};

export const isPublishedCourse = (course: Course): boolean => {
  return course.isPublished;
};

// Activity type guards
export const isActivity = (obj: any): obj is Activity => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.title === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.read === 'boolean'
  );
};

export const isUnreadActivity = (activity: Activity): boolean => {
  return !activity.read;
};

// Generic array type guards
export const isArrayOf = <T>(
  array: unknown,
  guard: (item: unknown) => item is T
): array is T[] => {
  return Array.isArray(array) && array.every(guard);
};

// Utility type guards
export const isNonEmpty = <T>(array: T[]): array is [T, ...T[]] => {
  return array.length > 0;
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

// Form validation type guards
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Permission type guards
export const hasPermission = (user: User, permission: string): boolean => {
  // Basic role-based permissions
  const adminPermissions = ['*'];
  const clientPermissions = [
    'jobs:read', 'jobs:write', 'jobs:delete',
    'shifts:read', 'shifts:write', 'shifts:delete',
    'timesheets:read', 'timesheets:approve',
    'payments:read', 'payments:write',
    'reports:read', 'users:read'
  ];
  const workerPermissions = [
    'jobs:read', 'shifts:read', 'timesheets:read', 'timesheets:write',
    'courses:read', 'profile:read', 'profile:write'
  ];

  const userPermissions = 
    user.role === 'admin' ? adminPermissions :
    user.role === 'client' ? clientPermissions :
    workerPermissions;

  return userPermissions.includes('*') || userPermissions.includes(permission);
};

// API response type guards
export const isApiSuccess = <T>(response: any): response is { success: true; data: T } => {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === true &&
    'data' in response
  );
};

export const isApiError = (response: any): response is { success: false; error: any } => {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === false &&
    'error' in response
  );
};

export default {
  isUser,
  isAdmin,
  isClient,
  isWorker,
  isOrganization,
  isJob,
  isActiveJob,
  isPublishedJob,
  isShift,
  isUpcomingShift,
  isActiveShift,
  isTimesheet,
  isPendingTimesheet,
  isApprovedTimesheet,
  isPayment,
  isPendingPayment,
  isCompletedPayment,
  isCourse,
  isPublishedCourse,
  isActivity,
  isUnreadActivity,
  isArrayOf,
  isNonEmpty,
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isDate,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  hasPermission,
  isApiSuccess,
  isApiError
};