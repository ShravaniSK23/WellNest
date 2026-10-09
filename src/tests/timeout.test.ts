import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockLastActivityAt = new Date();
let mockIsRevoked = false;

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: 'u-timeout-user',
        isRevoked: mockIsRevoked,
        lastActivityAt: mockLastActivityAt,
      })),
      update: vi.fn(async ({ data }) => {
        if (data.isRevoked !== undefined) mockIsRevoked = data.isRevoked;
        if (data.lastActivityAt) mockLastActivityAt = data.lastActivityAt;
        return {};
      }),
    },
    user: {
      findUnique: vi.fn(async () => ({
        id: 'u-timeout-user',
        email: 'timeout@example.com',
        role: 'HELP_SEEKER',
        helpSeeker: { id: 'hs-1', fullName: 'Timeout User' },
      })),
    },
  },
}));

describe('30-Minute Inactivity Session Timeout (REQ-UA-14)', () => {
  const token = generateToken({
    userId: 'u-timeout-user',
    role: 'HELP_SEEKER',
    sessionId: 'sess-timeout-1',
    isMfaVerified: true,
  });

  it('should allow request when last activity is within 30 minutes', async () => {
    mockLastActivityAt = new Date(); // Right now
    mockIsRevoked = false;

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should terminate session and return 401 SESSION_TIMEOUT when inactive > 30 minutes', async () => {
    // Set last activity to 35 minutes ago
    mockLastActivityAt = new Date(Date.now() - 35 * 60 * 1000);
    mockIsRevoked = false;

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_TIMEOUT');
    expect(res.body.error.message).toContain('30 minutes of inactivity');
    expect(mockIsRevoked).toBe(true);
  });
});
