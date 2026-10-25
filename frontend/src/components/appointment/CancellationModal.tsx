import React, { useState } from 'react';
import type { Appointment, CancelResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  userRole?: 'HELP_SEEKER' | 'THERAPIST';
  onSuccess: (result: CancelResponse) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  userRole = 'HELP_SEEKER',
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startMs = new Date(appointment.startTime).getTime();
  const nowMs = Date.now();
  const hoursUntilStart = (startMs - nowMs) / (1000 * 60 * 60);

  // Business Rules Evaluation:
  // Therapist cancellation -> 100% full refund (BR-6)
  // Help seeker cancellation >= 24h -> 100% full refund (BR-3)
  // Help seeker cancellation < 24h -> Non-refundable late cancellation
  const isTherapist = userRole === 'THERAPIST';
  const isFullRefundEligible = isTherapist || hoursUntilStart >= 24;
  const consultationFee = appointment.therapistFee || 95.0;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await appointmentApi.cancelAppointment(
        appointment.id,
        { reason: reason.trim() || undefined },
        userRole
      );
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="cancellation-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        data-testid="cancellation-modal"
        className="relative bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Cancellation &amp; Refund
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Cancel Consultation</h3>
            <p className="text-xs text-slate-500">
              Session with {appointment.therapistName || appointment.helpSeekerName || 'Practitioner'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-cancellation-modal-btn"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            data-testid="cancellation-error-alert"
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cancellation Policy Banner */}
        <div
          data-testid="cancellation-policy-banner"
          className={`p-4 rounded-2xl border text-xs space-y-2 ${
            isFullRefundEligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isFullRefundEligible ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Full Refund Guaranteed</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Late Cancellation Notice</span>
              </>
            )}
          </div>

          <p className="leading-relaxed">
            {isTherapist ? (
              <>
                Per platform policy <strong>BR-6</strong>, practitioner cancellations automatically initiate a <strong>100% full refund</strong> of ${consultationFee.toFixed(2)} back to the client.
              </>
            ) : isFullRefundEligible ? (
              <>
                You are canceling more than 24 hours prior to session start (<strong>{hoursUntilStart.toFixed(0)} hours remaining</strong>). Per policy <strong>BR-3</strong>, you receive a <strong>100% full refund</strong> of ${consultationFee.toFixed(2)}.
              </>
            ) : (
              <>
                Less than 24 hours remain before your session (<strong>{Math.max(0, hoursUntilStart).toFixed(1)} hours remaining</strong>). Per policy <strong>BR-3</strong>, late cancellations are non-refundable.
              </>
            )}
          </p>

          <div className="pt-1 flex items-center justify-between border-t border-slate-200/40 text-[11px] font-semibold">
            <span>Refund Status:</span>
            <span
              data-testid="expected-refund-status"
              className="uppercase tracking-wider font-extrabold"
            >
              {isFullRefundEligible ? 'FULL_REFUND_INITIATED' : 'NON_REFUNDABLE'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCancel} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="block text-xs font-bold text-slate-700"
            >
              Reason for Cancellation (Required for records)
            </label>
            <textarea
              id="cancel-reason"
              data-testid="cancellation-reason-input"
              rows={3}
              required
              placeholder="Please provide the reason for canceling this appointment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              data-testid="confirm-cancellation-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Cancellation...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
