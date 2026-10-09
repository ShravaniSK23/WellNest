import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');
      const result = await AuthService.login(email, password, ipAddress, userAgent);

      if (result.token) {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 60 * 1000,
        });
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async setupMfa(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.setupMfa(req.user!.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async verifyMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, sessionId, mfaCode } = req.body;
      const result = await AuthService.verifyMfaAndLogin(userId, sessionId, mfaCode);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.sessionId) {
        await AuthService.logout(req.user.sessionId);
      }
      res.clearCookie('token');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
