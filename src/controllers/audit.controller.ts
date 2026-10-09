import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

export class AuditController {
  public static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await AuditService.getAuditLogs(page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
