import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async () => ({
        id: 'sess-active-123',
        userId: 'u-therapist-1',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    therapist: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => ({ id: 't-1', userId: 'u-therapist-1' })),
      update: vi.fn(async () => ({ id: 't-1', verificationStatus: 'PENDING_REVIEW' })),
    },
    credentialDocument: {
      create: vi.fn(async () => ({ id: 'cred-1' })),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  },
}));

describe('Role-Based Access Control (RBAC) Enforcement', () => {
  const helpSeekerToken = generateToken({
    userId: 'u-helpseeker-1',
    role: 'HELP_SEEKER',
    sessionId: 'sess-active-123',
    isMfaVerified: true,
  });

  const therapistToken = generateToken({
    userId: 'u-therapist-1',
    role: 'THERAPIST',
    sessionId: 'sess-active-123',
    isMfaVerified: true,
  });

  const adminToken = generateToken({
    userId: 'u-admin-1',
    role: 'ADMIN',
    sessionId: 'sess-active-123',
    isMfaVerified: true,
  });

  it('should deny HelpSeeker from submitting therapist credentials (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/credentials')
      .set('Authorization', `Bearer ${helpSeekerToken}`)
      .send({ documentType: 'LICENSE', documentUrl: 'http://example.com/lic.pdf' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain("Role 'HELP_SEEKER' is not authorized");
  });

  it('should allow Therapist to submit credentials', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/credentials')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({ documentType: 'LICENSE', documentUrl: 'http://example.com/lic.pdf' });

    expect(res.status).toBe(201);
  });

  it('should deny Therapist from accessing admin-only verification endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/pending-verifications')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow Admin to access pending verifications and perform verification', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/pending-verifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
