import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { JournalService } from '../services/journal.service.js';

export class JournalController {
  public static async createEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await JournalService.createEntry(req.user!.userId, req.body);
      res.status(201).json({ journalEntry: entry });
    } catch (error) {
      next(error);
    }
  }

  public static async getEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entries = await JournalService.getEntries(req.user!.userId);
      res.status(200).json({ journalEntries: entries });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await JournalService.deleteEntry(req.user!.userId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
