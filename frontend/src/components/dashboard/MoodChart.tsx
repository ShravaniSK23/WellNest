import React, { useState } from 'react';
import type { MoodHistoryItem } from '../../types/dashboard.types';
import { MOOD_EMOJI_DETAILS, type MoodEmoji } from '../../types/mood.types';
import { BarChart3, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MoodChartProps {
  moodHistory: MoodHistoryItem[];
  rangeDays: number;
}

export const MoodChart: React.FC<MoodChartProps> = ({ moodHistory, rangeDays }) => {
  const [activeEntry, setActiveEntry] = useState<MoodHistoryItem | null>(null);

  if (moodHistory.length === 0) {
    return (
      <div
        data-testid="mood-chart-empty"
        className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-4"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <BarChart3 className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">No Mood Logs in Selected Period</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't logged any daily mood entries in the past {rangeDays} days. Start tracking today to visualize your emotional trends!
          </p>
        </div>
        <Link
          to="/moods"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition shadow-sm"
        >
          <span>Log Today's Mood</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="mood-chart-container"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Mood Trend Timeline ({rangeDays} Days)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological progression of your recorded emotional states
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Logs: <span className="text-slate-900 font-bold">{moodHistory.length}</span>
        </div>
      </div>

      {/* Interactive Horizontal Timeline Bar */}
      <div
        role="region"
        aria-label="Mood Trend Timeline Chart"
        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 overflow-x-auto"
      >
        <div className="flex items-end gap-2 sm:gap-3 min-w-max pb-2 pt-4">
          {moodHistory.map((item) => {
            const isSelected = activeEntry?.id === item.id;
            const emojiInfo = MOOD_EMOJI_DETAILS[item.moodEmoji as MoodEmoji];
            const dateLabel = new Date(item.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveEntry(item)}
                onFocus={() => setActiveEntry(item)}
                title={emojiInfo ? `${emojiInfo.label} (${item.moodEmoji})` : item.moodEmoji}
                data-testid={`mood-chart-item-${item.date}`}
                aria-label={`Logged ${item.moodEmoji} on ${item.date}`}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 shadow-sm scale-110 -translate-y-1'
                    : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-100/80 hover:-translate-y-0.5'
                }`}
              >
                <span className="text-2xl sm:text-3xl select-none">{item.moodEmoji}</span>
                <span className="text-[10px] font-semibold text-slate-600 mt-1 whitespace-nowrap">
                  {dateLabel}
                </span>
                {item.note && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1" title="Note included" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Detail Inspection Card */}
      {activeEntry && (
        <div
          data-testid="mood-chart-active-detail"
          className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 text-slate-800 text-xs space-y-2 animate-fade-in"
        >
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>{activeEntry.date}</span> &bull; {activeEntry.moodEmoji}{' '}
              {MOOD_EMOJI_DETAILS[activeEntry.moodEmoji as MoodEmoji]?.label}
            </span>
            <button
              type="button"
              onClick={() => setActiveEntry(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
          {activeEntry.note ? (
            <p className="text-slate-700 bg-white/80 p-2.5 rounded-xl border border-brand-100 flex items-start gap-2 italic">
              <FileText className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
              <span>&ldquo;{activeEntry.note}&rdquo;</span>
            </p>
          ) : (
            <p className="text-slate-500 italic">No written reflection logged for this day.</p>
          )}
        </div>
      )}
    </div>
  );
};
