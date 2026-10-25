import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Appointment, CancelResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import { RescheduleModal } from '../../components/appointment/RescheduleModal';
import { CancellationModal } from '../../components/appointment/CancellationModal';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  XCircle,
  RefreshCw,
  Ban,
  AlertCircle,
  Loader2,
  FileText,
  Info,
} from 'lucide-react';

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    appointmentApi
      .getAppointmentById(id)
      .then((data) => {
        if (isMounted) setAppointment(data);
      })
      .catch((err) => {
        if (isMounted) setError(formatApiError(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div
        data-testid="appointment-detail-loading"
        className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500"
      >
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-medium">Loading session detail &amp; state audit...</span>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="font-bold">Appointment Not Found</p>
          <p className="text-xs text-rose-700 mt-1">{error || 'Unable to retrieve this session.'}</p>
        </div>
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Appointments</span>
        </Link>
      </div>
    );
  }

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
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

  const isConfirmed = appointment.status === 'CONFIRMED';
  const isPending = appointment.status === 'PENDING_CONFIRMATION';
  const isCanceled = appointment.status === 'CANCELED';

  const canReschedule = (isConfirmed || isPending) && (appointment.rescheduleCount || 0) < 2;
  const canCancel = isConfirmed || isPending;

  const handleRescheduleSuccess = (updated: Appointment) => {
    setAppointment(updated);
  };

  const handleCancelSuccess = (res: CancelResponse) => {
    setAppointment((prev) =>
      prev
        ? {
            ...prev,
            status: 'CANCELED',
            refundStatus: res.refundStatus || 'FULL_REFUND_INITIATED',
            paymentStatus: res.fullRefundInitiated ? 'REFUNDED' : prev.paymentStatus,
          }
        : null
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Crisis Banner */}
      <CrisisResourceBanner />

      {/* Back button */}
      <Link
        to="/appointments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Appointments</span>
      </Link>

      {/* Main Detail Card */}
      <div
        data-testid="appointment-detail-card"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6"
      >
        {/* Top Header with Statuses */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono text-slate-400">ID: {appointment.id}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Session Overview</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Session Status */}
            <span
              data-testid="detail-session-status"
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : isPending
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : isCanceled
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              Status: {appointment.status}
            </span>

            {/* Payment Status */}
            <span
              data-testid="detail-payment-status"
              className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200"
            >
              Payment: {appointment.paymentStatus || 'AUTHORIZED'}
            </span>

            {/* Refund Status */}
            {appointment.refundStatus && appointment.refundStatus !== 'NOT_APPLICABLE' && (
              <span
                data-testid="detail-refund-status"
                className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200"
              >
                Refund: {appointment.refundStatus}
              </span>
            )}
          </div>
        </div>

        {/* Practitioner Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center">
              {(appointment.therapistName || 'P').charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {appointment.therapistName || 'Licensed Therapist'}
              </h3>
              <p className="text-xs text-slate-500">
                {appointment.therapistQualifications || 'Verified Clinical Practitioner'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Consultation Rate</span>
            <p className="text-lg font-black text-slate-900">
              ${(appointment.therapistFee || 95).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" /> Date
            </span>
            <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Time &amp; Duration
            </span>
            <p className="text-sm font-bold text-slate-800">{formattedTime} (50 Minutes)</p>
          </div>
        </div>

        {/* Reschedule Counter Info */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 text-xs text-indigo-900 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Reschedule Policy (BR-4):</strong> Up to 2 reschedules allowed without therapist approval.
            </span>
          </div>
          <span
            data-testid="detail-reschedule-count"
            className="font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200"
          >
            {appointment.rescheduleCount || 0} / 2 Reschedules Used
          </span>
        </div>

        {/* Client Consultation Notes */}
        {appointment.notes && (
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Patient Consultation Notes
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
              {appointment.notes}
            </div>
          </div>
        )}

        {/* Cancellation Reason if Canceled */}
        {isCanceled && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" /> Cancellation Details
            </span>
            <p className="text-rose-800">
              Reason: {appointment.cancellationReason || 'No specific reason provided.'}
            </p>
            {appointment.refundStatus && (
              <p className="font-semibold text-rose-900 pt-1">
                Refund Processing: {appointment.refundStatus}
              </p>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/appointments"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Back to List
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Join Video consultation */}
            {isConfirmed && (
              <Link
                to={`/appointments/${appointment.id}/video`}
                data-testid="detail-join-video-btn"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Video className="w-4 h-4" />
                <span>Join Video Room</span>
              </Link>
            )}

            {/* Reschedule */}
            {canReschedule && (
              <button
                type="button"
                data-testid="detail-reschedule-btn"
                onClick={() => setIsRescheduleOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reschedule Session</span>
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                type="button"
                data-testid="detail-cancel-btn"
                onClick={() => setIsCancelOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel Appointment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isRescheduleOpen && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          appointment={appointment}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {isCancelOpen && (
        <CancellationModal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          appointment={appointment}
          userRole="HELP_SEEKER"
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
};
