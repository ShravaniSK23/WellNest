import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';

export class PaymentController {
  public static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const rawBody = (req as any).rawBody || req.body;
      const signature = req.headers['stripe-signature'] as string | undefined;
      const eventId = (req.headers['x-webhook-event-id'] as string) || req.body?.id || `evt_${Date.now()}`;
      const eventType = req.body?.type || 'payment_intent.succeeded';
      const result = await paymentService.processWebhookEvent(
        eventId,
        eventType,
        req.body?.data?.object || req.body,
        rawBody,
        signature
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
