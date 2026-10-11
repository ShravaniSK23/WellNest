import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatApiError } from '../../api/apiClient';
import { Heart, Lock, Mail, Loader2, AlertCircle, Phone } from 'lucide-react';
import { getRoleHomePath } from '../../components/auth/PublicRoute';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read destination if passed via ProtectedRoute redirect
  const fromLocation = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login({ email: email.trim(), password });

      // If MFA is required, AuthContext sets mfaPending which opens MfaPromptModal automatically
      if (result.mfaRequired) {
        return;
      }

      if (result.success) {
        const dest = fromLocation || getRoleHomePath(user?.role);
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Heart className="w-7 h-7 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your WellNest mental wellness account</p>
        </div>

        {error && (
          <div
            data-testid="login-error-alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-shake"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Sign-in Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="login-submit-btn"
            className="w-full py-3 px-4 font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Persistent crisis link footnote */}
        <div className="mt-6 text-center">
          <a
            href="tel:988"
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Need immediate support? Call 988 Lifeline</span>
          </a>
        </div>
      </div>
    </div>
  );
};
