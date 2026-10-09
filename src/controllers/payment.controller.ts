import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';

export class PaymentController {
  public static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = (req.headers['x-webhook-event-id'] as string) || req.body.id || `evt_${Date.now()}`;
      const eventType = req.body.type || 'payment_intent.succeeded';
      const result = await paymentService.processWebhookEvent(eventId, eventType, req.body.data?.object || req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
