import Stripe from 'stripe';
import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { env } from '../config/env.js';

export interface PaymentRecord {
  paymentId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';
  providerTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookResult {
  eventId: string;
  eventType: string;
  processed: boolean;
  idempotent: boolean;
  message: string;
}

export interface IPaymentService {
  createAuthorizationHold(appointmentId: string, amount: number, currency?: string): Promise<PaymentRecord>;
  capturePayment(paymentId: string): Promise<PaymentRecord>;
  refundPayment(paymentId: string, amount?: number): Promise<PaymentRecord>;
  processWebhookEvent(
    eventId: string,
    eventType: string,
    payload: any,
    rawBody?: Buffer | string,
    signature?: string
  ): Promise<WebhookResult>;
}

export class MockPaymentService implements IPaymentService {
  private payments: Map<string, PaymentRecord> = new Map();
  private processedEvents: Set<string> = new Set();

  public async createAuthorizationHold(appointmentId: string, amount: number, currency: string = 'USD'): Promise<PaymentRecord> {
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const providerTransactionId = `txn_hold_${Date.now()}`;

    const record: PaymentRecord = {
      paymentId,
      appointmentId,
      amount,
      currency,
      status: 'AUTHORIZED', // Hold placed
      providerTransactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payments.set(paymentId, record);
    logger.info({ paymentId, appointmentId, amount }, `[PAYMENT HOLD CREATED] Authorized $${amount}`);
    return record;
  }

  public async capturePayment(paymentId: string): Promise<PaymentRecord> {
    const record = this.payments.get(paymentId);
    if (!record) {
      throw new NotFoundError('Payment record not found');
    }

    if (record.status !== 'AUTHORIZED') {
      throw new BadRequestError(`Cannot capture payment in status '${record.status}'. Must be AUTHORIZED.`);
    }

    record.status = 'CAPTURED';
    record.providerTransactionId = `txn_cap_${Date.now()}`;
    record.updatedAt = new Date();

    this.payments.set(paymentId, record);
    logger.info({ paymentId, amount: record.amount }, `[PAYMENT CAPTURED] Captured $${record.amount}`);
    return record;
  }

  public async refundPayment(paymentId: string, amount?: number): Promise<PaymentRecord> {
    const record = this.payments.get(paymentId);
    if (!record) {
      throw new NotFoundError('Payment record not found');
    }

    if (record.status !== 'CAPTURED' && record.status !== 'AUTHORIZED') {
      throw new BadRequestError(`Cannot refund payment in status '${record.status}'.`);
    }

    record.status = 'REFUNDED';
    record.providerTransactionId = `txn_ref_${Date.now()}`;
    record.updatedAt = new Date();

    this.payments.set(paymentId, record);
    logger.info({ paymentId, refundAmount: amount || record.amount }, `[PAYMENT REFUNDED] Refunded $${amount || record.amount}`);
    return record;
  }

  public async processWebhookEvent(
    eventId: string,
    eventType: string,
    payload: any,
    _rawBody?: Buffer | string,
    _signature?: string
  ): Promise<WebhookResult> {
    // Idempotency check: if eventId has already been processed, skip reprocessing
    if (this.processedEvents.has(eventId)) {
      logger.info({ eventId, eventType }, `[WEBHOOK IDEMPOTENT] Event ${eventId} previously processed. Skipping.`);
      return {
        eventId,
        eventType,
        processed: true,
        idempotent: true,
        message: 'Event previously processed',
      };
    }

    // Process new event
    this.processedEvents.add(eventId);

    if (eventType === 'payment_intent.succeeded' && payload?.paymentId) {
      try {
        await this.capturePayment(payload.paymentId);
      } catch (err) {
        // Ignore if already captured
      }
    } else if (eventType === 'charge.refunded' && payload?.paymentId) {
      try {
        await this.refundPayment(payload.paymentId);
      } catch (err) {
        // Ignore if already refunded
      }
    }

    return {
      eventId,
      eventType,
      processed: true,
      idempotent: false,
      message: 'Event processed successfully',
    };
  }
}

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;
  private webhookSecret: string;
  private processedEvents: Set<string> = new Set();

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  public async createAuthorizationHold(appointmentId: string, amount: number, currency: string = 'USD'): Promise<PaymentRecord> {
    try {
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        capture_method: 'manual',
        payment_method: 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: { appointmentId },
      });

      const record: PaymentRecord = {
        paymentId: paymentIntent.id,
        appointmentId,
        amount,
        currency,
        status: 'AUTHORIZED',
        providerTransactionId: paymentIntent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info({ paymentId: paymentIntent.id, appointmentId, amount }, `[STRIPE HOLD CREATED] Authorized $${amount}`);
      return record;
    } catch (err: any) {
      logger.error({ err }, '[STRIPE ERROR] Failed to create authorization hold');
      throw new BadRequestError(`Stripe authorization error: ${err.message || err}`);
    }
  }

  public async capturePayment(paymentId: string): Promise<PaymentRecord> {
    try {
      const existing = await this.stripe.paymentIntents.retrieve(paymentId);
      if (!existing) {
        throw new NotFoundError('Payment record not found');
      }

      if (existing.status !== 'requires_capture') {
        if (existing.status === 'succeeded') {
          throw new BadRequestError(`Cannot capture payment in status '${existing.status}'. Must be AUTHORIZED.`);
        }
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(paymentId);

      const record: PaymentRecord = {
        paymentId: paymentIntent.id,
        appointmentId: (paymentIntent.metadata?.appointmentId as string) || '',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'CAPTURED',
        providerTransactionId: (paymentIntent.latest_charge as string) || paymentIntent.id,
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };

      logger.info({ paymentId, amount: record.amount }, `[STRIPE PAYMENT CAPTURED] Captured $${record.amount}`);
      return record;
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
      if (err.code === 'resource_missing') {
        throw new NotFoundError('Payment record not found');
      }
      logger.error({ err }, '[STRIPE ERROR] Failed to capture payment');
      throw new BadRequestError(`Stripe capture error: ${err.message || err}`);
    }
  }

  public async refundPayment(paymentId: string, amount?: number): Promise<PaymentRecord> {
    try {
      const existing = await this.stripe.paymentIntents.retrieve(paymentId);
      if (!existing) {
        throw new NotFoundError('Payment record not found');
      }

      let providerTxId = paymentId;

      if (existing.status === 'requires_capture' || existing.status === 'requires_payment_method') {
        const canceled = await this.stripe.paymentIntents.cancel(paymentId);
        providerTxId = canceled.id;
      } else if (existing.status === 'succeeded') {
        const refund = await this.stripe.refunds.create({
          payment_intent: paymentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        });
        providerTxId = refund.id;
      } else if (existing.status === 'canceled') {
        providerTxId = existing.id;
      } else {
        throw new BadRequestError(`Cannot refund payment in status '${existing.status}'.`);
      }

      const record: PaymentRecord = {
        paymentId,
        appointmentId: (existing.metadata?.appointmentId as string) || '',
        amount: amount || existing.amount / 100,
        currency: existing.currency.toUpperCase(),
        status: 'REFUNDED',
        providerTransactionId: providerTxId,
        createdAt: new Date(existing.created * 1000),
        updatedAt: new Date(),
      };

      logger.info({ paymentId, refundAmount: record.amount }, `[STRIPE PAYMENT REFUNDED] Refunded $${record.amount}`);
      return record;
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
      if (err.code === 'resource_missing') {
        throw new NotFoundError('Payment record not found');
      }
      logger.error({ err }, '[STRIPE ERROR] Failed to refund payment');
      throw new BadRequestError(`Stripe refund error: ${err.message || err}`);
    }
  }

  public async processWebhookEvent(
    eventId: string,
    eventType: string,
    payload: any,
    rawBody?: Buffer | string,
    signature?: string
  ): Promise<WebhookResult> {
    let verifiedEventId = eventId;
    let verifiedEventType = eventType;
    let verifiedPayload = payload;

    if (rawBody && signature && this.webhookSecret) {
      try {
        const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        verifiedEventId = event.id;
        verifiedEventType = event.type;
        verifiedPayload = event.data.object;
      } catch (err: any) {
        logger.error({ err }, '[STRIPE WEBHOOK SIGNATURE ERROR] Webhook signature verification failed');
        throw new BadRequestError(`Webhook signature verification failed: ${err.message}`);
      }
    } else if (this.webhookSecret && !signature) {
      throw new BadRequestError('Missing stripe-signature header for webhook verification');
    }

    if (!verifiedEventId) {
      throw new BadRequestError('Webhook event ID is required');
    }

    if (this.processedEvents.has(verifiedEventId)) {
      logger.info({ eventId: verifiedEventId, eventType: verifiedEventType }, `[STRIPE WEBHOOK IDEMPOTENT] Event ${verifiedEventId} previously processed. Skipping.`);
      return {
        eventId: verifiedEventId,
        eventType: verifiedEventType,
        processed: true,
        idempotent: true,
        message: 'Event previously processed',
      };
    }

    this.processedEvents.add(verifiedEventId);

    if (verifiedEventType === 'payment_intent.succeeded') {
      const payId = verifiedPayload?.id || verifiedPayload?.paymentId;
      if (payId) {
        try {
          await this.capturePayment(payId);
        } catch (err) {
          // Ignore if already captured
        }
      }
    } else if (verifiedEventType === 'charge.refunded' || verifiedEventType === 'payment_intent.canceled') {
      const payId = verifiedPayload?.payment_intent || verifiedPayload?.id || verifiedPayload?.paymentId;
      if (payId) {
        try {
          await this.refundPayment(payId);
        } catch (err) {
          // Ignore if already refunded
        }
      }
    }

    return {
      eventId: verifiedEventId,
      eventType: verifiedEventType,
      processed: true,
      idempotent: false,
      message: 'Event processed successfully',
    };
  }
}

export const paymentService: IPaymentService =
  env.NODE_ENV !== 'test' && env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
    ? new StripePaymentService(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
    : new MockPaymentService();
