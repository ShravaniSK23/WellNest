import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { formatApiError } from '../../api/apiClient';
import { Heart, Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDevToken(null);
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSuccess(
        response.message ||
          'If an account exists for this email, password reset instructions have been dispatched.'
      );
      if (response.resetToken) {
        setDevToken(response.resetToken);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Heart className="w-7 h-7 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your email to receive password recovery instructions
          </p>
        </div>

        {error && (
          <div
            data-testid="forgot-password-error"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-shake"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Request Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            data-testid="forgot-password-success"
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Request Processed</p>
              <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {devToken && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-800 mb-1">
              <KeyRound className="w-4 h-4 text-indigo-600" /> Development Reset Token Received:
            </p>
            <code className="block p-2 bg-white rounded border border-indigo-200 font-mono text-[11px] break-all select-all my-2">
              {devToken}
            </code>
            <Link
              to={`/reset-password?token=${devToken}`}
              className="inline-block mt-1 font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
            >
              &rarr; Proceed to Reset Password with this Token
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="forgot-password-form">
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Account Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="forgot-password-submit-btn"
            className="w-full py-3 px-4 font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <span>Send Reset Instructions</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
