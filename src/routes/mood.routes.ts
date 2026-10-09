import { Router } from 'express';
import { MoodController } from '../controllers/mood.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('HELP_SEEKER'));

router.post('/', MoodController.recordMood);
router.get('/today', MoodController.getTodayMood);
router.get('/streak', MoodController.getStreak);

export const moodRouter = router;
