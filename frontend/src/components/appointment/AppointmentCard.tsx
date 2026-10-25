import React from 'react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../../types/appointment.types';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  ArrowRight,
} from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onOpenReschedule?: (appointment: Appointment) => void;
  onOpenCancel?: (appointment: Appointment) => void;
  userRole?: 'HELP_SEEKER' | 'THERAPIST';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onOpenReschedule,
  onOpenCancel,
  userRole = 'HELP_SEEKER',
}) => {
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);

  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = `${startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // Time calculations
  const nowMs = Date.now();
  const startMs = startDate.getTime();
  const minutesUntilStart = (startMs - nowMs) / (1000 * 60);
  const isVideoJoinable = appointment.status === 'CONFIRMED' && minutesUntilStart <= 10 && minutesUntilStart >= -60;
  const isPending = appointment.status === 'PENDING_CONFIRMATION';
  const isConfirmed = appointment.status === 'CONFIRMED';
  const isCanceled = appointment.status === 'CANCELED';
  const isCompleted = appointment.status === 'COMPLETED';

  // Reschedule eligibility: only Help Seeker can reschedule, and max 2 allowed (BR-4)
  const canReschedule =
    userRole === 'HELP_SEEKER' &&
    (isConfirmed || isPending) &&
    (appointment.rescheduleCount || 0) < 2;

  const canCancel = isConfirmed || isPending;

  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'CONFIRMED':
        return (
          <span
            data-testid={`status-badge-${appointment.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'PENDING_CONFIRMATION':
        return (
          <span
            data-testid={`status-badge-${appointment.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>PENDING APPROVAL</span>
          </span>
        );
      case 'CANCELED':
        return (
          <span
            data-testid={`status-badge-${appointment.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>CANCELED</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            data-testid={`status-badge-${appointment.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span
            data-testid={`status-badge-${appointment.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"
          >
            <span>{appointment.status}</span>
          </span>
        );
    }
  };

  const getPaymentBadge = () => {
    const paymentStatus = appointment.paymentStatus || appointment.payment?.status || 'PENDING';
    switch (paymentStatus) {
      case 'CAPTURED':
        return (
          <span
            data-testid={`payment-status-${appointment.id}`}
            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
          >
            Payment: CAPTURED
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span
            data-testid={`payment-status-${appointment.id}`}
            className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
          >
            Hold: AUTHORIZED
          </span>
        );
      case 'REFUNDED':
        return (
          <span
            data-testid={`payment-status-${appointment.id}`}
            className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
          >
            Payment: REFUNDED
          </span>
        );
      default:
        return (
          <span
            data-testid={`payment-status-${appointment.id}`}
            className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
          >
            Payment: {paymentStatus}
          </span>
        );
    }
  };

  const displayName =
    userRole === 'THERAPIST'
      ? appointment.helpSeekerName || 'Help Seeker'
      : appointment.therapistName || 'Licensed Practitioner';

  return (
    <div
      data-testid={`appointment-card-${appointment.id}`}
      className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-4"
    >
      {/* Top Header: Partner Name, Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-2xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-snug">{displayName}</h4>
            {appointment.therapistQualifications && userRole === 'HELP_SEEKER' && (
              <p className="text-xs text-slate-500 font-medium">
                {appointment.therapistQualifications}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">{getStatusBadge()}</div>
      </div>

      {/* Date & Time Row */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Notes if present */}
      {appointment.notes && (
        <p className="text-xs text-slate-600 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
          &ldquo;{appointment.notes}&rdquo;
        </p>
      )}

      {/* Financial & Policy Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {getPaymentBadge()}

          {/* Refund Badge */}
          {appointment.refundStatus && appointment.refundStatus !== 'NOT_APPLICABLE' && (
            <span
              data-testid={`refund-status-${appointment.id}`}
              className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200"
            >
              Refund: {appointment.refundStatus}
            </span>
          )}

          {/* Reschedule counter */}
          {userRole === 'HELP_SEEKER' && !isCanceled && !isCompleted && (
            <span
              data-testid={`reschedule-counter-${appointment.id}`}
              className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md"
            >
              Rescheduled: {appointment.rescheduleCount || 0} / 2
            </span>
          )}
        </div>

        {/* 24h Expiry notice if pending */}
        {isPending && appointment.expiresAt && (
          <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            24h Response Window
          </span>
        )}
      </div>

      {/* Actions Toolbar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <Link
          to={`/appointments/${appointment.id}`}
          data-testid={`view-details-link-${appointment.id}`}
          className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1 transition"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Join Video Button */}
          {isConfirmed && (
            <Link
              to={`/appointments/${appointment.id}/video`}
              data-testid={`join-video-btn-${appointment.id}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                isVideoJoinable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isVideoJoinable ? 'Join Video Now' : 'Consultation Room'}</span>
            </Link>
          )}

          {/* Reschedule Action */}
          {canReschedule && onOpenReschedule && (
            <button
              type="button"
              data-testid={`reschedule-btn-${appointment.id}`}
              onClick={() => onOpenReschedule(appointment)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reschedule</span>
            </button>
          )}

          {/* Cancel Action */}
          {canCancel && onOpenCancel && (
            <button
              type="button"
              data-testid={`cancel-btn-${appointment.id}`}
              onClick={() => onOpenCancel(appointment)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
