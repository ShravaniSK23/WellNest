import React, { useRef } from 'react';
import {
  ALLOWED_MOOD_EMOJIS,
  MOOD_EMOJI_DETAILS,
  type MoodEmoji,
} from '../../types/mood.types';

interface EmojiSelectorProps {
  selectedEmoji: string | null;
  onSelect: (emoji: MoodEmoji) => void;
  disabled?: boolean;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  selectedEmoji,
  onSelect,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard arrow navigation across the emoji radio group
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;

    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      targetIndex = (index + 1) % ALLOWED_MOOD_EMOJIS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      targetIndex = (index - 1 + ALLOWED_MOOD_EMOJIS.length) % ALLOWED_MOOD_EMOJIS.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(ALLOWED_MOOD_EMOJIS[index]);
      return;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const targetEmoji = ALLOWED_MOOD_EMOJIS[targetIndex];
      onSelect(targetEmoji);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[targetIndex]?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label id="mood-selector-label" className="block text-sm font-semibold text-slate-800">
          How are you feeling right now? <span className="text-rose-500">*</span>
        </label>
        {selectedEmoji && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200 animate-fade-in">
            Selected: {selectedEmoji} {MOOD_EMOJI_DETAILS[selectedEmoji as MoodEmoji]?.label}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-labelledby="mood-selector-label"
        data-testid="emoji-selector-group"
        className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3"
      >
        {ALLOWED_MOOD_EMOJIS.map((emoji, index) => {
          const isSelected = selectedEmoji === emoji;
          const info = MOOD_EMOJI_DETAILS[emoji];

          return (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${info.label} (${emoji})`}
              disabled={disabled}
              tabIndex={isSelected || (!selectedEmoji && index === 0) ? 0 : -1}
              onClick={() => onSelect(emoji)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              data-testid={`emoji-btn-${emoji}`}
              className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-brand-50 border-brand-500 shadow-md shadow-brand-500/10 scale-105 sm:scale-110 z-10'
                  : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50 hover:scale-102'
              }`}
            >
              <span className="text-3xl sm:text-3xl transition-transform duration-150 group-hover:scale-110 select-none">
                {emoji}
              </span>
              <span
                className={`mt-1.5 text-[10px] leading-tight text-center font-medium truncate w-full ${
                  isSelected ? 'text-brand-900 font-bold' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {info.label.split('/')[0].trim()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
