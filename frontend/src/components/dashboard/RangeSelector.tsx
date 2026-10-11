import React from 'react';
import type { RangeDays } from '../../types/dashboard.types';

interface RangeSelectorProps {
  selectedRange: RangeDays;
  onChange: (range: RangeDays) => void;
  disabled?: boolean;
}

const RANGES: { value: RangeDays; label: string }[] = [
  { value: 7, label: 'Past 7 Days' },
  { value: 30, label: 'Past 30 Days' },
  { value: 90, label: 'Past 90 Days' },
];

export const RangeSelector: React.FC<RangeSelectorProps> = ({
  selectedRange,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Analytics Date Range Selector"
      className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200"
    >
      {RANGES.map((r) => {
        const isSelected = selectedRange === r.value;
        return (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            data-testid={`range-btn-${r.value}`}
            onClick={() => onChange(r.value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 ${
              isSelected
                ? 'bg-white text-brand-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
};
