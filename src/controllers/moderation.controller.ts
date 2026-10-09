import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ModerationService } from '../services/moderation.service.js';

export class ModerationController {
  public static async getModerationQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const queue = await ModerationService.getModerationQueue();
      res.status(200).json(queue);
    } catch (error) {
      next(error);
    }
  }

  public static async executeAction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ModerationService.executeAction(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
