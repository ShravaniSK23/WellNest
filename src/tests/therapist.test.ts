import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockTherapists = [
  {
    id: 't-verified-1',
    userId: 'u-therapist-1',
    fullName: 'Dr. Sarah Jenkins',
    qualifications: 'Anxiety Specialist',
    consultationFee: 90.0,
    averageRating: 4.9,
    verificationStatus: 'VERIFIED',
    isVisible: true,
  },
  {
    id: 't-unverified-2',
    userId: 'u-therapist-2',
    fullName: 'Unverified Doctor',
    qualifications: 'General',
    consultationFee: 50.0,
    averageRating: 0.0,
    verificationStatus: 'UNVERIFIED',
    isVisible: false,
  },
];

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: where.id.includes('therapist') ? 'u-therapist-1' : 'u-admin-1',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    therapist: {
      findMany: vi.fn(async ({ where }) => {
        if (where?.verificationStatus === 'VERIFIED') {
          return mockTherapists.filter((t) => t.verificationStatus === 'VERIFIED');
        }
        return mockTherapists;
      }),
      count: vi.fn(async ({ where }) => {
        if (where?.verificationStatus === 'VERIFIED') {
          return mockTherapists.filter((t) => t.verificationStatus === 'VERIFIED').length;
        }
        return mockTherapists.length;
      }),
      findUnique: vi.fn(async ({ where }) => mockTherapists.find((t) => t.id === where.id || t.userId === where.userId) || null),
      update: vi.fn(async ({ where, data }) => {
        const t = mockTherapists.find((item) => item.id === where.id);
        if (t) Object.assign(t, data);
        return t;
      }),
    },
    credentialDocument: {
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    availabilitySlot: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }) => ({ id: 'slot-new-1', ...data })),
      findMany: vi.fn(async () => []),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  },
}));

describe('Therapist Verification & Availability Management', () => {
  const therapistToken = generateToken({
    userId: 'u-therapist-1',
    role: 'THERAPIST',
    sessionId: 'sess-therapist-123',
    isMfaVerified: true,
  });

  const adminToken = generateToken({
    userId: 'u-admin-1',
    role: 'ADMIN',
    sessionId: 'sess-admin-123',
    isMfaVerified: true,
  });

  it('should exclude unverified therapists from search queries (BR-1, BR-2, REQ-TS-4)', async () => {
    const res = await request(app).get('/api/v1/therapists');

    expect(res.status).toBe(200);
    expect(res.body.therapists.length).toBe(1);
    expect(res.body.therapists[0].id).toBe('t-verified-1');
    expect(res.body.therapists.some((t: any) => t.id === 't-unverified-2')).toBe(false);
  });

  it('should allow Admin to verify an unverified therapist', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/t-unverified-2/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'VERIFIED', notes: 'Verified credentials' });

    expect(res.status).toBe(200);
    expect(res.body.therapist.verificationStatus).toBe('VERIFIED');
    expect(res.body.therapist.isVisible).toBe(true);
  });

  it('should allow verified therapist to create an availability slot within 14 days', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/v1/therapists/slots')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.slot).toBeDefined();
  });

  it('should reject slot creation beyond 14 calendar days', async () => {
    const fifteenDaysAhead = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000);
    const fifteenDaysEnd = new Date(fifteenDaysAhead.getTime() + 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/v1/therapists/slots')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        startTime: fifteenDaysAhead.toISOString(),
        endTime: fifteenDaysEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('14 calendar days');
  });
});
