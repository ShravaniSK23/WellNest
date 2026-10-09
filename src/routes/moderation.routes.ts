import { Router } from 'express';
import { ModerationController } from '../controllers/moderation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('MODERATOR', 'ADMIN'));

router.get('/queue', ModerationController.getModerationQueue);
router.post('/actions', ModerationController.executeAction);

export const moderationRouter = router;
