import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../db/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing or malformed', 'NO_TOKEN');
    }

    const payload = verifyToken(token);

    // Validate active session and 30-minute inactivity limit (REQ-UA-14)
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.isRevoked) {
      throw new UnauthorizedError('Session invalid or revoked. Please log in again.', 'SESSION_REVOKED');
    }

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const timeSinceLastActivity = Date.now() - session.lastActivityAt.getTime();

    if (timeSinceLastActivity > INACTIVITY_TIMEOUT_MS) {
      // Mark session revoked due to 30m inactivity
      await prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedError('Session timed out after 30 minutes of inactivity. Please re-authenticate.', 'SESSION_TIMEOUT');
    }

    // Update last activity timestamp to slide inactivity window
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired authentication token', 'INVALID_TOKEN'));
    }
  }
};
