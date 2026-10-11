import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { formatApiError } from '../../api/apiClient';
import { Heart, Lock, KeyRound, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const isPasswordValid =
    newPassword.length >= 8 && /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Password reset token is required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain both a letter and a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.resetPassword({
        token: token.trim(),
        newPassword,
      });

      setSuccess(res.message || 'Password has been successfully updated. Please sign in with your new credentials.');

      setTimeout(() => {
        navigate('/login');
      }, 2500);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Password</h1>
          <p className="text-sm text-slate-500 mt-1">Set a strong new password for your WellNest account</p>
        </div>

        {error && (
          <div
            data-testid="reset-password-error"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-shake"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Reset Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            data-testid="reset-password-success"
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Password Updated</p>
              <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="reset-password-form">
          {/* Reset Token */}
          <div>
            <label htmlFor="reset-token" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Reset Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your 64-character reset token"
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="reset-new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reset-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reset-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Must be at least 8 characters long and contain at least one letter and one number. Reset tokens expire after 30 minutes.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="reset-password-submit-btn"
            className="w-full py-3 px-4 font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
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
