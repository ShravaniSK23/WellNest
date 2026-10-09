import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth);

// Booking Request
router.post('/request', requireRole('HELP_SEEKER'), AppointmentController.submitBookingRequest);

// Confirm / Decline (Therapist Actions)
router.post('/:id/confirm', requireRole('THERAPIST'), AppointmentController.confirmAppointment);
router.post('/:id/decline', requireRole('THERAPIST'), AppointmentController.declineAppointment);

// Reschedule / Cancel
router.post('/:id/reschedule', requireRole('HELP_SEEKER'), AppointmentController.rescheduleAppointment);
router.post('/:id/cancel', AppointmentController.cancelAppointment);

// WebRTC Video Token
router.get('/:id/video-token', AppointmentController.getVideoToken);

export const appointmentRouter = router;
