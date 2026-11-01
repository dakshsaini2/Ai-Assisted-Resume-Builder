import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function parseTimeoutMs(val: string | undefined, defaultVal: number = 60000): number {
  if (!val || typeof val !== 'string' || val.trim() === '') {
    return defaultVal;
  }
  const parsed = parseInt(val.trim(), 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1000 || parsed > 300000) {
    return defaultVal;
  }
  return parsed;
}

export const INSECURE_JWT_SECRETS = new Set([
  'fallback-secret-do-not-use',
  'your-jwt-secret-change-this-in-production',
  'secret',
  'changeme',
  '123456',
  'password',
  'jwt-secret',
]);

export function validateJwtSecret(secret: string | undefined, nodeEnv: string): string {
  const isProduction = nodeEnv === 'production';
  const trimmed = secret?.trim();

  if (!trimmed) {
    if (isProduction) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is missing or empty in production mode. Refusing to start.'
      );
    }
    return 'dev-only-insecure-jwt-secret-do-not-use-in-production';
  }

  if (isProduction) {
    if (INSECURE_JWT_SECRETS.has(trimmed.toLowerCase()) || trimmed.length < 16) {
      throw new Error(
        'FATAL: JWT_SECRET uses a known weak fallback or is too short (<16 chars) in production mode. Refusing to start.'
      );
    }
  }

  return trimmed;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = validateJwtSecret(process.env.JWT_SECRET, nodeEnv);

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timeoutMs: parseTimeoutMs(process.env.GEMINI_TIMEOUT_MS, 60000),
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
