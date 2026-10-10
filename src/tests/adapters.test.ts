import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripePaymentService } from '../services/payment.service.js';
import { DailyVideoService } from '../services/video.service.js';

let mockAppointmentStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
let mockAppointmentStatus = 'CONFIRMED';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    appointment: {
      findUnique: vi.fn(async () => ({
        id: 'apt-daily-101',
        status: mockAppointmentStatus,
        startTime: mockAppointmentStartTime,
        endTime: new Date(mockAppointmentStartTime.getTime() + 60 * 60 * 1000),
        helpSeeker: { userId: 'u-daily-seeker', fullName: 'Alice Seeker' },
        therapist: { userId: 'u-daily-therapist', fullName: 'Dr. Bob' },
      })),
    },
  },
}));

describe('Stripe & Daily Provider Adapters', () => {
  describe('StripePaymentService', () => {
    it('should create authorization hold via Stripe PaymentIntents in manual capture mode', async () => {
      const stripeService = new StripePaymentService('sk_test_mock', 'whsec_mock');
      // Mock stripe paymentIntents.create
      (stripeService as any).stripe.paymentIntents.create = vi.fn().mockResolvedValue({
        id: 'pi_test_hold_123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_capture',
      });

      const record = await stripeService.createAuthorizationHold('apt-stripe-1', 100.0, 'USD');

      expect(record.paymentId).toBe('pi_test_hold_123');
      expect(record.status).toBe('AUTHORIZED');
      expect(record.amount).toBe(100.0);
      expect((stripeService as any).stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        capture_method: 'manual',
        payment_method: 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: { appointmentId: 'apt-stripe-1' },
      });
    });

    it('should capture payment only after confirmation', async () => {
      const stripeService = new StripePaymentService('sk_test_mock', 'whsec_mock');
      (stripeService as any).stripe.paymentIntents.retrieve = vi.fn().mockResolvedValue({
        id: 'pi_test_hold_123',
        status: 'requires_capture',
      });
      (stripeService as any).stripe.paymentIntents.capture = vi.fn().mockResolvedValue({
        id: 'pi_test_hold_123',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        latest_charge: 'ch_test_charge_123',
        created: Math.floor(Date.now() / 1000),
        metadata: { appointmentId: 'apt-stripe-1' },
      });

      const captured = await stripeService.capturePayment('pi_test_hold_123');
      expect(captured.status).toBe('CAPTURED');
      expect(captured.providerTransactionId).toBe('ch_test_charge_123');
    });

    it('should refund payment on decline or cancellation', async () => {
      const stripeService = new StripePaymentService('sk_test_mock', 'whsec_mock');
      (stripeService as any).stripe.paymentIntents.retrieve = vi.fn().mockResolvedValue({
        id: 'pi_test_hold_123',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      });
      (stripeService as any).stripe.refunds.create = vi.fn().mockResolvedValue({
        id: 're_test_refund_123',
        status: 'succeeded',
      });

      const refunded = await stripeService.refundPayment('pi_test_hold_123', 100.0);
      expect(refunded.status).toBe('REFUNDED');
      expect(refunded.providerTransactionId).toBe('re_test_refund_123');
    });

    it('should verify signature and process webhook idempotently', async () => {
      const stripeService = new StripePaymentService('sk_test_mock', 'whsec_mock');
      (stripeService as any).stripe.webhooks.constructEvent = vi.fn().mockReturnValue({
        id: 'evt_stripe_test_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_hold_123' } },
      });
      (stripeService as any).capturePayment = vi.fn().mockResolvedValue({});

      const rawBody = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 't=123,v1=sig_mock';

      const res1 = await stripeService.processWebhookEvent('evt_dummy', 'type_dummy', {}, rawBody, signature);
      expect(res1.eventId).toBe('evt_stripe_test_1');
      expect(res1.processed).toBe(true);
      expect(res1.idempotent).toBe(false);

      // Duplicate webhook processing
      const res2 = await stripeService.processWebhookEvent('evt_dummy', 'type_dummy', {}, rawBody, signature);
      expect(res2.idempotent).toBe(true);
    });
  });

  describe('DailyVideoService', () => {
    it('should create room and meeting token server-side restricted to participants', async () => {
      const dailyService = new DailyVideoService('daily_mock_key');
      mockAppointmentStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now

      // Mock global fetch
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        if (url.includes('/rooms')) {
          return {
            ok: true,
            json: async () => ({ url: 'https://wellnest.daily.co/apt-daily-101' }),
          } as any;
        }
        if (url.includes('/meeting-tokens')) {
          return {
            ok: true,
            json: async () => ({ token: 'daily_meeting_token_alice_123' }),
          } as any;
        }
        return { ok: false } as any;
      });

      const session = await dailyService.generateSessionToken('apt-daily-101', 'u-daily-seeker');

      expect(session.appointmentId).toBe('apt-daily-101');
      expect(session.videoRoomUrl).toBe('https://wellnest.daily.co/apt-daily-101');
      expect(session.sessionToken).toBe('daily_meeting_token_alice_123');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.daily.co/v1/rooms',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer daily_mock_key' }),
        })
      );

      fetchSpy.mockRestore();
    });
  });
});
