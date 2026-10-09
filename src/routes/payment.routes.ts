import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

// Webhook endpoint (Public, Idempotent)
router.post('/webhook', PaymentController.handleWebhook);

export const paymentRouter = router;
