import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { hashPassword } from '../utils/password.js';

let mockTherapistUser: any = null;

vi.mock('../db/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.email === 'therapist@example.com') return mockTherapistUser;
        if (where.id === 'u-therapist-mfa') return mockTherapistUser;
        return null;
      }),
      update: vi.fn(async ({ data }) => {
        if (mockTherapistUser) Object.assign(mockTherapistUser, data);
        return mockTherapistUser;
      }),
    },
    session: {
      create: vi.fn(async () => ({ id: 'sess-mfa-123' })),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  },
}));

describe('Multi-Factor Authentication (MFA) Requirement (SE-9)', () => {
  it('should require MFA setup/verification upon login for Therapist role', async () => {
    const pHash = await hashPassword('Password123!');
    mockTherapistUser = {
      id: 'u-therapist-mfa',
      email: 'therapist@example.com',
      passwordHash: pHash,
      role: 'THERAPIST',
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginCount: 0,
      lockedUntil: null,
      deletedAt: null,
    };

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'therapist@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MFA_REQUIRED');
    expect(res.body.error.details.mfaToken).toBeDefined();
  });
});
