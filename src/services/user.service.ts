import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { comparePassword, hashPassword, validatePasswordStrength } from '../utils/password.js';

export class UserService {
  public static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        helpSeeker: true,
        therapist: {
          include: { credentials: true },
        },
        moderator: true,
        admin: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundError('User profile not found');
    }

    const { passwordHash, mfaSecret, ...safeUser } = user;
    return safeUser;
  }

  public static async updateProfile(userId: string, data: { fullName?: string; timezone?: string; biography?: string; qualifications?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { helpSeeker: true, therapist: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundError('User profile not found');
    }

    if (user.role === 'HELP_SEEKER' && user.helpSeeker) {
      await prisma.helpSeeker.update({
        where: { id: user.helpSeeker.id },
        data: {
          fullName: data.fullName ?? user.helpSeeker.fullName,
          timezone: data.timezone ?? user.helpSeeker.timezone,
        },
      });
    } else if (user.role === 'THERAPIST' && user.therapist) {
      await prisma.therapist.update({
        where: { id: user.therapist.id },
        data: {
          fullName: data.fullName ?? user.therapist.fullName,
          biography: data.biography ?? user.therapist.biography,
          qualifications: data.qualifications ?? user.therapist.qualifications,
        },
      });
    }

    return this.getUserProfile(userId);
  }

  public static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    if (!validatePasswordStrength(newPassword)) {
      throw new BadRequestError('New password must be at least 8 characters long and contain at least one letter and one number');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke active sessions
    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully. All other active sessions have been invalidated.' };
  }

  public static async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete / anonymize user PII per SE-10
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `anonymized_${userId}@wellnest.deleted`,
        isEmailVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Account anonymized and deleted successfully.' };
  }
}
