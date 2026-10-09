import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockPosts: any[] = [];
let mockReports: any[] = [];

vi.mock('../db/prisma.js', () => {
  const prismaObj = {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: 'u-comm-user-1',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    helpSeeker: {
      findUnique: vi.fn(async ({ where }) => ({
        id: 'hs-comm-1',
        userId: where.userId,
        fullName: 'Secret User',
      })),
    },
    pseudonym: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.helpSeekerId) return { id: 'pseudonym-1', helpSeekerId: 'hs-comm-1', pseudonymName: 'CalmRiver42' };
        return null;
      }),
      create: vi.fn(async ({ data }) => ({ id: 'pseudonym-1', ...data })),
    },
    communityPost: {
      create: vi.fn(async ({ data }) => {
        const p = { id: `post-${Date.now()}`, ...data, reportCount: 0, pseudonym: { pseudonymName: 'CalmRiver42' }, comments: [] };
        mockPosts.push(p);
        return p;
      }),
      findMany: vi.fn(async () =>
        mockPosts.filter((p) => p.status === 'VISIBLE').map((p) => ({ ...p, pseudonym: { pseudonymName: 'CalmRiver42' } }))
      ),
      count: vi.fn(async () => mockPosts.length),
      findUnique: vi.fn(async ({ where }) => mockPosts.find((p) => p.id === where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const p = mockPosts.find((item) => item.id === where.id);
        if (p) Object.assign(p, data);
        return p;
      }),
    },
    comment: {
      create: vi.fn(async ({ data }) => ({ id: `comm-${Date.now()}`, ...data, pseudonym: { pseudonymName: 'CalmRiver42' } })),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
    },
    report: {
      create: vi.fn(async ({ data }) => {
        const r = { id: `rep-${Date.now()}`, ...data };
        mockReports.push(r);
        return r;
      }),
    },
    auditLog: {
      findFirst: vi.fn(async () => null), // No active suspension
      create: vi.fn(async () => ({})),
    },
    $transaction: vi.fn(async (cb) => {
      if (Array.isArray(cb)) return Promise.all(cb);
      return cb(prismaObj);
    }),
  };

  return { prisma: prismaObj };
});

describe('Anonymous Community Forum & Privacy Baseline', () => {
  const token = generateToken({
    userId: 'u-comm-user-1',
    role: 'HELP_SEEKER',
    sessionId: 'sess-comm-1',
    isMfaVerified: true,
  });

  it('should list topic channels with embedded crisis helpline metadata (SF-1, SF-2)', async () => {
    const res = await request(app).get('/api/v1/community/channels');

    expect(res.status).toBe(200);
    expect(res.body.channels.length).toBe(4);
    expect(res.body.crisisHelpline.phone).toBe('988');
  });

  it('should reject post exceeding 2,000 characters (400 Bad Request)', async () => {
    const longContent = 'A'.repeat(2001);
    const res = await request(app)
      .post('/api/v1/community/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ channel: 'STRESS', title: 'Test Title', content: longContent });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('2,000 characters');
  });

  it('should create post under assigned pseudonym without leaking email or user ID (BR-7, REQ-AC-5)', async () => {
    const res = await request(app)
      .post('/api/v1/community/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ channel: 'STRESS', title: 'Exam Stress', content: 'Studying for finals.' });

    expect(res.status).toBe(201);
    expect(res.body.post.authorPseudonym).toBe('CalmRiver42');
    expect(res.body.post.userId).toBeUndefined();
    expect(res.body.post.email).toBeUndefined();
    expect(res.body.post.fullName).toBeUndefined();
  });

  it('should automatically hide post when report count reaches 3 (BR-8, REQ-AC-7)', async () => {
    const postObj = mockPosts[0];
    expect(postObj).toBeDefined();

    // Report 1
    await request(app)
      .post('/api/v1/community/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: postObj.id, reason: 'INAPPROPRIATE' });

    // Report 2
    await request(app)
      .post('/api/v1/community/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: postObj.id, reason: 'SPAM' });

    // Report 3 -> Triggers Auto-Hide
    const res3 = await request(app)
      .post('/api/v1/community/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: postObj.id, reason: 'HARASSMENT' });

    expect(res3.status).toBe(200);
    expect(res3.body.contentHidden).toBe(true);
    expect(postObj.status).toBe('HIDDEN');
  });
});
