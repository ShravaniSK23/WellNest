import { logger } from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

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
  processWebhookEvent(eventId: string, eventType: string, payload: any): Promise<WebhookResult>;
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

  public async processWebhookEvent(eventId: string, eventType: string, payload: any): Promise<WebhookResult> {
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

export const paymentService: IPaymentService = new MockPaymentService();
