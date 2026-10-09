import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async () => ({
        id: 'sess-active-123',
        userId: 'u-user-A',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    user: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        email: 'userA@example.com',
        role: 'HELP_SEEKER',
        isEmailVerified: true,
        helpSeeker: { id: 'hs-A', fullName: 'User A', timezone: 'UTC' },
      })),
      update: vi.fn(async () => ({})),
    },
    helpSeeker: {
      update: vi.fn(async () => ({})),
    },
  },
}));

describe('Data Ownership Security', () => {
  const tokenUserA = generateToken({
    userId: 'u-user-A',
    role: 'HELP_SEEKER',
    sessionId: 'sess-active-123',
    isMfaVerified: true,
  });

  it("should allow User A to retrieve their own profile via /users/me", async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('u-user-A');
  });

  it("should allow User A to update their own profile", async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ fullName: 'User A Updated', timezone: 'Asia/Kolkata' });

    expect(res.status).toBe(200);
  });
});
