import React from 'react';

interface MoodNoteInputProps {
  note: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MoodNoteInput: React.FC<MoodNoteInputProps> = ({
  note,
  onChange,
  disabled = false,
}) => {
  const maxLength = 500;
  const currentLength = note.length;
  const isNearLimit = currentLength >= 450;
  const isAtLimit = currentLength >= maxLength;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="mood-note-textarea" className="block text-sm font-semibold text-slate-800">
          Daily Reflection / Note <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </label>
        <span
          data-testid="mood-note-counter"
          className={`text-xs font-medium tabular-nums ${
            isAtLimit
              ? 'text-rose-600 font-bold'
              : isNearLimit
              ? 'text-amber-600 font-semibold'
              : 'text-slate-400'
          }`}
          aria-live="polite"
        >
          {currentLength} / {maxLength}
        </span>
      </div>

      <textarea
        id="mood-note-textarea"
        data-testid="mood-note-textarea"
        rows={4}
        maxLength={maxLength}
        disabled={disabled}
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What shaped your mood today? Express your thoughts, reflections, or moments of gratitude..."
        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-2xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition disabled:bg-slate-50 disabled:opacity-60 resize-none leading-relaxed text-slate-800 placeholder:text-slate-400"
      />

      <p className="text-[11px] text-slate-500">
        Max 500 characters. Re-logging on the same calendar day safely updates your daily entry.
      </p>
    </div>
  );
};
