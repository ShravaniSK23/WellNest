import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockMoodEntries = new Map<string, any>();
let mockStreak: any = null;

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async () => ({
        id: 'sess-mood-123',
        userId: 'u-mood-seeker',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    helpSeeker: {
      findUnique: vi.fn(async ({ where }) => ({
        id: 'hs-mood-seeker',
        userId: where.userId,
        fullName: 'Mood Seeker',
        timezone: 'UTC',
      })),
    },
    moodEntry: {
      findUnique: vi.fn(async ({ where }) => {
        const key = `${where.helpSeekerId_localDate.helpSeekerId}_${where.helpSeekerId_localDate.localDate.toISOString().split('T')[0]}`;
        return mockMoodEntries.get(key) || null;
      }),
      create: vi.fn(async ({ data }) => {
        const key = `${data.helpSeekerId}_${data.localDate.toISOString().split('T')[0]}`;
        const entry = { id: `m-${Date.now()}`, ...data, updatedAt: new Date() };
        mockMoodEntries.set(key, entry);
        return entry;
      }),
      update: vi.fn(async ({ where, data }) => {
        for (const [k, v] of mockMoodEntries.entries()) {
          if (v.id === where.id) {
            Object.assign(v, data);
            return v;
          }
        }
        return null;
      }),
    },
    moodStreak: {
      findUnique: vi.fn(async () => mockStreak),
      create: vi.fn(async ({ data }) => {
        mockStreak = { id: 'streak-1', ...data };
        return mockStreak;
      }),
      update: vi.fn(async ({ data }) => {
        if (mockStreak) Object.assign(mockStreak, data);
        return mockStreak;
      }),
    },
  },
}));

describe('Daily Mood Tracking & Timezone Streaks', () => {
  const token = generateToken({
    userId: 'u-mood-seeker',
    role: 'HELP_SEEKER',
    sessionId: 'sess-mood-123',
    isMfaVerified: true,
  });

  it('should reject invalid predefined mood emoji (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-09', moodEmoji: 'INVALID_EMOJI' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid mood emoji');
  });

  it('should reject mood note exceeding 500 characters (400 Bad Request)', async () => {
    const longNote = 'A'.repeat(501);
    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-09', moodEmoji: '😊', note: longNote });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('exceed 500 characters');
  });

  it('should log mood entry and initialize streak to 1', async () => {
    mockMoodEntries.clear();
    mockStreak = null;

    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-09', moodEmoji: '😊', note: 'Feeling great' });

    expect(res.status).toBe(201);
    expect(res.body.moodEntry.moodEmoji).toBe('😊');
    expect(res.body.streak.currentStreak).toBe(1);
    expect(res.body.musicRecommendation).toBeDefined();
    expect(res.body.quote).toBeDefined();
  });

  it('should treat duplicate mood on same local date as an edit without duplicating (200 OK)', async () => {
    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-09', moodEmoji: '😀', note: 'Updated note for today' });

    expect(res.status).toBe(200);
    expect(res.body.isEdit).toBe(true);
    expect(res.body.moodEntry.moodEmoji).toBe('😀');
    // Streak count remains 1 on edit
    expect(res.body.streak.currentStreak).toBe(1);
  });

  it('should increment streak on consecutive day logging', async () => {
    // Log next consecutive day (2026-10-10)
    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-10', moodEmoji: '🥳' });

    expect(res.status).toBe(201);
    expect(res.body.streak.currentStreak).toBe(2);
  });

  it('should reset streak to 1 when a calendar day is missed', async () => {
    // Log after skipping 10-11, logging on 10-12
    const res = await request(app)
      .post('/api/v1/moods')
      .set('Authorization', `Bearer ${token}`)
      .send({ localDate: '2026-10-12', moodEmoji: '😐' });

    expect(res.status).toBe(201);
    expect(res.body.streak.currentStreak).toBe(1); // Streak reset due to missed day
    expect(res.body.streak.longestStreak).toBe(2); // Longest streak preserved
  });
});
