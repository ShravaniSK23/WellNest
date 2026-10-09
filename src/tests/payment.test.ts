import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { MockPaymentService } from '../services/payment.service.js';

describe('Payment & Webhook Idempotency Baseline', () => {
  it('should enforce payment guard: capture fails if payment status is not AUTHORIZED', async () => {
    const paymentService = new MockPaymentService();

    // Create authorization hold
    const hold = await paymentService.createAuthorizationHold('apt-101', 100.0);
    expect(hold.status).toBe('AUTHORIZED');

    // Capture payment
    const captured = await paymentService.capturePayment(hold.paymentId);
    expect(captured.status).toBe('CAPTURED');

    // Attempting to capture already captured payment throws error
    await expect(paymentService.capturePayment(hold.paymentId)).rejects.toThrow('Must be AUTHORIZED');
  });

  it('should execute full refund on therapist cancellation', async () => {
    const paymentService = new MockPaymentService();
    const hold = await paymentService.createAuthorizationHold('apt-102', 120.0);
    await paymentService.capturePayment(hold.paymentId);

    const refunded = await paymentService.refundPayment(hold.paymentId);
    expect(refunded.status).toBe('REFUNDED');
  });

  it('should process payment webhook idempotently without duplicating events', async () => {
    const eventId = 'evt_test_12345';

    // First webhook delivery
    const res1 = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-webhook-event-id', eventId)
      .send({ type: 'payment_intent.succeeded', data: { object: { paymentId: 'pay-dummy' } } });

    expect(res1.status).toBe(200);
    expect(res1.body.processed).toBe(true);
    expect(res1.body.idempotent).toBe(false);

    // Second duplicate webhook delivery
    const res2 = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-webhook-event-id', eventId)
      .send({ type: 'payment_intent.succeeded', data: { object: { paymentId: 'pay-dummy' } } });

    expect(res2.status).toBe(200);
    expect(res2.body.processed).toBe(true);
    expect(res2.body.idempotent).toBe(true); // Idempotent check succeeded!
  });
});
