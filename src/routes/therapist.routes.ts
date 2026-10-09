import { Router } from 'express';
import { TherapistController } from '../controllers/therapist.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

// Credential submission for Therapists
router.post('/credentials', requireAuth, requireRole('THERAPIST'), TherapistController.submitCredentials);

// Admin-only verification endpoints
router.get('/pending-verifications', requireAuth, requireRole('ADMIN'), TherapistController.getPendingVerifications);
router.post('/:id/verify', requireAuth, requireRole('ADMIN'), TherapistController.verifyTherapist);

export const therapistRouter = router;
