import React, { useState, useEffect } from 'react';
import type { Appointment } from '../../types/appointment.types';
import type { AvailabilitySlot } from '../../types/therapist.types';
import { therapistApi } from '../../api/therapistApi';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import { SlotPicker } from '../therapist/SlotPicker';
import {
  X,
  Calendar,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess: (updatedAppointment: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rescheduleCount = appointment.rescheduleCount || 0;
  // BR-4 / REQ-TS-9: Maximum 2 reschedules allowed
  const hasReachedLimit = rescheduleCount >= 2;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);

    therapistApi
      .getTherapistSlots(appointment.therapistId)
      .then((data) => {
        if (isMounted) {
          // Filter out current slot
          setSlots(data.filter((s) => s.id !== appointment.slotId));
        }
      })
      .catch((err) => {
        if (isMounted) setError(formatApiError(err));
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointment.therapistId, appointment.slotId]);

  if (!isOpen) return null;

  const currentStart = new Date(appointment.startTime);
  const formattedCurrentTime = `${currentStart.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} at ${currentStart.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const handleReschedule = async () => {
    if (!selectedSlot || hasReachedLimit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await appointmentApi.rescheduleAppointment(appointment.id, {
        newSlotId: selectedSlot.id,
      });

      const updated: Appointment = {
        ...appointment,
        slotId: selectedSlot.id,
        startTime: res.newStartTime,
        endTime: selectedSlot.endTime,
        rescheduleCount: res.rescheduleCount,
      };

      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="reschedule-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        data-testid="reschedule-modal"
        className="relative bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Session Modification
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Reschedule Consultation</h3>
            <p className="text-xs text-slate-500">
              with {appointment.therapistName || 'your therapist'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-reschedule-modal-btn"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Time Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Currently Scheduled For:</span>
            <span className="font-bold text-slate-800">{formattedCurrentTime}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Reschedule Policy (BR-4)</span>
            <span
              data-testid="reschedule-count-badge"
              className={`font-bold ${
                hasReachedLimit ? 'text-rose-600' : 'text-indigo-600'
              }`}
            >
              {rescheduleCount} of 2 used
            </span>
          </div>
        </div>

        {/* BR-4 Reschedule Limit Warning or Enforcement Alert */}
        {hasReachedLimit ? (
          <div
            data-testid="reschedule-limit-reached-alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2"
          >
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Maximum Reschedules Reached (BR-4 Limit)</span>
            </div>
            <p className="text-rose-700 leading-relaxed">
              An appointment may be rescheduled at most twice by the Help Seeker without Therapist approval. You have reached this limit. Please contact your therapist directly or cancel and rebook.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-900 text-[11px] flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              You are using reschedule <strong>#{rescheduleCount + 1}</strong> of 2 allowed. You have {2 - rescheduleCount - 1} reschedule remaining after this change.
            </span>
          </div>
        )}

        {error && (
          <div
            data-testid="reschedule-error-alert"
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Slot Selector */}
        {!hasReachedLimit && (
          <div className="pt-1">
            <SlotPicker
              slots={slots}
              selectedSlotId={selectedSlot?.id}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              isLoading={isLoadingSlots}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
          {!hasReachedLimit && (
            <button
              type="button"
              disabled={!selectedSlot || isSubmitting}
              onClick={handleReschedule}
              data-testid="confirm-reschedule-btn"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rescheduling Slot...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm New Slot</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
