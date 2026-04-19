import dotenv from 'dotenv'

dotenv.config()

const KNOWN_WEAK_SECRETS = new Set([
  'geo-secret',
  'geo-production-secret-change-me',
  'your-secret-key-change-in-production',
  'change-me',
  'secret',
])

function readJwtSecret(): string {
  const value = process.env.JWT_SECRET?.trim()
  const isProduction = process.env.NODE_ENV === 'production'

  if (!value) {
    if (isProduction) {
      throw new Error('JWT_SECRET is required in production')
    }
    // eslint-disable-next-line no-console
    console.warn('[config] JWT_SECRET not set — using a dev-only fallback. Do NOT use in production.')
    return 'dev-only-insecure-secret-do-not-use-in-prod'
  }

  if (isProduction && (value.length < 32 || KNOWN_WEAK_SECRETS.has(value))) {
    throw new Error(
      'JWT_SECRET is too weak for production: must be at least 32 chars and not a known default.'
    )
  }
  return value
}

function readOrigins(): string[] | true {
  const raw = (process.env.CORS_ORIGIN || '').trim()
  if (!raw || raw === '*') return true
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3001', 10),
  jwt: {
    secret: readJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: readOrigins(),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    enabled: process.env.REDIS_ENABLED !== 'false',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
}
