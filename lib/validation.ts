import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

// Base validation schemas with enhanced security
export const SecuritySchemas = {
  // Base text without transform/refine (for chaining)
  baseText: z.string(),
  
  // Sanitized text input (prevents XSS)
  sanitizedText: z.string()
    .min(1, 'This field is required')
    .max(1000, 'Text too long (max 1000 characters)')
    .transform((str) => str.trim())
    .refine((str) => !/<script|javascript:|on\w+=/i.test(str), {
      message: 'Invalid characters detected'
    }),

  // Base HTML without transform/refine (for chaining)
  baseHtml: z.string(),

  // Safe HTML content (for rich text)
  safeHtml: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content too long (max 5000 characters)')
    .transform((str) => str.trim())
    .refine((str) => {
      // Allow only safe HTML tags
      const allowedTags = /<\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote)(?:\s[^>]*)?>/gi;
      const cleanedStr = str.replace(allowedTags, '');
      return !/<|>/.test(cleanedStr);
    }, {
      message: 'Invalid HTML content detected'
    }),

  // Secure email validation
  email: z.string()
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .email('Please enter a valid email address')
    .transform((str) => str.toLowerCase().trim()),

  // Strong password requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .refine((str) => /[A-Z]/.test(str), {
      message: 'Password must contain at least one uppercase letter'
    })
    .refine((str) => /[a-z]/.test(str), {
      message: 'Password must contain at least one lowercase letter'  
    })
    .refine((str) => /\d/.test(str), {
      message: 'Password must contain at least one number'
    })
    .refine((str) => /[!@#$%^&*(),.?":{}|<>]/.test(str), {
      message: 'Password must contain at least one special character'
    }),

  // Secure phone number
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .transform((str) => str.replace(/\D/g, '')),

  // File upload validation
  file: z.object({
    name: z.string().refine((name) => {
      const allowedExtensions = /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i;
      return allowedExtensions.test(name);
    }, 'File type not allowed'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().refine((type) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return allowedTypes.includes(type);
    }, 'File type not supported')
  }),

  // URL validation with security checks
  url: z.string()
    .url('Please enter a valid URL')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Block dangerous protocols
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'Invalid or unsafe URL'),

  // Numeric inputs with bounds
  positiveInteger: z.number()
    .int('Must be a whole number')
    .positive('Must be a positive number')
    .max(2147483647, 'Number too large'),

  // Currency validation
  currency: z.number()
    .multipleOf(0.01, 'Amount must have at most 2 decimal places')
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),

  // Date validation
  date: z.string()
    .datetime('Invalid date format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const maxFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
      return parsed >= new Date('1900-01-01') && parsed <= maxFuture;
    }, 'Date must be between 1900 and 10 years from now'),

  // Search query with XSS protection
  searchQuery: z.string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query too long')
    .transform((str) => str.trim())
    .refine((str) => !/[<>'"`;]/.test(str), {
      message: 'Invalid characters in search query'
    })
};

// Form-specific validation schemas
export const FormSchemas = {
  // User registration
  userRegistration: z.object({
    firstName: SecuritySchemas.baseText
      .min(1, 'First name is required')
      .max(50, 'First name too long'),
    lastName: SecuritySchemas.baseText
      .min(1, 'Last name is required')
      .max(50, 'Last name too long'),
    email: SecuritySchemas.email,
    password: SecuritySchemas.password,
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }),

  // Job posting
  jobPosting: z.object({
    title: SecuritySchemas.baseText
      .min(5, 'Job title must be at least 5 characters')
      .max(100, 'Job title too long'),
    description: SecuritySchemas.baseHtml
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description too long'),
    location: SecuritySchemas.baseText
      .min(1, 'Location is required')
      .max(100, 'Location too long'),
    salary: SecuritySchemas.currency.optional(),
    requirements: z.array(SecuritySchemas.baseText).max(20, 'Too many requirements'),
    benefits: z.array(SecuritySchemas.baseText).max(15, 'Too many benefits'),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary']),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive'])
  }),

  // Timesheet entry
  timesheetEntry: z.object({
    date: SecuritySchemas.date,
    clockIn: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    clockOut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    breakDuration: z.number().min(0).max(480, 'Break cannot exceed 8 hours'),
    description: SecuritySchemas.baseText.max(500, 'Description too long'),
    jobId: z.string().uuid('Invalid job ID')
  }).refine((data) => {
    const clockIn = new Date(`2000-01-01T${data.clockIn}`);
    const clockOut = new Date(`2000-01-01T${data.clockOut}`);
    return clockOut > clockIn;
  }, {
    message: 'Clock out time must be after clock in time',
    path: ['clockOut']
  }),

  // Contact form
  contactForm: z.object({
    name: SecuritySchemas.baseText
      .min(1, 'Name is required')
      .max(100, 'Name too long'),
    email: SecuritySchemas.email,
    subject: SecuritySchemas.baseText
      .min(1, 'Subject is required')
      .max(200, 'Subject too long'),
    message: SecuritySchemas.baseText
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message too long'),
    honeypot: z.string().max(0, 'Spam detected') // Anti-bot field
  }),

  // File upload
  fileUpload: z.object({
    files: z.array(SecuritySchemas.file).min(1, 'At least one file required').max(5, 'Too many files'),
    category: z.enum(['document', 'image', 'certificate', 'other']),
    description: SecuritySchemas.baseText.max(200, 'Description too long').optional()
  })
};

// Rate limiting schemas
export const RateLimitSchemas = {
  api: z.object({
    endpoint: z.string(),
    userId: z.string().optional(),
    ip: z.string().ip(),
    timestamp: z.number(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  }),

  login: z.object({
    email: SecuritySchemas.email,
    attempts: z.number().max(5, 'Too many login attempts'),
    lastAttempt: z.number()
  })
};

// Validation helper functions
export const ValidationHelpers = {
  // Sanitize input to prevent XSS
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Validate and sanitize HTML
  sanitizeHtml: (html: string): string => {
    // This is a basic implementation - in production, use a library like DOMPurify
    const allowedTags = /<\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote)(?:\s[^>]*)?>/gi;
    return html.replace(/<script.*?<\/script>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+=/gi, '');
  },

  // Check password strength
  checkPasswordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    if (password.length >= 12) score += 1;

    return { score, feedback };
  },

  // Validate file safely
  validateFile: (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        resolve({ valid: false, error: 'File too large (max 10MB)' });
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        resolve({ valid: false, error: 'File type not allowed' });
        return;
      }

      // Basic file content validation (check magic numbers)
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        const header = Array.from(arr.slice(0, 4))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Check for common file signatures
        const signatures: Record<string, string[]> = {
          'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
          'image/png': ['89504e47'],
          'application/pdf': ['25504446'],
          'text/plain': [] // Skip validation for text files
        };

        const expectedSignatures = signatures[file.type];
        if (expectedSignatures && expectedSignatures.length > 0) {
          const isValid = expectedSignatures.some(sig => header.startsWith(sig));
          if (!isValid) {
            resolve({ valid: false, error: 'File content does not match file type' });
            return;
          }
        }

        resolve({ valid: true });
      };

      reader.onerror = () => {
        resolve({ valid: false, error: 'Could not read file' });
      };

      reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB for header check
    });
  }
};

// Security middleware for forms
export const useSecureForm = <T extends z.ZodType>(schema: T) => {
  const validate = (data: unknown) => {
    try {
      const result = schema.parse(data);
      return { success: true as const, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        toast({
          title: 'Validation Error',
          description: `Please check the following fields: ${errorMessages.map(e => e.field).join(', ')}`,
          variant: 'destructive'
        });

        return { success: false as const, errors: errorMessages };
      }
      
      toast({
        title: 'Validation Error',
        description: 'An unexpected error occurred during validation',
        variant: 'destructive'
      });

      return { success: false as const, errors: [{ field: 'unknown', message: 'Validation failed' }] };
    }
  };

  return { validate };
};

// CSRF token helpers
export const CSRFHelpers = {
  getToken: (): string => {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return meta?.content || '';
  },

  validateToken: (token: string): boolean => {
    const expectedToken = CSRFHelpers.getToken();
    return Boolean(expectedToken && token === expectedToken);
  },

  addTokenToHeaders: (headers: HeadersInit = {}): HeadersInit => {
    const token = CSRFHelpers.getToken();
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
};

export default {
  SecuritySchemas,
  FormSchemas,
  RateLimitSchemas,
  ValidationHelpers,
  useSecureForm,
  CSRFHelpers
};