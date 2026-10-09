import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { AuditService } from './audit.service.js';

export class TherapistService {
  public static async submitCredentials(userId: string, documentType: string, documentUrl: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) {
      throw new NotFoundError('Therapist profile not found');
    }

    const document = await prisma.credentialDocument.create({
      data: {
        therapistId: therapist.id,
        documentType,
        documentUrl,
        status: 'PENDING_REVIEW',
      },
    });

    // Update therapist status to pending review
    await prisma.therapist.update({
      where: { id: therapist.id },
      data: { verificationStatus: 'PENDING_REVIEW' },
    });

    await AuditService.logAction({
      userId,
      action: 'THERAPIST_CREDENTIAL_SUBMITTED',
      resource: `credential:${document.id}`,
      payloadSummary: { documentType, documentUrl },
    });

    return document;
  }

  public static async getPendingVerifications() {
    return prisma.therapist.findMany({
      where: { verificationStatus: 'PENDING_REVIEW' },
      include: {
        credentials: true,
        user: { select: { email: true, createdAt: true } },
      },
    });
  }

  public static async verifyTherapist(adminUserId: string, therapistId: string, decision: 'VERIFIED' | 'REJECTED', notes?: string) {
    const therapist = await prisma.therapist.findUnique({ where: { id: therapistId } });
    if (!therapist) {
      throw new NotFoundError('Therapist not found');
    }

    const isVerified = decision === 'VERIFIED';

    const updatedTherapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        verificationStatus: decision,
        isVisible: isVerified,
      },
    });

    // Update credentials status
    await prisma.credentialDocument.updateMany({
      where: { therapistId },
      data: { status: decision },
    });

    await AuditService.logAction({
      userId: adminUserId,
      action: `THERAPIST_VERIFICATION_${decision}`,
      resource: `therapist:${therapistId}`,
      payloadSummary: { decision, notes },
    });

    return updatedTherapist;
  }
}
