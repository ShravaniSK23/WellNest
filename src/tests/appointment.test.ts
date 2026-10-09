import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';
import { AppointmentService } from '../services/appointment.service.js';

let mockSlot: any = {
  id: 'slot-avail-1',
  therapistId: 't-therapist-1',
  startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
  endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
  isBooked: false,
};

let mockAppointment: any = null;
let mockRequest: any = null;
let mockPaymentRecord: any = null;

vi.mock('../db/prisma.js', () => {
  const prismaObj = {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: where.id.includes('seeker') ? 'u-seeker-1' : 'u-therapist-1',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    helpSeeker: {
      findUnique: vi.fn(async () => ({ id: 'hs-seeker-1', userId: 'u-seeker-1', fullName: 'Jane Seeker' })),
    },
    therapist: {
      findUnique: vi.fn(async () => ({
        id: 't-therapist-1',
        userId: 'u-therapist-1',
        fullName: 'Dr. Therapist',
        consultationFee: 100.0,
        verificationStatus: 'VERIFIED',
      })),
    },
    availabilitySlot: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.id === mockSlot.id) return mockSlot;
        if (where.id === 'slot-new-resched') return { id: 'slot-new-resched', therapistId: 't-therapist-1', startTime: new Date(Date.now() + 72 * 60 * 60 * 1000), endTime: new Date(Date.now() + 73 * 60 * 60 * 1000), isBooked: false };
        return null;
      }),
      update: vi.fn(async ({ data }) => {
        if (data.isBooked !== undefined) mockSlot.isBooked = data.isBooked;
        return mockSlot;
      }),
    },
    appointmentRequest: {
      create: vi.fn(async ({ data }) => {
        mockRequest = { id: 'req-1', ...data, appointment: { id: 'apt-1' } };
        return mockRequest;
      }),
      findUnique: vi.fn(async () => mockRequest),
      findMany: vi.fn(async () => [mockRequest]),
      update: vi.fn(async ({ data }) => {
        if (mockRequest) Object.assign(mockRequest, data);
        return mockRequest;
      }),
    },
    appointment: {
      create: vi.fn(async ({ data }) => {
        mockAppointment = {
          id: 'apt-1',
          ...data,
          rescheduleCount: 0,
          helpSeekerId: 'hs-seeker-1',
          therapistId: 't-therapist-1',
          helpSeeker: { userId: 'u-seeker-1' },
          payment: { id: 'pay-1', status: 'AUTHORIZED' },
        };
        mockRequest.appointment = mockAppointment;
        return mockAppointment;
      }),
      findUnique: vi.fn(async () => mockAppointment),
      update: vi.fn(async ({ data }) => {
        if (mockAppointment) Object.assign(mockAppointment, data);
        return mockAppointment;
      }),
    },
    payment: {
      create: vi.fn(async ({ data }) => {
        const p = { id: data.id || `pay-${data.appointmentId}`, ...data };
        mockPaymentRecord = p;
        if (mockAppointment) mockAppointment.payment = mockPaymentRecord;
        return p;
      }),
      findUnique: vi.fn(async () => mockPaymentRecord || { id: 'pay-1', appointmentId: 'apt-1', status: 'AUTHORIZED' }),
      update: vi.fn(async () => ({})),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
    $transaction: vi.fn(async (cb) => {
      if (Array.isArray(cb)) return Promise.all(cb);
      return cb(prismaObj);
    }),
  };

  return { prisma: prismaObj };
});

describe('Appointment Booking Lifecycle & Concurrency', () => {
  const seekerToken = generateToken({
    userId: 'u-seeker-1',
    role: 'HELP_SEEKER',
    sessionId: 'sess-seeker-1',
    isMfaVerified: true,
  });

  const therapistToken = generateToken({
    userId: 'u-therapist-1',
    role: 'THERAPIST',
    sessionId: 'sess-therapist-1',
    isMfaVerified: true,
  });

  it('should create booking request in PENDING_CONFIRMATION state and reserve slot', async () => {
    mockSlot.isBooked = false;

    const res = await request(app)
      .post('/api/v1/appointments/request')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ therapistId: 't-therapist-1', slotId: 'slot-avail-1' });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('PENDING_CONFIRMATION');
    expect(res.body.paymentStatus).toBe('AUTHORIZED');
    expect(mockSlot.isBooked).toBe(true);
  });

  it('should prevent double booking and return 409 Conflict if slot is already reserved', async () => {
    mockSlot.isBooked = true; // Slot already booked

    const res = await request(app)
      .post('/api/v1/appointments/request')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ therapistId: 't-therapist-1', slotId: 'slot-avail-1' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('already been reserved');
  });

  it('should allow Therapist to confirm appointment (PENDING_CONFIRMATION -> CONFIRMED)', async () => {
    const res = await request(app)
      .post('/api/v1/appointments/apt-1/confirm')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.paymentStatus).toBe('CAPTURED');
  });

  it('should auto-expire pending request after 24 hours via worker daemon (REQ-TS-8)', async () => {
    // Set request expiresAt to past date
    mockRequest.expiresAt = new Date(Date.now() - 1000);
    mockRequest.status = 'PENDING';

    const result = await AppointmentService.expirePendingRequests();

    expect(result.expiredCount).toBe(1);
    expect(mockRequest.status).toBe('EXPIRED');
    expect(mockSlot.isBooked).toBe(false); // Slot released back to available
  });
});
