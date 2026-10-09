import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockJournalEntries: any[] = [];

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: where.id.includes('A') ? 'u-seeker-A' : 'u-seeker-B',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    helpSeeker: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.userId === 'u-seeker-A') return { id: 'hs-seeker-A', userId: 'u-seeker-A', fullName: 'Seeker A' };
        if (where.userId === 'u-seeker-B') return { id: 'hs-seeker-B', userId: 'u-seeker-B', fullName: 'Seeker B' };
        return null;
      }),
    },
    moodEntry: {
      findMany: vi.fn(async ({ where }) => {
        if (where.helpSeekerId === 'hs-seeker-A') {
          return [
            { id: 'm-1', helpSeekerId: 'hs-seeker-A', localDate: new Date('2026-10-08'), moodEmoji: '😊', note: 'Good' },
            { id: 'm-2', helpSeekerId: 'hs-seeker-A', localDate: new Date('2026-10-09'), moodEmoji: '😊', note: 'Happy' },
            { id: 'm-3', helpSeekerId: 'hs-seeker-A', localDate: new Date('2026-10-09'), moodEmoji: '😐', note: 'Okay' },
          ];
        }
        return [];
      }),
    },
    journalEntry: {
      count: vi.fn(async () => 3),
      findMany: vi.fn(async ({ where }) => mockJournalEntries.filter((j) => j.helpSeekerId === where.helpSeekerId)),
      findUnique: vi.fn(async ({ where }) => mockJournalEntries.find((j) => j.id === where.id) || null),
      create: vi.fn(async ({ data }) => {
        const j = { id: `j-${Date.now()}`, ...data };
        mockJournalEntries.push(j);
        return j;
      }),
      delete: vi.fn(async ({ where }) => {
        mockJournalEntries = mockJournalEntries.filter((j) => j.id !== where.id);
        return {};
      }),
    },
    appointment: {
      findMany: vi.fn(async () => []), // 0 upcoming confirmed appointments -> triggers 'Need someone to talk to?' prompt
    },
    therapist: {
      findMany: vi.fn(async () => [
        {
          id: 't-rec-1',
          fullName: 'Dr. Emily Vance',
          biography: 'Specialist in stress & anxiety.',
          qualifications: 'Ph.D. Psychology',
          yearsOfExperience: 8,
          consultationFee: 75.0,
          averageRating: 4.9,
        },
      ]),
    },
    wellnessReport: {
      create: vi.fn(async ({ data }) => ({ id: 'wr-1', ...data })),
    },
  },
}));

describe('Wellness Dashboard & Analytics Baseline', () => {
  const tokenUserA = generateToken({
    userId: 'u-seeker-A',
    role: 'HELP_SEEKER',
    sessionId: 'sess-active-A',
    isMfaVerified: true,
  });

  const tokenUserB = generateToken({
    userId: 'u-seeker-B',
    role: 'HELP_SEEKER',
    sessionId: 'sess-active-B',
    isMfaVerified: true,
  });

  it('should compute summary analytics, frequent mood, and non-diagnostic disclaimers', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary?rangeDays=30')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics.frequentMood).toBe('😊');
    expect(res.body.analytics.variability).toBe('LOW');
    expect(res.body.analytics.journalingFrequency).toBe(3);
    expect(res.body.analytics.disclaimer).toContain('Not a clinical diagnosis');
    expect(res.body.showNeedSomeoneToTalkPrompt).toBe(true);
    expect(res.body.recommendedTherapists.length).toBeGreaterThan(0);
  });

  it('should generate and stream PDF wellness report download', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/reports/weekly/pdf')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('should enforce strict journal privacy: User B cannot delete User A journal entry', async () => {
    mockJournalEntries = [
      { id: 'j-entry-A', helpSeekerId: 'hs-seeker-A', localDate: new Date(), content: 'Private Journal of User A' },
    ];

    const deleteRes = await request(app)
      .delete('/api/v1/journals/j-entry-A')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    expect(deleteRes.body.error.message).toContain('not authorized');
  });
});
