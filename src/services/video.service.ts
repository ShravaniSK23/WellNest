import { prisma } from '../db/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface VideoSessionResponse {
  appointmentId: string;
  videoRoomUrl: string;
  sessionToken: string;
  expiresAt: Date;
}

export interface IVideoService {
  generateSessionToken(appointmentId: string, userId: string): Promise<VideoSessionResponse>;
}

export class MockVideoService implements IVideoService {
  public async generateSessionToken(appointmentId: string, userId: string): Promise<VideoSessionResponse> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        helpSeeker: true,
        therapist: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestError(`Video link is only available for CONFIRMED appointments. Current status: ${appointment.status}`);
    }

    // 1. Participant Authorization Check (REQ-TS-15): Restricted ONLY to assigned HelpSeeker or Therapist
    const isHelpSeeker = appointment.helpSeeker.userId === userId;
    const isTherapist = appointment.therapist.userId === userId;

    if (!isHelpSeeker && !isTherapist) {
      throw new ForbiddenError('Access denied. You are not an authorized participant for this video consultation.');
    }

    // 2. 10-Minute Early Access Check (REQ-TS-16): Active no earlier than 10 minutes before start
    const now = new Date();
    const startTimeMs = appointment.startTime.getTime();
    const tenMinutesBeforeMs = startTimeMs - 10 * 60 * 1000;

    if (now.getTime() < tenMinutesBeforeMs) {
      const waitMinutes = Math.ceil((startTimeMs - now.getTime()) / (60 * 1000));
      throw new ForbiddenError(
        `Video consultation link becomes active 10 minutes prior to scheduled start time. Please return in ${waitMinutes - 10} minute(s).`
      );
    }

    if (now.getTime() > appointment.endTime.getTime()) {
      throw new BadRequestError('This video consultation session has already concluded.');
    }

    // Generate single-use signed video token
    const sessionToken = generateToken(
      {
        userId,
        role: isHelpSeeker ? 'HELP_SEEKER' : 'THERAPIST',
        sessionId: `video-${appointmentId}`,
        isMfaVerified: true,
      },
      '1h'
    );

    const videoRoomUrl = `https://video.wellnest.org/room/apt-${appointmentId}`;

    return {
      appointmentId,
      videoRoomUrl,
      sessionToken,
      expiresAt: appointment.endTime,
    };
  }
}

export class DailyVideoService implements IVideoService {
  private apiKey: string;
  private apiBaseUrl: string = 'https://api.daily.co/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async generateSessionToken(appointmentId: string, userId: string): Promise<VideoSessionResponse> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        helpSeeker: true,
        therapist: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestError(`Video link is only available for CONFIRMED appointments. Current status: ${appointment.status}`);
    }

    // 1. Participant Authorization Check (REQ-TS-15): Restricted ONLY to assigned HelpSeeker or Therapist
    const isHelpSeeker = appointment.helpSeeker.userId === userId;
    const isTherapist = appointment.therapist.userId === userId;

    if (!isHelpSeeker && !isTherapist) {
      throw new ForbiddenError('Access denied. You are not an authorized participant for this video consultation.');
    }

    // 2. 10-Minute Early Access Check (REQ-TS-16): Active no earlier than 10 minutes before start
    const now = new Date();
    const startTimeMs = appointment.startTime.getTime();
    const tenMinutesBeforeMs = startTimeMs - 10 * 60 * 1000;

    if (now.getTime() < tenMinutesBeforeMs) {
      const waitMinutes = Math.ceil((startTimeMs - now.getTime()) / (60 * 1000));
      throw new ForbiddenError(
        `Video consultation link becomes active 10 minutes prior to scheduled start time. Please return in ${waitMinutes - 10} minute(s).`
      );
    }

    if (now.getTime() > appointment.endTime.getTime()) {
      throw new BadRequestError('This video consultation session has already concluded.');
    }

    const roomName = `apt-${appointmentId}`;
    const nbfSec = Math.floor(tenMinutesBeforeMs / 1000);
    const expSec = Math.floor(appointment.endTime.getTime() / 1000);

    // Create room server-side
    let videoRoomUrl: string;
    try {
      const roomRes = await fetch(`${this.apiBaseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            nbf: nbfSec,
            exp: expSec,
            eject_at_room_exp: true,
          },
        }),
      });

      if (roomRes.ok) {
        const roomData = (await roomRes.json()) as any;
        videoRoomUrl = roomData.url;
      } else {
        const errData = (await roomRes.json()) as any;
        if (roomRes.status === 400 && (errData?.info?.includes('already exists') || errData?.error?.includes('already exists'))) {
          const getRoomRes = await fetch(`${this.apiBaseUrl}/rooms/${roomName}`, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          });
          if (getRoomRes.ok) {
            const existingRoom = (await getRoomRes.json()) as any;
            videoRoomUrl = existingRoom.url;
          } else {
            throw new Error(`Failed to retrieve existing room: ${getRoomRes.statusText}`);
          }
        } else {
          throw new Error(`Daily room creation failed: ${errData?.message || roomRes.statusText}`);
        }
      }
    } catch (err: any) {
      logger.error({ err }, '[DAILY ERROR] Room creation failed');
      throw new BadRequestError(`Daily video room creation failed: ${err.message}`);
    }

    // Create meeting token server-side
    let sessionToken: string;
    try {
      const participantName = isHelpSeeker ? appointment.helpSeeker.fullName : appointment.therapist.fullName;
      const tokenRes = await fetch(`${this.apiBaseUrl}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_id: userId,
            user_name: participantName,
            nbf: nbfSec,
            exp: expSec,
            is_owner: isTherapist,
          },
        }),
      });

      if (!tokenRes.ok) {
        const errData = (await tokenRes.json()) as any;
        throw new Error(`Daily meeting token creation failed: ${errData?.message || tokenRes.statusText}`);
      }

      const tokenData = (await tokenRes.json()) as any;
      sessionToken = tokenData.token;
    } catch (err: any) {
      logger.error({ err }, '[DAILY ERROR] Meeting token generation failed');
      throw new BadRequestError(`Daily meeting token generation failed: ${err.message}`);
    }

    return {
      appointmentId,
      videoRoomUrl,
      sessionToken,
      expiresAt: appointment.endTime,
    };
  }
}

export const videoService: IVideoService =
  env.NODE_ENV !== 'test' && env.DAILY_API_KEY
    ? new DailyVideoService(env.DAILY_API_KEY)
    : new MockVideoService();
