import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { formatApiError } from '../../api/apiClient';

export const MfaPromptModal: React.FC = () => {
  const { mfaPending, verifyMfa, cancelMfa } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mfaPending?.isPending) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await verifyMfa(code.trim());
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="mfa-prompt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-modal-title"
    >
      <div
        data-testid="mfa-prompt-modal-content"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h2 id="mfa-modal-title" className="text-xl font-bold text-center text-slate-900 mb-1">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-center text-slate-600 mb-6">
          Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) to complete sign-in.
        </p>

        {error && (
          <div
            data-testid="mfa-error-alert"
            className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mfaCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Authentication Code
            </label>
            <input
              id="mfaCode"
              name="mfaCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCode(val);
                if (error) setError(null);
              }}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            data-testid="submit-mfa-code-btn"
            className="w-full py-3 px-4 font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          <button
            type="button"
            onClick={cancelMfa}
            data-testid="cancel-mfa-btn"
            className="w-full inline-flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
        </form>
      </div>
    </div>
  );
};
