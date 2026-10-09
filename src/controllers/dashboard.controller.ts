import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  public static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rangeDays = parseInt(req.query.rangeDays as string, 10) || 30;
      const summary = await DashboardService.getSummary(req.user!.userId, rangeDays);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  public static async getWeeklyReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await DashboardService.generateWeeklyReport(req.user!.userId);
      res.status(200).json({ report });
    } catch (error) {
      next(error);
    }
  }

  public static async downloadReportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await DashboardService.generateReportPdfBuffer(req.user!.userId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=WellNest_Wellness_Report.pdf');
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
