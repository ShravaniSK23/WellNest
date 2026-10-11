import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import type { StreakInfo } from '../../types/mood.types';

interface StreakBadgeProps {
  streak: StreakInfo | null;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, className = '' }) => {
  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;

  return (
    <div
      data-testid="streak-badge-container"
      className={`bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Flame className="w-6 h-6 animate-pulse fill-white/20" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-amber-700">
              Consecutive Tracking
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              <span data-testid="current-streak-value">{current}</span>
              <span className="text-xs font-semibold text-slate-500">
                {current === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right pl-3 border-l border-amber-200/60">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-end gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" /> Best
          </div>
          <div
            data-testid="longest-streak-value"
            className="text-base sm:text-lg font-bold text-slate-800 tabular-nums"
          >
            {longest} <span className="text-[11px] font-normal text-slate-500">days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
