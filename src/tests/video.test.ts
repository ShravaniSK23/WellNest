import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { generateToken } from '../utils/jwt.js';

let mockAppointmentStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now (within 10-min window)
let mockAppointmentStatus = 'CONFIRMED';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(async ({ where }) => ({
        id: where.id,
        userId: where.id.includes('seeker') ? 'u-video-seeker' : where.id.includes('therapist') ? 'u-video-therapist' : 'u-third-party',
        isRevoked: false,
        lastActivityAt: new Date(),
      })),
      update: vi.fn(async () => ({})),
    },
    appointment: {
      findUnique: vi.fn(async () => ({
        id: 'apt-video-1',
        status: mockAppointmentStatus,
        startTime: mockAppointmentStartTime,
        endTime: new Date(mockAppointmentStartTime.getTime() + 60 * 60 * 1000),
        helpSeeker: { userId: 'u-video-seeker' },
        therapist: { userId: 'u-video-therapist' },
      })),
    },
  },
}));

describe('WebRTC Video Session Security & Access Control', () => {
  const seekerToken = generateToken({
    userId: 'u-video-seeker',
    role: 'HELP_SEEKER',
    sessionId: 'sess-seeker-vid',
    isMfaVerified: true,
  });

  const thirdPartyToken = generateToken({
    userId: 'u-third-party',
    role: 'HELP_SEEKER',
    sessionId: 'sess-third-vid',
    isMfaVerified: true,
  });

  it('should deny video session token generation for uninvolved third-party users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/appointments/apt-video-1/video-token')
      .set('Authorization', `Bearer ${thirdPartyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('not an authorized participant');
  });

  it('should deny video session token generation > 10 minutes before start time (403 Forbidden)', async () => {
    // Set appointment start time to 30 minutes in the future
    mockAppointmentStartTime = new Date(Date.now() + 30 * 60 * 1000);

    const res = await request(app)
      .get('/api/v1/appointments/apt-video-1/video-token')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('active 10 minutes prior');
  });

  it('should issue video session token when requested <= 10 minutes before start time by authorized participant', async () => {
    // Set appointment start time to 5 minutes in the future (within 10-min window)
    mockAppointmentStartTime = new Date(Date.now() + 5 * 60 * 1000);

    const res = await request(app)
      .get('/api/v1/appointments/apt-video-1/video-token')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.videoRoomUrl).toBeDefined();
    expect(res.body.sessionToken).toBeDefined();
  });
});
