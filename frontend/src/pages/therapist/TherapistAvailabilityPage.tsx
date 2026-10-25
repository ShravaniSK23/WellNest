import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AvailabilitySlot } from '../../types/therapist.types';
import { therapistApi } from '../../api/therapistApi';
import { formatApiError } from '../../api/apiClient';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Info,
  CalendarCheck,
} from 'lucide-react';

export const TherapistAvailabilityPage: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 14-day range bounds
  const now = new Date();
  const minDateStr = now.toISOString().slice(0, 10);
  const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Demo practitioner slots
      const data = await therapistApi.getTherapistSlots('t-7788-9901');
      setSlots(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    // Default slot date to tomorrow
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setSlotDate(tmrw.toISOString().slice(0, 10));
  }, [fetchSlots]);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    // Auto calculate 50 min end time
    const [h, m] = val.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const endTotalMins = h * 60 + m + 50;
      const endH = Math.floor(endTotalMins / 60) % 24;
      const endM = endTotalMins % 60;
      setEndTime(
        `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      );
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const startIso = new Date(`${slotDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${slotDate}T${endTime}:00`).toISOString();

      const created = await therapistApi.createAvailabilitySlot({
        startTime: startIso,
        endTime: endIso,
      });

      setSuccessMsg(`Availability slot created for ${slotDate} (${startTime} - ${endTime})`);
      setSlots((prev) => [...prev, created]);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group slots by date for organized agenda view
  const groupedByDate = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    const dKey = s.startTime.slice(0, 10);
    if (!acc[dKey]) acc[dKey] = [];
    acc[dKey].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Crisis Banner */}
      <CrisisResourceBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              14-Day Availability Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Define consultation appointment windows across the next 14 calendar days (REQ-TS-5)
            </p>
          </div>
        </div>

        <Link
          to="/therapist/portal"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>
      </div>

      {/* Policy Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">14-Day Scheduling Policy (REQ-TS-5):</p>
          <p className="text-blue-800 leading-relaxed">
            Therapists can define availability strictly for the upcoming 14 calendar days ({minDateStr} through {maxDateStr}). Slots cannot be set in the past or beyond the 14-day window.
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div
          data-testid="slot-create-success"
          className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          data-testid="slot-create-error"
          className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot Creation Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Add New Availability Slot</span>
          </h2>

          <form onSubmit={handleCreateSlot} className="space-y-4">
            {/* Date Input */}
            <div className="space-y-1">
              <label htmlFor="slot-date-input" className="block text-xs font-bold text-slate-700">
                Slot Date (Within 14 Days)
              </label>
              <input
                id="slot-date-input"
                data-testid="slot-date-input"
                type="date"
                required
                min={minDateStr}
                max={maxDateStr}
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="slot-start-time" className="block text-xs font-bold text-slate-700">
                  Start Time
                </label>
                <input
                  id="slot-start-time"
                  data-testid="slot-start-time-input"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="slot-end-time" className="block text-xs font-bold text-slate-700">
                  End Time (50m)
                </label>
                <input
                  id="slot-end-time"
                  data-testid="slot-end-time-input"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="create-slot-submit-btn"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Slot...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Availability Slot</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Slots Agenda View */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Current 14-Day Calendar Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Total defined slots: <strong>{slots.length}</strong>
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center items-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-xs font-medium">Loading slots...</span>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
              No slots created yet for the next 14 calendar days. Add your first slot using the form on the left.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((dateKey) => {
                const daySlots = groupedByDate[dateKey] || [];
                const formattedDay = new Date(dateKey + 'T00:00:00').toLocaleDateString(
                  undefined,
                  { weekday: 'long', month: 'short', day: 'numeric' }
                );

                return (
                  <div
                    key={dateKey}
                    data-testid={`agenda-day-${dateKey}`}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{formattedDay}</span>
                      <span className="text-slate-400 font-medium">
                        {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {daySlots.map((slot) => {
                        const start = new Date(slot.startTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const end = new Date(slot.endTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={slot.id}
                            data-testid={`agenda-slot-${slot.id}`}
                            className={`p-2.5 rounded-xl border text-xs text-center flex flex-col justify-center items-center ${
                              slot.isBooked
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-bold text-slate-900">{start}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {start} - {end}
                            </span>
                            <span
                              className={`mt-1 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                                slot.isBooked
                                  ? 'bg-indigo-200/70 text-indigo-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {slot.isBooked ? 'Booked' : 'Available'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
