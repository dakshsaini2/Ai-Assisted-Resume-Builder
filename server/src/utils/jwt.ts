import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types/express.d';
import { ApiError } from './ApiError';

export interface ExportTokenPayload {
  userId: string;
  resumeId: string;
  purpose: 'pdf-render';
}

export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

/**
 * Sign a single-purpose, short-lived (60 seconds) HMAC token for headless PDF rendering.
 */
export const signExportToken = (payload: { userId: string; resumeId: string }): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      resumeId: payload.resumeId,
      purpose: 'pdf-render',
    },
    config.jwt.secret,
    { expiresIn: '60s' }
  );
};

/**
 * Verify a short-lived PDF export token.
 * Throws ApiError 401 if expired, invalid, or purpose does not match 'pdf-render'.
 */
export const verifyExportToken = (token: string): ExportTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ExportTokenPayload;
    if (decoded.purpose !== 'pdf-render' || !decoded.resumeId || !decoded.userId) {
      throw ApiError.unauthorized('Invalid token purpose or payload.');
    }
    return decoded;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Export token has expired. Please try again.');
    }
    throw ApiError.unauthorized('Invalid export token.');
  }
};

