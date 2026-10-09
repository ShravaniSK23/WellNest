import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

export const generateMfaSecret = (userEmail: string) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(userEmail, env.MFA_ISSUER, secret);
  return { secret, otpauthUrl };
};

export const generateQrCode = async (otpauthUrl: string): Promise<string> => {
  return QRCode.toDataURL(otpauthUrl);
};

export const verifyMfaCode = (token: string, secret: string): boolean => {
  return authenticator.verify({ token, secret });
};
