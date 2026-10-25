import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, Copy, Check, QrCode } from 'lucide-react';
import { formatApiError } from '../../api/apiClient';
import { authApi } from '../../api/authApi';
import type { MfaSetupResponse } from '../../types/auth.types';

export const MfaPromptModal: React.FC = () => {
  const { mfaPending, verifyMfa, cancelMfa } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup state for first-time MFA enrollment (mandatory roles like Therapist)
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isEnrollment = Boolean(mfaPending?.isEnrollmentRequired);

  useEffect(() => {
    if (!mfaPending?.isPending || !mfaPending.isEnrollmentRequired) {
      setSetupData(null);
      setSetupError(null);
      return;
    }

    let isMounted = true;

    const fetchSetup = async () => {
      try {
        setIsLoadingSetup(true);
        setSetupError(null);
        const data = await authApi.setupMfa(mfaPending.mfaPendingToken);
        if (isMounted) {
          setSetupData(data);
        }
      } catch (err) {
        if (isMounted) {
          setSetupError(formatApiError(err));
        }
      } finally {
        if (isMounted) {
          setIsLoadingSetup(false);
        }
      }
    };

    fetchSetup();

    return () => {
      isMounted = false;
    };
  }, [mfaPending?.isPending, mfaPending?.isEnrollmentRequired, mfaPending?.mfaPendingToken]);

  if (!mfaPending?.isPending) return null;

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h2 id="mfa-modal-title" className="text-xl font-bold text-center text-slate-900 mb-1">
          {isEnrollment ? 'Set Up Two-Factor Authentication' : 'Two-Factor Authentication'}
        </h2>

        <p className="text-sm text-center text-slate-600 mb-4">
          {isEnrollment
            ? `MFA enrollment is required for your ${mfaPending.role ? mfaPending.role.toLowerCase() : 'account'} role before login. Scan the QR code with your authenticator app and enter the 6-digit code.`
            : 'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) to complete sign-in.'}
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

        {isEnrollment && isLoadingSetup && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-sm">Generating secure QR code...</span>
          </div>
        )}

        {isEnrollment && setupError && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>Failed to load MFA setup: {setupError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSetupError(null);
                setIsLoadingSetup(true);
                authApi
                  .setupMfa(mfaPending.mfaPendingToken)
                  .then((d) => setSetupData(d))
                  .catch((e) => setSetupError(formatApiError(e)))
                  .finally(() => setIsLoadingSetup(false));
              }}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
            >
              Retry generating setup key
            </button>
          </div>
        )}

        {isEnrollment && setupData && (
          <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Step 1: Scan QR Code with Authenticator App</span>
            </div>
            <div className="flex justify-center p-2 bg-white rounded-lg border border-slate-200">
              <img
                src={setupData.qrCodeUrl}
                alt="WellNest MFA QR Code"
                className="w-44 h-44 object-contain"
                data-testid="mfa-qrcode-image"
              />
            </div>
            <div className="text-xs text-slate-600">
              <span className="block mb-1 font-medium text-slate-700">Can't scan? Use manual setup key:</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white border border-slate-200 rounded font-mono text-slate-800 text-[11px] break-all select-all">
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  data-testid="copy-mfa-secret-btn"
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded transition flex items-center gap-1 flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mfaCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              {isEnrollment ? 'Step 2: Enter 6-Digit Code from App' : 'Authentication Code'}
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
            disabled={isSubmitting || code.length !== 6 || (isEnrollment && isLoadingSetup)}
            data-testid="submit-mfa-code-btn"
            className="w-full py-3 px-4 font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>{isEnrollment ? 'Verify & Complete Setup' : 'Verify & Continue'}</span>
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
