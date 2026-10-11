import React, { useState } from 'react';
import type {
  ModerationActionType,
  ModerationQueueItem,
} from '../../types/community.types';
import { moderationApi } from '../../api/moderationApi';
import { formatApiError } from '../../api/apiClient';
import {
  ShieldAlert,
  RotateCcw,
  Trash2,
  Clock,
  ArrowUpRight,
  X,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';

interface ModerationActionDialogProps {
  isOpen: boolean;
  item: ModerationQueueItem;
  itemType: 'post' | 'comment';
  onClose: () => void;
  onSuccess: (result: { actionId: string; actionType: string; message: string }) => void;
}

const ACTION_OPTIONS: {
  type: ModerationActionType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}[] = [
  {
    type: 'RESTORE',
    label: 'Restore Content',
    description: 'Deem content compliant with community standards and return to visible feed',
    icon: RotateCcw,
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  {
    type: 'PERMANENT_REMOVE',
    label: 'Permanent Removal',
    description: 'Permanently delete violating content from the platform',
    icon: Trash2,
    colorClass: 'text-rose-700 bg-rose-50 border-rose-300',
  },
  {
    type: 'TEMPORARY_SUSPENSION',
    label: 'Temporary Suspension (<= 7 Days)',
    description: 'Temporarily restrict the author account from posting or commenting',
    icon: Clock,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-300',
  },
  {
    type: 'ESCALATE',
    label: 'Escalate to Admin',
    description: 'Refer complex, severe, or imminent-harm cases to senior administrative review',
    icon: ArrowUpRight,
    colorClass: 'text-purple-700 bg-purple-50 border-purple-300',
  },
];

export const ModerationActionDialog: React.FC<ModerationActionDialogProps> = ({
  isOpen,
  item,
  itemType,
  onClose,
  onSuccess,
}) => {
  const [actionType, setActionType] = useState<ModerationActionType>('RESTORE');
  const [durationDays, setDurationDays] = useState<number>(3);
  const [reasoning, setReasoning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reasoning.trim()) {
      setError('A written justification/reasoning is required for all moderation decisions.');
      return;
    }

    if (reasoning.trim().length < 5) {
      setError('Reasoning must be at least 5 characters long.');
      return;
    }

    if (actionType === 'TEMPORARY_SUSPENSION' && (durationDays < 1 || durationDays > 7)) {
      setError('Suspension duration must be between 1 and 7 days.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        actionType,
        postId: itemType === 'post' ? item.id : item.postId,
        commentId: itemType === 'comment' ? item.id : undefined,
        durationDays: actionType === 'TEMPORARY_SUSPENSION' ? durationDays : undefined,
        reasoning: reasoning.trim(),
      };

      const res = await moderationApi.executeAction(payload);
      onSuccess(res);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="moderation-action-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-dialog-title"
      onClick={onClose}
    >
      <div
        data-testid="moderation-action-dialog-content"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="Close action dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dialog Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 id="action-dialog-title" className="text-xl font-bold text-slate-900">
              Execute Moderation Action
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review flagged content and enforce safety community guidelines
            </p>
          </div>
        </div>

        {/* Item Summary (Pseudonym Only) */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Pseudonym:</span>
              <span
                data-testid="moderation-target-pseudonym"
                className="text-brand-700 font-bold"
              >
                {item.authorPseudonym}
              </span>
            </div>
            <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
              {item.reportCount} Reports
            </span>
          </div>

          {item.title && (
            <div className="font-bold text-slate-900 text-sm">
              &ldquo;{item.title}&rdquo;
            </div>
          )}

          <p className="text-slate-600 italic line-clamp-3">
            &ldquo;{item.content}&rdquo;
          </p>
        </div>

        {error && (
          <div
            data-testid="moderation-error-alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="moderation-action-form">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Action <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {ACTION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = actionType === opt.type;
                return (
                  <label
                    key={opt.type}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? `${opt.colorClass} shadow-2xs font-semibold`
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moderationAction"
                      value={opt.type}
                      checked={isSelected}
                      onChange={() => setActionType(opt.type)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* If Temporary Suspension: Duration selector (<= 7 days) */}
          {actionType === 'TEMPORARY_SUSPENSION' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl animate-fade-in space-y-2">
              <label
                htmlFor="suspension-duration"
                className="block text-xs font-bold text-amber-900"
              >
                Suspension Duration (Max 7 Days) <span className="text-rose-500">*</span>
              </label>
              <select
                id="suspension-duration"
                data-testid="suspension-duration-select"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days (Maximum allowed)</option>
              </select>
              <p className="text-[11px] text-amber-800">
                User account will be prevented from submitting posts or comments for this duration.
              </p>
            </div>
          )}

          {/* Mandatory Reasoning */}
          <div>
            <label
              htmlFor="moderation-reasoning"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Decision Reasoning / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="moderation-reasoning"
              data-testid="moderation-reasoning-input"
              rows={3}
              required
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Detail the rationale for this action (e.g., Harassment policy violation in comment body)..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reasoning.trim()}
              data-testid="submit-moderation-action-btn"
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Confirm Action</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
