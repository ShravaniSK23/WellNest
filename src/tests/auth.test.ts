import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../db/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// Mock Prisma
vi.mock('../db/prisma.js', () => {
  const mockUserMap = new Map();
  const mockSessionMap = new Map();
  const mockTokenMap = new Map();

  return {
    prisma: {
      user: {
        findUnique: vi.fn(async ({ where }) => {
          if (where.email) {
            for (const user of mockUserMap.values()) {
              if (user.email === where.email) return user;
            }
          }
          if (where.id) return mockUserMap.get(where.id) || null;
          return null;
        }),
        create: vi.fn(async ({ data }) => {
          const newUser = {
            id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
            isEmailVerified: true,
            mfaEnabled: false,
            mfaSecret: null,
            failedLoginCount: 0,
            lockedUntil: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUserMap.set(newUser.id, newUser);
          return newUser;
        }),
        update: vi.fn(async ({ where, data }) => {
          const user = mockUserMap.get(where.id);
          if (user) {
            Object.assign(user, data);
            mockUserMap.set(where.id, user);
          }
          return user;
        }),
      },
      helpSeeker: {
        create: vi.fn(async ({ data }) => ({ id: `hs-${Date.now()}`, ...data })),
      },
      therapist: {
        create: vi.fn(async ({ data }) => ({ id: `th-${Date.now()}`, ...data })),
      },
      moderator: {
        create: vi.fn(async ({ data }) => ({ id: `mod-${Date.now()}`, ...data })),
      },
      admin: {
        create: vi.fn(async ({ data }) => ({ id: `adm-${Date.now()}`, ...data })),
      },
      session: {
        create: vi.fn(async ({ data }) => {
          const session = { id: `sess-${Date.now()}`, ...data, isRevoked: false };
          mockSessionMap.set(session.id, session);
          return session;
        }),
        findUnique: vi.fn(async ({ where }) => mockSessionMap.get(where.id) || null),
        update: vi.fn(async ({ where, data }) => {
          const sess = mockSessionMap.get(where.id);
          if (sess) Object.assign(sess, data);
          return sess;
        }),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      verificationToken: {
        create: vi.fn(async ({ data }) => {
          const tok = { id: `tok-${Date.now()}`, ...data };
          mockTokenMap.set(data.token, tok);
          return tok;
        }),
        findUnique: vi.fn(async ({ where }) => mockTokenMap.get(where.token) || null),
        delete: vi.fn(async ({ where }) => mockTokenMap.delete(where.id)),
      },
      auditLog: {
        create: vi.fn(async ({ data }) => ({ id: `audit-${Date.now()}`, ...data })),
      },
      $transaction: vi.fn(async (cb) => {
        if (Array.isArray(cb)) return Promise.all(cb);
        return cb(prisma);
      }),
    },
  };
});

describe('Auth & Password Security Baseline', () => {
  it('should register a new HelpSeeker account with hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'helpseeker@example.com',
        password: 'Password123!',
        fullName: 'Alice Walker',
        role: 'HELP_SEEKER',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('helpseeker@example.com');
    expect(res.body.role).toBe('HELP_SEEKER');

    // Verify plaintext password is NEVER stored
    const storedUser = await prisma.user.findUnique({ where: { email: 'helpseeker@example.com' } });
    expect(storedUser).toBeDefined();
    expect(storedUser.passwordHash).not.toBe('Password123!');
    const matches = await comparePassword('Password123!', storedUser.passwordHash);
    expect(matches).toBe(true);
  });

  it('should reject registration with a weak password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'weak@example.com',
        password: 'pass',
        fullName: 'Weak Password',
        role: 'HELP_SEEKER',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('should authenticate user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'helpseeker@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('HELP_SEEKER');
  });

  it('should lock account after 5 consecutive failed login attempts (REQ-UA-7)', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'helpseeker@example.com',
          password: 'WrongPassword123!',
        });
    }

    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'helpseeker@example.com',
        password: 'Password123!',
      });

    expect(lockedRes.status).toBe(423);
    expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });
});
