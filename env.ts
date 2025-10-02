import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('8080'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8080'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['debug','info','warn','error']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  API_BASE_URL: z.string().optional(),
  PUBLIC_URL: z.string().optional()
})

export type Env = z.infer<typeof envSchema>
export const env: Env = envSchema.parse(process.env)
