import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('HELP_SEEKER'));

router.get('/summary', DashboardController.getSummary);
router.get('/reports/weekly', DashboardController.getWeeklyReport);
router.get('/reports/weekly/pdf', DashboardController.downloadReportPdf);

export const dashboardRouter = router;
