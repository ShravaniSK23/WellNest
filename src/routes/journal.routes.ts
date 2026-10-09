import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('HELP_SEEKER'));

router.post('/', JournalController.createEntry);
router.get('/', JournalController.getEntries);
router.delete('/:id', JournalController.deleteEntry);

export const journalRouter = router;
