export type AppointmentStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED';

export type RefundStatus =
  | 'FULL_REFUND_INITIATED'
  | 'PARTIAL_REFUND'
  | 'NON_REFUNDABLE'
  | 'NOT_APPLICABLE'
  | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerTransactionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  requestId: string;
  helpSeekerId: string;
  helpSeekerName?: string;
  therapistId: string;
  therapistName?: string;
  therapistQualifications?: string;
  therapistFee?: number;
  slotId: string;
  status: AppointmentStatus;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  rescheduleCount: number;
  notes?: string;
  payment?: PaymentRecord;
  paymentStatus?: PaymentStatus;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  expiresAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequestItem {
  id: string;
  appointmentId: string;
  helpSeekerId: string;
  helpSeekerName: string;
  therapistId: string;
  slotId: string;
  startTime: string;
  endTime: string;
  status: RequestStatus;
  notes?: string;
  expiresAt: string;
  paymentStatus: PaymentStatus;
  fee: number;
  createdAt: string;
}

export interface BookingRequestPayload {
  therapistId: string;
  slotId: string;
  notes?: string;
  paymentMethodToken: string; // PCI token only, never raw card details!
}

export interface BookingResponse {
  appointmentId: string;
  requestId: string;
  status: AppointmentStatus;
  expiresAt: string;
  paymentStatus: PaymentStatus;
}

export interface ReschedulePayload {
  newSlotId: string;
}

export interface RescheduleResponse {
  appointmentId: string;
  newStartTime: string;
  rescheduleCount: number;
}

export interface CancelPayload {
  reason?: string;
}

export interface CancelResponse {
  appointmentId: string;
  status: 'CANCELED';
  fullRefundInitiated: boolean;
  refundStatus?: RefundStatus;
  refundAmount?: number;
}

export interface VideoSessionTokenResponse {
  appointmentId: string;
  videoRoomUrl: string;
  sessionToken: string;
  expiresAt: string;
}
