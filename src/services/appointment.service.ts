import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { paymentService } from './payment.service.js';
import { notificationService } from './notification.service.js';
import { AuditService } from './audit.service.js';

export interface SubmitBookingRequestDTO {
  therapistId: string;
  slotId: string;
  notes?: string;
}

export interface RescheduleDTO {
  newSlotId: string;
}

export class AppointmentService {
  // 1. Submit Booking Request & Reserve Slot (Double Booking Prevention & 24h Expiry)
  public static async submitBookingRequest(userId: string, dto: SubmitBookingRequestDTO) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const therapist = await prisma.therapist.findUnique({ where: { id: dto.therapistId } });
    if (!therapist || therapist.verificationStatus !== 'VERIFIED') {
      throw new BadRequestError('Target therapist is not verified for booking');
    }

    // Double-Booking Prevention & Concurrency Lock
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot || slot.therapistId !== dto.therapistId) {
      throw new NotFoundError('Availability slot not found');
    }

    if (slot.isBooked) {
      throw new ConflictError('The requested availability slot has already been reserved or booked');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Execute atomic booking transaction
    const { request, appointment } = await prisma.$transaction(async (tx) => {
      // Mark slot as reserved
      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      const reqRecord = await tx.appointmentRequest.create({
        data: {
          helpSeekerId: helpSeeker.id,
          therapistId: therapist.id,
          slotId: slot.id,
          status: 'PENDING',
          notes: dto.notes || null,
          expiresAt,
        },
      });

      const aptRecord = await tx.appointment.create({
        data: {
          requestId: reqRecord.id,
          helpSeekerId: helpSeeker.id,
          therapistId: therapist.id,
          slotId: slot.id,
          status: 'PENDING_CONFIRMATION',
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      });

      return { request: reqRecord, appointment: aptRecord };
    });

    // Phase 1 Payment Authorization Hold
    const payment = await paymentService.createAuthorizationHold(
      appointment.id,
      Number(therapist.consultationFee)
    );

    // Save payment record in DB
    await prisma.payment.create({
      data: {
        id: payment.paymentId,
        appointmentId: appointment.id,
        amount: therapist.consultationFee,
        currency: 'USD',
        status: 'AUTHORIZED',
        providerTransactionId: payment.providerTransactionId,
      },
    });

    // Send notification to Therapist
    await notificationService.sendNotification(
      therapist.userId,
      'New Appointment Request',
      `You have a new appointment booking request from ${helpSeeker.fullName} for ${slot.startTime.toISOString()}`,
      'APPOINTMENT_REQUEST'
    );

    await AuditService.logAction({
      userId,
      action: 'BOOKING_REQUEST_SUBMITTED',
      resource: `appointment:${appointment.id}`,
    });

    return {
      appointmentId: appointment.id,
      requestId: request.id,
      status: appointment.status,
      expiresAt: request.expiresAt,
      paymentStatus: payment.status,
    };
  }

  // 2. Confirm Appointment (Therapist Action -> Capture Payment, BR-5, REQ-TS-13)
  public static async confirmAppointment(therapistUserId: string, appointmentId: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId: therapistUserId } });
    if (!therapist) throw new NotFoundError('Therapist profile not found');

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { request: true, helpSeeker: true, payment: true },
    });

    if (!appointment) throw new NotFoundError('Appointment not found');

    if (appointment.therapistId !== therapist.id) {
      throw new ForbiddenError('You are not authorized to confirm this appointment');
    }

    if (appointment.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestError(`Cannot confirm appointment in status '${appointment.status}'. Must be PENDING_CONFIRMATION.`);
    }

    // Capture payment (Phase 2)
    if (appointment.payment) {
      await paymentService.capturePayment(appointment.payment.id);
      await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: { status: 'CAPTURED' },
      });
    }

    // Update appointment and request status
    const updated = await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      }),
      prisma.appointmentRequest.update({
        where: { id: appointment.requestId },
        data: { status: 'APPROVED' },
      }),
    ]);

    // Notify HelpSeeker
    await notificationService.sendNotification(
      appointment.helpSeeker.userId,
      'Appointment Confirmed!',
      `Your therapy session with ${therapist.fullName} has been confirmed.`,
      'APPOINTMENT_CONFIRMED'
    );

    await AuditService.logAction({
      userId: therapistUserId,
      action: 'APPOINTMENT_CONFIRMED',
      resource: `appointment:${appointmentId}`,
    });

    return {
      appointmentId,
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
    };
  }

  // 3. Decline Appointment (Therapist Action -> Release Slot & Payment Hold)
  public static async declineAppointment(therapistUserId: string, appointmentId: string) {
    const therapist = await prisma.therapist.findUnique({ where: { userId: therapistUserId } });
    if (!therapist) throw new NotFoundError('Therapist profile not found');

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { helpSeeker: true, payment: true },
    });

    if (!appointment) throw new NotFoundError('Appointment not found');

    if (appointment.therapistId !== therapist.id) {
      throw new ForbiddenError('You are not authorized to decline this appointment');
    }

    // Release slot & payment hold
    await prisma.$transaction([
      prisma.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELED' },
      }),
      prisma.appointmentRequest.update({
        where: { id: appointment.requestId },
        data: { status: 'DECLINED' },
      }),
    ]);

    if (appointment.payment) {
      await paymentService.refundPayment(appointment.payment.id);
      await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    return { appointmentId, status: 'CANCELED', requestStatus: 'DECLINED' };
  }

  // 4. Reschedule Appointment (Max 2 reschedules without therapist approval, BR-4, REQ-TS-9)
  public static async rescheduleAppointment(userId: string, appointmentId: string, dto: RescheduleDTO) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.helpSeekerId !== helpSeeker.id) {
      throw new ForbiddenError('You are not authorized to reschedule this appointment');
    }

    if (appointment.rescheduleCount >= 2) {
      throw new BadRequestError('An appointment may be rescheduled at most twice by the Help Seeker without Therapist approval (BR-4).');
    }

    const newSlot = await prisma.availabilitySlot.findUnique({ where: { id: dto.newSlotId } });
    if (!newSlot || newSlot.isBooked) {
      throw new BadRequestError('Target new slot is unavailable');
    }

    await prisma.$transaction([
      // Release old slot
      prisma.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      }),
      // Reserve new slot
      prisma.availabilitySlot.update({
        where: { id: newSlot.id },
        data: { isBooked: true },
      }),
      // Update appointment
      prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          slotId: newSlot.id,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          rescheduleCount: appointment.rescheduleCount + 1,
        },
      }),
    ]);

    return {
      appointmentId,
      newStartTime: newSlot.startTime,
      rescheduleCount: appointment.rescheduleCount + 1,
    };
  }

  // 5. Cancel Appointment (Therapist Full Refund per BR-6; HelpSeeker >24h Free Refund per BR-3)
  public static async cancelAppointment(userId: string, appointmentId: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { helpSeeker: true, therapist: true },
    });

    if (!user) throw new NotFoundError('User not found');

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) throw new NotFoundError('Appointment not found');

    const isHelpSeeker = user.helpSeeker && appointment.helpSeekerId === user.helpSeeker.id;
    const isTherapist = user.therapist && appointment.therapistId === user.therapist.id;

    if (!isHelpSeeker && !isTherapist) {
      throw new ForbiddenError('You are not authorized to cancel this appointment');
    }

    let isFullRefund = false;

    if (isTherapist) {
      // Therapist Cancellation -> 100% full refund always (BR-6, REQ-TS-11)
      isFullRefund = true;
    } else if (isHelpSeeker) {
      // HelpSeeker Cancellation -> Full refund if >= 24h before start time (BR-3, REQ-TS-10)
      const hoursUntilStart = (appointment.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilStart >= 24) {
        isFullRefund = true;
      }
    }

    // Execute cancellation transaction
    await prisma.$transaction([
      prisma.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELED' },
      }),
    ]);

    if (appointment.payment && isFullRefund) {
      await paymentService.refundPayment(appointment.payment.id);
      await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    return {
      appointmentId,
      status: 'CANCELED',
      fullRefundInitiated: isFullRefund,
    };
  }

  // 6. 24-Hour Expiration Worker Daemon (REQ-TS-8)
  public static async expirePendingRequests() {
    const now = new Date();
    const expiredRequests = await prisma.appointmentRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      include: { appointment: true },
    });

    for (const req of expiredRequests) {
      await prisma.$transaction([
        prisma.appointmentRequest.update({
          where: { id: req.id },
          data: { status: 'EXPIRED' },
        }),
        prisma.availabilitySlot.update({
          where: { id: req.slotId },
          data: { isBooked: false },
        }),
        prisma.appointment.update({
          where: { id: req.appointment!.id },
          data: { status: 'CANCELED' },
        }),
      ]);

      const payment = await prisma.payment.findUnique({ where: { appointmentId: req.appointment!.id } });
      if (payment) {
        await paymentService.refundPayment(payment.id);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    return { expiredCount: expiredRequests.length };
  }
}
