import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { AuditService } from './audit.service.js';

export interface TherapistSearchFilters {
  specialization?: string;
  language?: string;
  minFee?: number;
  maxFee?: number;
  availableDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateSlotDTO {
  startTime: string; // ISO string
  endTime: string;   // ISO string
}

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

  // Verified-Only Search (BR-1, BR-2, REQ-TS-4)
  public static async searchTherapists(filters: TherapistSearchFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: 'VERIFIED',
      isVisible: true,
    };

    if (filters.specialization) {
      where.qualifications = { contains: filters.specialization, mode: 'insensitive' };
    }

    if (filters.minFee !== undefined || filters.maxFee !== undefined) {
      where.consultationFee = {};
      if (filters.minFee !== undefined) where.consultationFee.gte = filters.minFee;
      if (filters.maxFee !== undefined) where.consultationFee.lte = filters.maxFee;
    }

    const [therapists, total] = await Promise.all([
      prisma.therapist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { averageRating: 'desc' },
      }),
      prisma.therapist.count({ where }),
    ]);

    return {
      therapists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getTherapistProfile(therapistId: string) {
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: {
        user: { select: { email: true } },
        credentials: true,
      },
    });

    if (!therapist || therapist.verificationStatus !== 'VERIFIED') {
      throw new NotFoundError('Verified therapist profile not found');
    }

    return therapist;
  }

  // Availability Slot Management (Next 14 Calendar Days, REQ-TS-5)
  public static async createAvailabilitySlot(userId: string, dto: CreateSlotDTO) {
    const therapist = await prisma.therapist.findUnique({ where: { userId } });
    if (!therapist) throw new NotFoundError('Therapist profile not found');

    if (therapist.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenError('Only verified therapists can create availability slots.');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const now = new Date();

    if (start.getTime() <= now.getTime()) {
      throw new BadRequestError('Availability slot start time must be in the future.');
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestError('Slot end time must be after start time.');
    }

    // Check 14 days limit
    const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (start.getTime() > fourteenDaysAhead.getTime()) {
      throw new BadRequestError('Availability slots can only be created for the next 14 calendar days.');
    }

    // Check conflict / duplicate slot
    const existing = await prisma.availabilitySlot.findUnique({
      where: {
        therapistId_startTime: {
          therapistId: therapist.id,
          startTime: start,
        },
      },
    });

    if (existing) {
      throw new BadRequestError('An availability slot already exists for this start time.');
    }

    return prisma.availabilitySlot.create({
      data: {
        therapistId: therapist.id,
        startTime: start,
        endTime: end,
        isBooked: false,
      },
    });
  }

  public static async getTherapistSlots(therapistId: string) {
    const now = new Date();
    const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return prisma.availabilitySlot.findMany({
      where: {
        therapistId,
        isBooked: false,
        startTime: {
          gte: now,
          lte: fourteenDaysAhead,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
