import logger from './logger';

export interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  OPENAI_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  REPLIT_DOMAINS?: string;
  ISSUER_URL?: string;
  REPL_ID?: string;
}

interface EnvValidationRule {
  key: string;
  required: boolean;
  default?: string;
  validator?: (value: string) => boolean;
  description: string;
}

const envRules: EnvValidationRule[] = [
  {
    key: 'NODE_ENV',
    required: true,
    default: 'development',
    validator: (v) => ['development', 'production', 'test'].includes(v),
    description: 'Application environment'
  },
  {
    key: 'PORT',
    required: false,
    default: '5000',
    validator: (v) => !isNaN(parseInt(v)) && parseInt(v) > 0 && parseInt(v) < 65536,
    description: 'Server port number'
  },
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string'
  },
  {
    key: 'SESSION_SECRET',
    required: true,
    default: 'development-secret-change-in-production',
    validator: (v) => v.length >= 32 || process.env.NODE_ENV !== 'production',
    description: 'Secret for session encryption (min 32 chars in production)'
  },
  {
    key: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe API secret key for payment processing'
  },
  {
    key: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features'
  },
  {
    key: 'SENDGRID_API_KEY',
    required: false,
    description: 'SendGrid API key for email delivery'
  }
];

export function validateAndNormalizeEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Record<string, string> = {};

  for (const rule of envRules) {
    const value = process.env[rule.key];

    // Handle missing values
    if (!value) {
      if (rule.required) {
        if (rule.default) {
          config[rule.key] = rule.default;
          warnings.push(`${rule.key} not set, using default: ${rule.default}`);
        } else {
          errors.push(`${rule.key} is required but not set - ${rule.description}`);
        }
      } else {
        warnings.push(`${rule.key} not set (optional) - ${rule.description}`);
      }
      continue;
    }

    // Validate value
    if (rule.validator && !rule.validator(value)) {
      errors.push(`${rule.key} has invalid value - ${rule.description}`);
      continue;
    }

    config[rule.key] = value;
  }

  // Log results
  if (warnings.length > 0) {
    logger.warn('Environment configuration warnings', {
      warnings,
      nodeEnv: config.NODE_ENV || 'development'
    });
  }

  if (errors.length > 0) {
    logger.error('Environment validation failed', {
      errors,
      criticalMissing: errors.filter(e => e.includes('required')).length
    });
    
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
    
    // In development, log but continue
    logger.warn('Continuing with invalid environment (development mode only)');
  }

  logger.info('Environment validated', {
    nodeEnv: config.NODE_ENV || 'development',
    configuredKeys: Object.keys(config).length,
    warnings: warnings.length,
    errors: errors.length
  });

  return config as unknown as EnvConfig;
}

// Production deployment checklist
export function productionReadinessCheck(): {
  ready: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to production');
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    issues.push('SESSION_SECRET must be at least 32 characters in production');
  }

  if (process.env.SESSION_SECRET === 'development-secret-change-in-production') {
    issues.push('SESSION_SECRET is still using default development value');
  }

  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL is required');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY not set - payment features will be disabled');
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - AI features will be limited');
  }

  return {
    ready: issues.length === 0,
    issues,
    warnings
  };
}
