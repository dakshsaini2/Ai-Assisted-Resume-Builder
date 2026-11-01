import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types/express.d';

export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};
