import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { MoodService } from '../services/mood.service.js';

export class MoodController {
  public static async recordMood(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await MoodService.recordMood(req.user!.userId, req.body);
      const statusCode = result.isEdit ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getTodayMood(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await MoodService.getTodayMood(req.user!.userId, dateStr);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getStreak(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const streak = await MoodService.getStreak(req.user!.userId);
      res.status(200).json({ streak });
    } catch (error) {
      next(error);
    }
  }
}
