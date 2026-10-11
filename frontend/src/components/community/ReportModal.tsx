import React, { useState } from 'react';
import { communityApi } from '../../api/communityApi';
import { formatApiError } from '../../api/apiClient';
import type { ReportReason, ReportResponse } from '../../types/community.types';
import { Flag, X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  postId?: string;
  commentId?: string;
  itemTitle?: string;
  onClose: () => void;
  onSuccess: (result: ReportResponse) => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  { id: 'INAPPROPRIATE', label: 'Inappropriate Content', desc: 'Offensive language or unsuitable themes' },
  { id: 'HARASSMENT', label: 'Harassment or Bullying', desc: 'Hostile, threatening, or personal attacks' },
  { id: 'SPAM', label: 'Spam or Commercial Links', desc: 'Advertisements or promotional links' },
  { id: 'HATE_SPEECH', label: 'Hate Speech', desc: 'Discriminatory or derogatory statements' },
  { id: 'OTHER', label: 'Other Guidelines Violation', desc: 'Breach of community conduct policies' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  postId,
  commentId,
  itemTitle,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await communityApi.reportContent({
        postId,
        commentId,
        reason,
        details: details.trim() || undefined,
      });

      onSuccess(result);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div
        data-testid="report-modal-content"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="Close report dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h2 id="report-modal-title" className="text-xl font-bold text-slate-900">
              Report Community Content
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Help maintain a safe and supportive mental wellness environment
            </p>
          </div>
        </div>

        {itemTitle && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            Reporting: <span className="font-semibold text-slate-900">&ldquo;{itemTitle}&rdquo;</span>
          </div>
        )}

        {error && (
          <div
            data-testid="report-error-alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="report-form">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Reason for Reporting <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    reason === r.id
                      ? 'bg-rose-50/60 border-rose-400 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{r.label}</div>
                    <div className="text-[11px] text-slate-500">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="report-details" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              id="report-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any specific context to assist moderators..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none transition resize-none"
            />
          </div>

          {/* 3-Report Auto-Hide Notice (BR-8 / REQ-AC-7) */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Automated Community Safety Policy:</strong> Content receiving <strong>3 or more reports</strong> is automatically hidden from the community pending review by human safety moderators.
            </span>
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
              disabled={isSubmitting}
              data-testid="submit-report-btn"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
