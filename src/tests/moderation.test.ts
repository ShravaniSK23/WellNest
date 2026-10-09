import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';
import { CommunityService } from '../services/community.service.js';

let mockTargetPost = {
  id: 'post-mod-1',
  channel: 'STRESS',
  title: 'Reported Post Title',
  content: 'Some reported post content',
  status: 'HIDDEN',
  reportCount: 3,
  pseudonym: { pseudonymName: 'FlaggedUser', helpSeeker: { userId: 'u-suspended-author' } },
  reports: [{ reason: 'HARASSMENT' }],
};

let mockAuditLogs: any[] = [];

vi.mock('../db/prisma.js', () => {
  const prismaObj = {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: where.id.includes('mod') ? 'u-moderator-1' : 'u-suspended-author',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    moderator: {
      findUnique: vi.fn(async () => ({ id: 'mod-1', userId: 'u-moderator-1', department: 'Safety' })),
    },
    admin: {
      findUnique: vi.fn(async () => null),
    },
    communityPost: {
      findMany: vi.fn(async ({ where }) => {
        if (where.status === 'HIDDEN') return [mockTargetPost];
        return [];
      }),
      findUnique: vi.fn(async () => mockTargetPost),
      update: vi.fn(async ({ data }) => {
        Object.assign(mockTargetPost, data);
        return mockTargetPost;
      }),
    },
    comment: {
      findMany: vi.fn(async () => []),
    },
    moderationAction: {
      create: vi.fn(async ({ data }) => ({ id: 'mod-act-1', ...data })),
    },
    auditLog: {
      findFirst: vi.fn(async ({ where }) => {
        if (where.userId === 'u-suspended-author' && where.action === 'POSTING_SUSPENSION_ISSUED') {
          return mockAuditLogs.find((l) => l.action === 'POSTING_SUSPENSION_ISSUED');
        }
        return null;
      }),
      create: vi.fn(async ({ data }) => {
        const log = { id: `audit-${Date.now()}`, ...data };
        mockAuditLogs.push(log);
        return log;
      }),
    },
    $transaction: vi.fn(async (cb) => {
      if (Array.isArray(cb)) return Promise.all(cb);
      return cb(prismaObj);
    }),
  };

  return { prisma: prismaObj };
});

describe('Moderation Queue & Suspension Enforcement', () => {
  const modToken = generateToken({
    userId: 'u-moderator-1',
    role: 'MODERATOR',
    sessionId: 'sess-mod-1',
    isMfaVerified: true,
  });

  const suspendedUserToken = generateToken({
    userId: 'u-suspended-author',
    role: 'HELP_SEEKER',
    sessionId: 'sess-suspended-1',
    isMfaVerified: true,
  });

  it('should allow Moderator to view hidden posts in moderation queue (REQ-AC-8)', async () => {
    const res = await request(app)
      .get('/api/v1/moderation/queue')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.status).toBe(200);
    expect(res.body.queue.hiddenPosts.length).toBe(1);
    expect(res.body.queue.hiddenPosts[0].id).toBe('post-mod-1');
  });

  it('should allow Moderator to execute TEMPORARY_SUSPENSION action (up to 7 days, BR-9)', async () => {
    const res = await request(app)
      .post('/api/v1/moderation/actions')
      .set('Authorization', `Bearer ${modToken}`)
      .send({
        postId: 'post-mod-1',
        actionType: 'TEMPORARY_SUSPENSION',
        durationDays: 7,
        reasoning: 'Repeated harassment guidelines violation',
      });

    expect(res.status).toBe(200);
    expect(res.body.actionType).toBe('TEMPORARY_SUSPENSION');

    // Verify suspension audit log was created
    const suspensionLog = mockAuditLogs.find((l) => l.action === 'POSTING_SUSPENSION_ISSUED');
    expect(suspensionLog).toBeDefined();
    expect(suspensionLog.userId).toBe('u-suspended-author');
  });

  it('should enforce suspension: suspended author cannot create posts until suspension expires (BR-9)', async () => {
    await expect(CommunityService.checkSuspension('u-suspended-author')).rejects.toThrow(
      'posting privileges are currently suspended'
    );
  });

  it('should allow Moderator to RESTORE hidden post back to VISIBLE state', async () => {
    const res = await request(app)
      .post('/api/v1/moderation/actions')
      .set('Authorization', `Bearer ${modToken}`)
      .send({
        postId: 'post-mod-1',
        actionType: 'RESTORE',
        reasoning: 'Reviewed and deemed non-violating',
      });

    expect(res.status).toBe(200);
    expect(mockTargetPost.status).toBe('VISIBLE');
    expect(mockTargetPost.reportCount).toBe(0);
  });
});
