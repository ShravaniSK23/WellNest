import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/audit-logs', requireAuth, requireRole('ADMIN'), AuditController.getAuditLogs);

export const auditRouter = router;
