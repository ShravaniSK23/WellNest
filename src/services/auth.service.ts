import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { comparePassword, hashPassword, validatePasswordStrength } from '../utils/password.js';
import { generateToken, generateMfaPendingToken } from '../utils/jwt.js';
import { generateMfaSecret, generateQrCode, verifyMfaCode } from '../utils/mfa.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  AccountLockedError,
  MfaRequiredError,
  NotFoundError,
} from '../utils/errors.js';
import { AuditService } from './audit.service.js';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: 'HELP_SEEKER' | 'THERAPIST' | 'MODERATOR' | 'ADMIN';
  timezone?: string;
  licenseNumber?: string;
  qualifications?: string;
  biography?: string;
}

export class AuthService {
  public static async register(dto: RegisterDTO) {
    if (!validatePasswordStrength(dto.password)) {
      throw new BadRequestError(
        'Password must be at least 8 characters long and contain at least one letter and one number'
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    // Transaction for user & profile creation
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role,
          // Auto-verify email for dev/test simplicity if needed, but track verification link token
          isEmailVerified: true,
        },
      });

      if (dto.role === 'HELP_SEEKER') {
        await tx.helpSeeker.create({
          data: {
            userId: newUser.id,
            fullName: dto.fullName,
            timezone: dto.timezone || 'UTC',
          },
        });
      } else if (dto.role === 'THERAPIST') {
        if (!dto.licenseNumber) {
          throw new BadRequestError('License number is required for therapist registration');
        }
        await tx.therapist.create({
          data: {
            userId: newUser.id,
            fullName: dto.fullName,
            licenseNumber: dto.licenseNumber,
            qualifications: dto.qualifications || 'Licensed Professional',
            biography: dto.biography || 'Mental health professional.',
            consultationFee: 0.0,
            verificationStatus: 'UNVERIFIED',
            isVisible: false,
          },
        });
      } else if (dto.role === 'MODERATOR') {
        await tx.moderator.create({
          data: {
            userId: newUser.id,
            department: 'Community Safety',
          },
        });
      } else if (dto.role === 'ADMIN') {
        await tx.admin.create({
          data: {
            userId: newUser.id,
            permissionLevel: 'FULL',
          },
        });
      }

      return newUser;
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: `user:${user.id}`,
      payloadSummary: { role: user.role, email: user.email },
    });

    return {
      message: 'Account registered successfully.',
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  public static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { helpSeeker: true, therapist: true, moderator: true, admin: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout (REQ-UA-7: 5 failed attempts -> 15 min lock)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AccountLockedError(
        `Account locked due to 5 failed login attempts. Please try again in ${waitMinutes} minute(s).`
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      const newFailedCount = user.failedLoginCount + 1;
      let lockedUntil: Date | null = null;
      if (newFailedCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockedUntil,
        },
      });

      await AuditService.logAction({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: `user:${user.id}`,
        ipAddress,
        userAgent,
        payloadSummary: { failedLoginCount: newFailedCount, locked: !!lockedUntil },
      });

      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed count on successful password check
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    // Create session record (30-minute inactivity limit tracking)
    const sessionTokenHash = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sessionTokenHash,
        lastActivityAt: new Date(),
        expiresAt,
      },
    });

    // Check MFA Requirements (SE-9)
    // Mandatory for THERAPIST, MODERATOR, ADMIN. Optional for HELP_SEEKER unless enabled.
    const isMfaRequired = ['THERAPIST', 'MODERATOR', 'ADMIN'].includes(user.role) || user.mfaEnabled;

    if (isMfaRequired) {
      if (!user.mfaEnabled || !user.mfaSecret) {
        // Must enroll in MFA first
        const mfaPendingToken = generateMfaPendingToken(user.id, user.role, session.id);
        throw new MfaRequiredError(mfaPendingToken, 'MFA enrollment is required for your account role before login');
      }

      // MFA required step
      const mfaPendingToken = generateMfaPendingToken(user.id, user.role, session.id);
      return {
        mfaRequired: true,
        mfaPendingToken,
        message: 'MFA token verification required.',
      };
    }

    // Generate full session access token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      sessionId: session.id,
      isMfaVerified: true,
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: `user:${user.id}`,
      ipAddress,
      userAgent,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  public static async setupMfa(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const { secret, otpauthUrl } = generateMfaSecret(user.email);
    const qrCodeUrl = await generateQrCode(otpauthUrl);

    // Save temporary secret
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCodeUrl };
  }

  public static async verifyMfaAndLogin(userId: string, sessionId: string, mfaCode: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedError('MFA not configured for user');
    }

    const isValid = verifyMfaCode(mfaCode, user.mfaSecret);
    if (!isValid) {
      throw new UnauthorizedError('Invalid MFA verification code');
    }

    // Enable MFA status
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    // Generate full access token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      sessionId,
      isMfaVerified: true,
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'MFA_VERIFIED_LOGIN',
      resource: `user:${user.id}`,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  public static async logout(sessionId: string) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully.' };
  }

  public static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.deletedAt) {
      // Return success to avoid email enumeration
      return { message: 'If an account exists for this email, a reset token has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        tokenType: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: `user:${user.id}`,
    });

    return {
      message: 'If an account exists for this email, a reset token has been sent.',
      resetToken, // Returned for testing/dev API usage
    };
  }

  public static async resetPassword(token: string, newPassword: string) {
    if (!validatePasswordStrength(newPassword)) {
      throw new BadRequestError('Password must be at least 8 characters long and contain a letter and a number');
    }

    const resetRecord = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.tokenType !== 'PASSWORD_RESET' || resetRecord.expiresAt < new Date()) {
      throw new BadRequestError('Password reset link is invalid or has expired (30-min expiration rule)');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      prisma.verificationToken.delete({
        where: { id: resetRecord.id },
      }),
      prisma.session.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    await AuditService.logAction({
      userId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: `user:${resetRecord.userId}`,
    });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }
}
