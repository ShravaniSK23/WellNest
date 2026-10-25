import { apiClient } from './apiClient';
import { therapistApi } from './therapistApi';
import type {
  Appointment,
  AppointmentRequestItem,
  BookingRequestPayload,
  BookingResponse,
  ReschedulePayload,
  RescheduleResponse,
  CancelPayload,
  CancelResponse,
  VideoSessionTokenResponse,
} from '../types/appointment.types';

const APPOINTMENTS_STORAGE_KEY = 'wellnest_appointments_v1';
const REQUESTS_STORAGE_KEY = 'wellnest_incoming_requests_v1';

// Seed initial realistic appointments covering ALL appointment states
const createSeedAppointments = (): {
  appointments: Appointment[];
  requests: AppointmentRequestItem[];
} => {
  const now = new Date();

  // 1. Confirmed Upcoming Session (Tomorrow at 10 AM)
  const tomorrow10am = new Date(now);
  tomorrow10am.setDate(now.getDate() + 1);
  tomorrow10am.setHours(10, 0, 0, 0);
  const tomorrow10amEnd = new Date(tomorrow10am);
  tomorrow10amEnd.setMinutes(50);

  // 2. Pending Confirmation Request (In 2 days at 2 PM, created 2 hours ago)
  const in2days = new Date(now);
  in2days.setDate(now.getDate() + 2);
  in2days.setHours(14, 0, 0, 0);
  const in2daysEnd = new Date(in2days);
  in2daysEnd.setMinutes(50);
  const expiresAt24h = new Date(now.getTime() + 22 * 60 * 60 * 1000); // 22h left

  // 3. Completed Past Session (5 days ago)
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 5);
  fiveDaysAgo.setHours(11, 0, 0, 0);
  const fiveDaysAgoEnd = new Date(fiveDaysAgo);
  fiveDaysAgoEnd.setMinutes(50);

  // 4. Canceled Session with Full Refund (3 days ago canceled)
  const canceledDate = new Date(now);
  canceledDate.setDate(now.getDate() + 4);
  canceledDate.setHours(16, 0, 0, 0);
  const canceledDateEnd = new Date(canceledDate);
  canceledDateEnd.setMinutes(50);

  // 5. Imminent Session (Starts in 5 minutes! To demonstrate Video Join Active state!)
  const imminentStart = new Date(now.getTime() + 5 * 60 * 1000);
  const imminentEnd = new Date(imminentStart.getTime() + 50 * 60 * 1000);

  const initialAppointments: Appointment[] = [
    {
      id: 'apt-imminent-001',
      requestId: 'req-imm-001',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9901',
      therapistName: 'Dr. Sarah Jenkins',
      therapistQualifications: 'Ph.D. in Clinical Psychology (PSY-48291)',
      therapistFee: 95.0,
      slotId: 'slot-t-7788-9901-imm-1',
      status: 'CONFIRMED',
      startTime: imminentStart.toISOString(),
      endTime: imminentEnd.toISOString(),
      rescheduleCount: 0,
      notes: 'Experiencing sudden peak anxiety before college presentation.',
      paymentStatus: 'CAPTURED',
      refundStatus: 'NOT_APPLICABLE',
      payment: {
        id: 'pay-imm-001',
        appointmentId: 'apt-imminent-001',
        amount: 95.0,
        currency: 'USD',
        status: 'CAPTURED',
        providerTransactionId: 'pi_demo_imminent_998',
      },
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'apt-conf-002',
      requestId: 'req-conf-002',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9902',
      therapistName: 'Dr. Marcus Vance',
      therapistQualifications: 'M.D. Psychiatry (LIC-88120)',
      therapistFee: 120.0,
      slotId: 'slot-t-7788-9902-1-1',
      status: 'CONFIRMED',
      startTime: tomorrow10am.toISOString(),
      endTime: tomorrow10amEnd.toISOString(),
      rescheduleCount: 1, // 1 used of 2 allowed
      notes: 'Follow-up on sleep hygiene and stress management progress.',
      paymentStatus: 'CAPTURED',
      refundStatus: 'NOT_APPLICABLE',
      payment: {
        id: 'pay-conf-002',
        appointmentId: 'apt-conf-002',
        amount: 120.0,
        currency: 'USD',
        status: 'CAPTURED',
        providerTransactionId: 'pi_demo_conf_881',
      },
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'apt-pend-003',
      requestId: 'req-pend-003',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9903',
      therapistName: 'Dr. Elena Rostova',
      therapistQualifications: 'Psy.D. Counseling Psychology (LIC-31902)',
      therapistFee: 85.0,
      slotId: 'slot-t-7788-9903-2-1',
      status: 'PENDING_CONFIRMATION',
      startTime: in2days.toISOString(),
      endTime: in2daysEnd.toISOString(),
      rescheduleCount: 0,
      notes: 'Initial consultation regarding family conflict and chronic tension.',
      paymentStatus: 'AUTHORIZED', // Phase 1 Hold
      refundStatus: 'NOT_APPLICABLE',
      expiresAt: expiresAt24h.toISOString(),
      payment: {
        id: 'pay-pend-003',
        appointmentId: 'apt-pend-003',
        amount: 85.0,
        currency: 'USD',
        status: 'AUTHORIZED',
        providerTransactionId: 'pi_hold_pend_319',
      },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'apt-past-004',
      requestId: 'req-past-004',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9901',
      therapistName: 'Dr. Sarah Jenkins',
      therapistQualifications: 'Ph.D. in Clinical Psychology (PSY-48291)',
      therapistFee: 95.0,
      slotId: 'slot-t-7788-9901-past-1',
      status: 'COMPLETED',
      startTime: fiveDaysAgo.toISOString(),
      endTime: fiveDaysAgoEnd.toISOString(),
      rescheduleCount: 0,
      notes: 'Introduction and intake review.',
      paymentStatus: 'CAPTURED',
      refundStatus: 'NOT_APPLICABLE',
      payment: {
        id: 'pay-past-004',
        appointmentId: 'apt-past-004',
        amount: 95.0,
        currency: 'USD',
        status: 'CAPTURED',
        providerTransactionId: 'pi_demo_past_111',
      },
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: fiveDaysAgoEnd.toISOString(),
    },
    {
      id: 'apt-canc-005',
      requestId: 'req-canc-005',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9904',
      therapistName: 'Dr. Alex Rivera',
      therapistQualifications: 'LMFT (MFT-55019)',
      therapistFee: 80.0,
      slotId: 'slot-t-7788-9904-4-1',
      status: 'CANCELED',
      startTime: canceledDate.toISOString(),
      endTime: canceledDateEnd.toISOString(),
      rescheduleCount: 0,
      notes: 'Canceled early due to exam schedule overlap.',
      cancellationReason: 'Scheduled conflict with university finals.',
      paymentStatus: 'REFUNDED',
      refundStatus: 'FULL_REFUND_INITIATED',
      refundAmount: 80.0,
      payment: {
        id: 'pay-canc-005',
        appointmentId: 'apt-canc-005',
        amount: 80.0,
        currency: 'USD',
        status: 'REFUNDED',
        providerTransactionId: 'pi_demo_canc_550',
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const initialRequests: AppointmentRequestItem[] = [
    {
      id: 'req-pend-003',
      appointmentId: 'apt-pend-003',
      helpSeekerId: 'u-helpseeker-me',
      helpSeekerName: 'Alex Morgan',
      therapistId: 't-7788-9903',
      slotId: 'slot-t-7788-9903-2-1',
      startTime: in2days.toISOString(),
      endTime: in2daysEnd.toISOString(),
      status: 'PENDING',
      notes: 'Initial consultation regarding family conflict and chronic tension.',
      expiresAt: expiresAt24h.toISOString(),
      paymentStatus: 'AUTHORIZED',
      fee: 85.0,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-incoming-101',
      appointmentId: 'apt-incoming-101',
      helpSeekerId: 'u-patient-clara',
      helpSeekerName: 'Clara Oswald',
      therapistId: 't-7788-9901', // Assigned to Dr. Jenkins
      slotId: 'slot-t-7788-9901-3-2',
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      status: 'PENDING',
      notes: 'Seeking assistance coping with sudden job loss and panic attacks.',
      expiresAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 18h left
      paymentStatus: 'AUTHORIZED',
      fee: 95.0,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return { appointments: initialAppointments, requests: initialRequests };
};

const getStoredAppointments = (): Appointment[] => {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse appointments from localStorage', e);
  }
  const seed = createSeedAppointments();
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(seed.appointments));
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(seed.requests));
  } catch (e) {
    // Ignore storage issues
  }
  return seed.appointments;
};

const saveStoredAppointments = (appointments: Appointment[]) => {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Failed to save appointments to localStorage', e);
  }
};

const getStoredRequests = (): AppointmentRequestItem[] => {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse requests from localStorage', e);
  }
  const seed = createSeedAppointments();
  return seed.requests;
};

const saveStoredRequests = (requests: AppointmentRequestItem[]) => {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save requests to localStorage', e);
  }
};

export const appointmentApi = {
  /**
   * Submit Booking Request & Reserve Slot
   * Strictly uses payment token - NEVER raw card numbers (PCI-DSS CO-3, SE-7)
   */
  async submitBookingRequest(payload: BookingRequestPayload): Promise<BookingResponse> {
    try {
      const response = await apiClient.post<BookingResponse>('/appointments/request', payload);
      therapistApi.markSlotBooked(payload.therapistId, payload.slotId, true);
      return response.data;
    } catch {
      // Local execution fallback
      const therapist = await therapistApi.getTherapistProfile(payload.therapistId);
      if (therapist.verificationStatus !== 'VERIFIED') {
        throw new Error('Target therapist is not verified for booking');
      }

      const slots = await therapistApi.getTherapistSlots(payload.therapistId);
      const slot = slots.find((s) => s.id === payload.slotId);
      if (!slot) {
        throw new Error('Availability slot not found');
      }
      if (slot.isBooked) {
        throw new Error('The requested availability slot has already been reserved or booked.');
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const appointmentId = `apt-${Date.now()}`;
      const requestId = `req-${Date.now()}`;

      // Mark slot as booked
      therapistApi.markSlotBooked(payload.therapistId, payload.slotId, true);

      const newAppointment: Appointment = {
        id: appointmentId,
        requestId,
        helpSeekerId: 'u-helpseeker-me',
        helpSeekerName: 'Alex Morgan',
        therapistId: therapist.id,
        therapistName: therapist.fullName,
        therapistQualifications: therapist.qualifications,
        therapistFee: therapist.consultationFee,
        slotId: slot.id,
        status: 'PENDING_CONFIRMATION',
        startTime: slot.startTime,
        endTime: slot.endTime,
        rescheduleCount: 0,
        notes: payload.notes,
        paymentStatus: 'AUTHORIZED', // Phase 1 Hold (ADR-004)
        refundStatus: 'NOT_APPLICABLE',
        expiresAt: expiresAt.toISOString(),
        payment: {
          id: `pay-${Date.now()}`,
          appointmentId,
          amount: therapist.consultationFee,
          currency: 'USD',
          status: 'AUTHORIZED',
          providerTransactionId: payload.paymentMethodToken,
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const existingAppointments = getStoredAppointments();
      saveStoredAppointments([newAppointment, ...existingAppointments]);

      // Add to incoming requests
      const newRequest: AppointmentRequestItem = {
        id: requestId,
        appointmentId,
        helpSeekerId: 'u-helpseeker-me',
        helpSeekerName: 'Alex Morgan',
        therapistId: therapist.id,
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'PENDING',
        notes: payload.notes,
        expiresAt: expiresAt.toISOString(),
        paymentStatus: 'AUTHORIZED',
        fee: therapist.consultationFee,
        createdAt: now.toISOString(),
      };
      const existingRequests = getStoredRequests();
      saveStoredRequests([newRequest, ...existingRequests]);

      return {
        appointmentId,
        requestId,
        status: 'PENDING_CONFIRMATION',
        expiresAt: expiresAt.toISOString(),
        paymentStatus: 'AUTHORIZED',
      };
    }
  },

  /**
   * Confirm Appointment (Therapist Action -> Capture Payment, BR-5, REQ-TS-13)
   */
  async confirmAppointment(
    appointmentId: string
  ): Promise<{ appointmentId: string; status: 'CONFIRMED'; paymentStatus: 'CAPTURED' }> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/confirm`);
      return response.data;
    } catch {
      const list = getStoredAppointments();
      const target = list.find((a) => a.id === appointmentId);
      if (target) {
        target.status = 'CONFIRMED';
        target.paymentStatus = 'CAPTURED';
        if (target.payment) target.payment.status = 'CAPTURED';
        target.updatedAt = new Date().toISOString();
        saveStoredAppointments(list);
      }

      const reqs = getStoredRequests();
      const req = reqs.find((r) => r.appointmentId === appointmentId);
      if (req) {
        req.status = 'APPROVED';
        req.paymentStatus = 'CAPTURED';
        saveStoredRequests(reqs);
      }

      return {
        appointmentId,
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
      };
    }
  },

  /**
   * Decline Appointment (Therapist Action -> Release Slot & Payment Hold)
   */
  async declineAppointment(
    appointmentId: string
  ): Promise<{ appointmentId: string; status: 'CANCELED'; requestStatus: 'DECLINED' }> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/decline`);
      return response.data;
    } catch {
      const list = getStoredAppointments();
      const target = list.find((a) => a.id === appointmentId);
      if (target) {
        target.status = 'CANCELED';
        target.paymentStatus = 'REFUNDED';
        target.refundStatus = 'FULL_REFUND_INITIATED';
        therapistApi.markSlotBooked(target.therapistId, target.slotId, false);
        saveStoredAppointments(list);
      }

      const reqs = getStoredRequests();
      const req = reqs.find((r) => r.appointmentId === appointmentId);
      if (req) {
        req.status = 'DECLINED';
        saveStoredRequests(reqs);
      }

      return {
        appointmentId,
        status: 'CANCELED',
        requestStatus: 'DECLINED',
      };
    }
  },

  /**
   * Reschedule Appointment (BR-4 / REQ-TS-9: Max 2 reschedules without therapist approval)
   */
  async rescheduleAppointment(
    appointmentId: string,
    payload: ReschedulePayload
  ): Promise<RescheduleResponse> {
    const list = getStoredAppointments();
    const target = list.find((a) => a.id === appointmentId);

    if (target && target.rescheduleCount >= 2) {
      throw new Error(
        'An appointment may be rescheduled at most twice by the Help Seeker without Therapist approval (BR-4).'
      );
    }

    try {
      const response = await apiClient.post<RescheduleResponse>(
        `/appointments/${appointmentId}/reschedule`,
        payload
      );
      return response.data;
    } catch {
      if (!target) throw new Error('Appointment not found');

      // Release old slot
      therapistApi.markSlotBooked(target.therapistId, target.slotId, false);

      // Fetch new slot info
      const slots = await therapistApi.getTherapistSlots(target.therapistId);
      const newSlot = slots.find((s) => s.id === payload.newSlotId);
      if (!newSlot || newSlot.isBooked) {
        throw new Error('Target new slot is unavailable.');
      }

      // Reserve new slot
      therapistApi.markSlotBooked(target.therapistId, newSlot.id, true);

      target.slotId = newSlot.id;
      target.startTime = newSlot.startTime;
      target.endTime = newSlot.endTime;
      target.rescheduleCount = (target.rescheduleCount || 0) + 1;
      target.updatedAt = new Date().toISOString();

      saveStoredAppointments(list);

      return {
        appointmentId,
        newStartTime: newSlot.startTime,
        rescheduleCount: target.rescheduleCount,
      };
    }
  },

  /**
   * Cancel Appointment
   * BR-6 / REQ-TS-11: Therapist Cancellation -> 100% full refund always
   * BR-3 / REQ-TS-10: Help Seeker Cancellation -> Full refund if >= 24h before start time
   */
  async cancelAppointment(
    appointmentId: string,
    payload: CancelPayload,
    userRole: 'HELP_SEEKER' | 'THERAPIST' = 'HELP_SEEKER'
  ): Promise<CancelResponse> {
    try {
      const response = await apiClient.post<CancelResponse>(
        `/appointments/${appointmentId}/cancel`,
        payload
      );
      return response.data;
    } catch {
      const list = getStoredAppointments();
      const target = list.find((a) => a.id === appointmentId);
      if (!target) throw new Error('Appointment not found');

      // Calculate refund rule
      let isFullRefund = false;
      if (userRole === 'THERAPIST') {
        isFullRefund = true; // BR-6
      } else {
        const hoursUntilStart =
          (new Date(target.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilStart >= 24) {
          isFullRefund = true; // BR-3
        }
      }

      target.status = 'CANCELED';
      target.cancellationReason = payload.reason || 'Canceled by user';
      target.refundStatus = isFullRefund ? 'FULL_REFUND_INITIATED' : 'NON_REFUNDABLE';
      target.paymentStatus = isFullRefund ? 'REFUNDED' : target.paymentStatus;
      target.refundAmount = isFullRefund ? target.therapistFee || 95.0 : 0.0;
      target.updatedAt = new Date().toISOString();

      // Release slot
      therapistApi.markSlotBooked(target.therapistId, target.slotId, false);

      saveStoredAppointments(list);

      return {
        appointmentId,
        status: 'CANCELED',
        fullRefundInitiated: isFullRefund,
        refundStatus: target.refundStatus,
        refundAmount: target.refundAmount,
      };
    }
  },

  /**
   * Get WebRTC Video Consultation Session Token (BR-16 / REQ-TS-16)
   * Token only accessible <= 10 minutes before scheduled start time
   */
  async getVideoToken(
    appointmentId: string,
    scheduledStartTime?: string
  ): Promise<VideoSessionTokenResponse> {
    // Client-side guard for 10-minute window (BR-16, REQ-TS-16)
    if (scheduledStartTime) {
      const startMs = new Date(scheduledStartTime).getTime();
      const nowMs = Date.now();
      const minutesUntilStart = (startMs - nowMs) / (1000 * 60);

      // If more than 10 minutes prior, block per REQ-TS-16
      if (minutesUntilStart > 10) {
        const minutesLeft = Math.ceil(minutesUntilStart);
        const err = new Error(
          `Consultation video room is locked. Access is granted 10 minutes prior to scheduled start time (opens in ~${minutesLeft} minutes).`
        );
        (err as any).statusCode = 403;
        throw err;
      }
    }

    try {
      const response = await apiClient.get<VideoSessionTokenResponse>(
        `/appointments/${appointmentId}/video-token`
      );
      return response.data;
    } catch {
      // Mock video token return for WebRTC session
      const now = new Date();
      return {
        appointmentId,
        videoRoomUrl: `https://wellnest.daily.co/apt-${appointmentId}`,
        sessionToken: `tok_webrtc_session_${Date.now()}_secure`,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      };
    }
  },

  /**
   * Get Appointments for user
   */
  async getAppointments(userRole: string = 'HELP_SEEKER'): Promise<Appointment[]> {
    const list = getStoredAppointments();
    if (userRole === 'THERAPIST') {
      // Filter for therapist
      return list;
    }
    // Return help seeker's appointments
    return list;
  },

  /**
   * Get Appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    const list = getStoredAppointments();
    const match = list.find((a) => a.id === appointmentId);
    if (!match) throw new Error('Appointment not found');
    return match;
  },

  /**
   * Get Incoming Requests (Therapist Workspace)
   */
  async getIncomingRequests(): Promise<AppointmentRequestItem[]> {
    return getStoredRequests();
  },
};
