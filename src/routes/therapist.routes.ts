import { Router } from 'express';
import { TherapistController } from '../controllers/therapist.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

// 1. Static Public & Protected Routes (MUST come before /:id routes)
router.get('/', TherapistController.searchTherapists);
router.get('/pending-verifications', requireAuth, requireRole('ADMIN'), TherapistController.getPendingVerifications);
router.post('/slots', requireAuth, requireRole('THERAPIST'), TherapistController.createAvailabilitySlot);
router.post('/credentials', requireAuth, requireRole('THERAPIST'), TherapistController.submitCredentials);

// 2. Parameterized Routes (/:id)
router.get('/:id', TherapistController.getTherapistProfile);
router.get('/:id/slots', TherapistController.getTherapistSlots);
router.post('/:id/verify', requireAuth, requireRole('ADMIN'), TherapistController.verifyTherapist);

export const therapistRouter = router;
