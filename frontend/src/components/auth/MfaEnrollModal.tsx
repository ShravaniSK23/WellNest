import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { X, ShieldCheck, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { formatApiError } from '../../api/apiClient';

interface MfaEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MfaEnrollModal: React.FC<MfaEnrollModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSetupData(null);
      setError(null);
      setVerifyCode('');
      setSuccessMessage(null);
      return;
    }

    const initSetup = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authApi.setupMfa();
        setSetupData(data);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    };

    initSetup();
  }, [isOpen]);

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.trim().length !== 6 || !user?.id) return;

    try {
      setIsVerifying(true);
      setError(null);
      // In the backend, verifyMfa requires { userId, sessionId, mfaCode }
      // We send verification to activate MFA:
      await authApi.verifyMfa({
        userId: user.id,
        sessionId: 'enrollment-verification',
        mfaCode: verifyCode.trim(),
      });
      await refreshProfile();
      setSuccessMessage('Two-Factor Authentication has been successfully enabled on your account!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="mfa-enroll-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-enroll-title"
    >
      <div
        data-testid="mfa-enroll-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 id="mfa-enroll-title" className="text-xl font-bold text-slate-900">
              Set Up Two-Factor Authentication
            </h2>
            <p className="text-xs text-slate-500">Enhance your WellNest account security with TOTP authentication</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-sm">Generating secure QR code...</span>
          </div>
        ) : setupData ? (
          <div className="space-y-5">
            <div className="text-sm text-slate-600">
              <strong>Step 1:</strong> Scan this QR code with Google Authenticator, Authy, or 1Password.
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={setupData.qrCodeUrl}
                alt="WellNest MFA QR Code"
                className="w-48 h-48 rounded-lg shadow-sm bg-white p-2"
                data-testid="mfa-qrcode-image"
              />
            </div>

            <div className="text-xs text-slate-600">
              <span className="block mb-1 font-semibold text-slate-700">Can't scan the QR code? Use manual setup key:</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-slate-100 rounded font-mono text-slate-800 break-all select-all">
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded transition flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="verifyEnrollCode" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  <strong>Step 2:</strong> Enter 6-digit code to activate
                </label>
                <input
                  id="verifyEnrollCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-xl tracking-widest font-mono py-2.5 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || verifyCode.length !== 6}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow transition text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Activate MFA</span>}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};
