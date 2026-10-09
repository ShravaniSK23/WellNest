import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { UserService } from '../services/user.service.js';

export class UserController {
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await UserService.getUserProfile(req.user!.userId);
      res.status(200).json({ user: profile });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await UserService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({ message: 'Profile updated successfully', user: profile });
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await UserService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deleteAccount(req.user!.userId);
      res.clearCookie('token');
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
