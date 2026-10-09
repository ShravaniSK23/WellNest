import { prisma } from '../db/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { generateToken } from '../utils/jwt.js';

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

export const videoService: IVideoService = new MockVideoService();
