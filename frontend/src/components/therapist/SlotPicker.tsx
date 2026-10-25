import React, { useState, useMemo } from 'react';
import type { AvailabilitySlot } from '../../types/therapist.types';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface SlotPickerProps {
  slots: AvailabilitySlot[];
  selectedSlotId?: string;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  isLoading?: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  isLoading,
}) => {
  const now = new Date();
  const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Filter slots strictly within [now, now + 14 days]
  const validSlots = useMemo(() => {
    return slots.filter((slot) => {
      const start = new Date(slot.startTime);
      return start >= now && start <= fourteenDaysAhead;
    });
  }, [slots, now, fourteenDaysAhead]);

  // Group slots by date string (YYYY-MM-DD)
  const groupedSlots = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    for (const slot of validSlots) {
      const dateKey = slot.startTime.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    }
    // Sort slots within each day
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }
    return map;
  }, [validSlots]);

  // Generate 14-day date list starting from today
  const next14Days = useMemo(() => {
    const days: { dateKey: string; dateObj: Date; label: string; weekday: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      days.push({
        dateKey,
        dateObj: d,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weekday: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      });
    }
    return days;
  }, []);

  // Selected date defaults to first day that has available slots or today
  const firstDayWithSlots = useMemo(() => {
    const match = next14Days.find((d) => groupedSlots[d.dateKey]?.some((s) => !s.isBooked));
    return match ? match.dateKey : next14Days[0].dateKey;
  }, [next14Days, groupedSlots]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(firstDayWithSlots);

  const currentDaySlots = groupedSlots[selectedDateKey] || [];
  const availableCount = currentDaySlots.filter((s) => !s.isBooked).length;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Clock className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
        <p className="text-xs font-medium">Checking 14-day real-time calendar availability...</p>
      </div>
    );
  }

  return (
    <div data-testid="slot-picker-container" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>14-Day Calendar Availability</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an open 50-minute consultation slot (REQ-TS-5)
          </p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
          Next 14 Days
        </span>
      </div>

      {/* 14-Day Horizontal Date Bar */}
      <div
        data-testid="date-picker-bar"
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200"
      >
        {next14Days.map((day) => {
          const isSelected = selectedDateKey === day.dateKey;
          const daySlots = groupedSlots[day.dateKey] || [];
          const hasOpenSlots = daySlots.some((s) => !s.isBooked);

          return (
            <button
              key={day.dateKey}
              type="button"
              data-testid={`date-tab-${day.dateKey}`}
              onClick={() => setSelectedDateKey(day.dateKey)}
              className={`flex-shrink-0 w-18 p-2.5 rounded-2xl text-center border transition-all ${
                isSelected
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span
                className={`block text-[11px] font-bold uppercase ${
                  isSelected ? 'text-brand-100' : 'text-slate-400'
                }`}
              >
                {day.weekday}
              </span>
              <span className="block text-sm font-extrabold mt-0.5">{day.label}</span>
              <div className="mt-1 flex justify-center">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    hasOpenSlots
                      ? isSelected
                        ? 'bg-white'
                        : 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                  title={hasOpenSlots ? 'Open slots available' : 'No open slots'}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Available Slots for Selected Date */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span
            data-testid="slots-available-count"
            className="text-slate-500 font-medium"
          >
            {availableCount} open {availableCount === 1 ? 'slot' : 'slots'}
          </span>
        </div>

        {currentDaySlots.length === 0 ? (
          <div
            data-testid="no-slots-notice"
            className="p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-200"
          >
            <AlertCircle className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
            No availability slots listed on this date. Please check adjacent days in the 14-day schedule.
          </div>
        ) : (
          <div
            data-testid="slots-grid"
            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
          >
            {currentDaySlots.map((slot) => {
              const startObj = new Date(slot.startTime);
              const endObj = new Date(slot.endTime);
              const timeFormatted = startObj.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });
              const endFormatted = endObj.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isSelected = selectedSlotId === slot.id;
              const isBooked = slot.isBooked;

              if (isBooked) {
                return (
                  <div
                    key={slot.id}
                    data-testid={`slot-booked-${slot.id}`}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-center cursor-not-allowed text-xs flex flex-col justify-center items-center"
                  >
                    <span className="line-through font-medium">{timeFormatted}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                      Reserved
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  data-testid={`slot-available-${slot.id}`}
                  onClick={() => onSelectSlot(slot)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col justify-center items-center ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-400/50'
                      : 'bg-white border-slate-200 hover:border-brand-400 text-slate-800 hover:bg-brand-50/20'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-brand-600'}`} />
                    <span>{timeFormatted}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {timeFormatted} - {endFormatted} (50m)
                  </span>
                  {isSelected && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-extrabold text-teal-700">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
