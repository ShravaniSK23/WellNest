import React from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface HiddenContentBadgeProps {
  reportCount?: number;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

export const HiddenContentBadge: React.FC<HiddenContentBadgeProps> = ({
  reportCount = 3,
  isRevealed,
  onToggleReveal,
}) => {
  return (
    <div
      data-testid="hidden-content-badge"
      className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs space-y-2 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-900">
              Content Automatically Hidden ({reportCount} Community Reports)
            </div>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              This content has accumulated 3 or more community reports and has been automatically hidden pending moderation review per safety guidelines (BR-8 / REQ-AC-7).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleReveal}
          data-testid="toggle-hidden-content-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-semibold flex-shrink-0 transition"
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Again</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>View Anyway</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
