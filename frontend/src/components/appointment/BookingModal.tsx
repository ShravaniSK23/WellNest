import React, { useState } from 'react';
import type { Therapist, AvailabilitySlot } from '../../types/therapist.types';
import type { BookingResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import {
  X,
  ShieldCheck,
  Calendar,
  Clock,
  Lock,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
  slot: AvailabilitySlot;
  onSuccess: (result: BookingResponse) => void;
}

const TOKENIZED_PAYMENT_OPTIONS = [
  {
    id: 'pm_tok_demo_4242',
    name: 'Saved Test Visa •••• 4242',
    description: 'Instant tokenized authorization hold',
    type: 'Visa',
  },
  {
    id: 'pm_tok_demo_5555',
    name: 'Saved Test Mastercard •••• 5555',
    description: 'Instant tokenized authorization hold',
    type: 'Mastercard',
  },
  {
    id: 'pm_tok_wallet_pay',
    name: 'Digital Wallet Pay (Demo)',
    description: 'One-click tokenized payment hold',
    type: 'Wallet',
  },
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  therapist,
  slot,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENIZED_PAYMENT_OPTIONS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingResponse | null>(null);

  if (!isOpen) return null;

  // Format slot times
  const startDate = new Date(slot.startTime);
  const endDate = new Date(slot.endTime);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // CRITICAL PCI-DSS RULE: Never send raw card numbers.
    // We strictly submit a tokenized payment reference (ADR-004).
    try {
      const result = await appointmentApi.submitBookingRequest({
        therapistId: therapist.id,
        slotId: slot.id,
        notes: notes.trim() || undefined,
        paymentMethodToken: selectedToken,
      });

      setBookingSuccess(result);
      onSuccess(result);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="booking-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        data-testid="booking-modal"
        className="relative bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Session Reservation
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Book Consultation</h3>
            <p className="text-xs text-slate-500">
              with {therapist.fullName} ({therapist.qualifications})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-booking-modal-btn"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingSuccess ? (
          /* Success Screen */
          <div data-testid="booking-success-view" className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Appointment Request Submitted!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Your session request has been forwarded to {therapist.fullName}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>24-Hour Confirmation Window (REQ-TS-8)</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                The therapist has 24 hours to confirm. A temporary authorization hold for{' '}
                <strong>${therapist.consultationFee.toFixed(2)}</strong> has been placed on your payment method. Funds are only captured upon confirmation.
              </p>
              <div className="pt-1 text-[11px] font-semibold text-amber-700">
                Status: <span className="uppercase text-amber-900">{bookingSuccess.status}</span> | Payment: <span className="uppercase text-amber-900">{bookingSuccess.paymentStatus}</span>
              </div>
            </div>

            <button
              type="button"
              data-testid="booking-done-btn"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
            >
              View My Appointments
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                data-testid="booking-error-alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selected Slot Recap */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formattedTime} (50 minutes)</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-700">
                <span className="font-medium">Consultation Fee</span>
                <span className="font-black text-sm text-slate-900">
                  ${therapist.consultationFee.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes / Reason for consultation */}
            <div className="space-y-1.5">
              <label
                htmlFor="booking-notes"
                className="block text-xs font-bold text-slate-700"
              >
                Consultation Topic / Goals (Optional)
              </label>
              <textarea
                id="booking-notes"
                data-testid="booking-notes-input"
                rows={3}
                maxLength={500}
                placeholder="Share any topics, concerns, or areas you wish to address during your session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="block text-right text-[10px] text-slate-400">
                {notes.length} / 500 characters
              </span>
            </div>

            {/* PCI-DSS Tokenized Payment Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Tokenized Payment Method</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PCI-DSS Level 1
                </span>
              </div>

              {/* Strict Notice: Zero raw card collection */}
              <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy &amp; Payment Safety Guarantee:</strong> WellNest never collects, transmits, or stores raw card numbers or CVVs. All transactions use secure provider tokens.
                </span>
              </div>

              {/* Payment Token Selector Options */}
              <div className="space-y-2">
                {TOKENIZED_PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    data-testid={`payment-method-${opt.id}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      selectedToken === opt.id
                        ? 'bg-brand-50/40 border-brand-500 ring-2 ring-brand-400/40'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentToken"
                        value={opt.id}
                        checked={selectedToken === opt.id}
                        onChange={() => setSelectedToken(opt.id)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{opt.name}</p>
                        <p className="text-[10px] text-slate-500">{opt.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      Tokenized
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Two-Phase Payment Explanation */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/70 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                <span>Two-Phase Authorization (ADR-004)</span>
              </div>
              <p className="text-blue-800">
                Phase 1: An authorization hold of ${therapist.consultationFee.toFixed(2)} is reserved. Phase 2: Captured ONLY when confirmed. If declined or expired within 24h, hold releases immediately with zero charges.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="confirm-booking-submit-btn"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing &amp; Reserving...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm Hold &amp; Request Slot</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
