import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  role: string;
  sessionId: string;
  isMfaVerified: boolean;
}

export const generateToken = (payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as jwt.Secret | any });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const generateMfaPendingToken = (userId: string, role: string, sessionId: string): string => {
  return jwt.sign(
    { userId, role, sessionId, isMfaVerified: false, isMfaPending: true },
    env.JWT_SECRET,
    { expiresIn: '5m' }
  );
};
