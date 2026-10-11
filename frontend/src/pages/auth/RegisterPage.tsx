import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth.types';
import { formatApiError } from '../../api/apiClient';
import {
  Heart,
  Mail,
  Lock,
  User,
  Clock,
  Shield,
  FileBadge,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('HELP_SEEKER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  // Therapist-specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [biography, setBiography] = useState('');

  const [safetyConsent, setSafetyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation helper
  const isPasswordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain both a letter and a number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'THERAPIST' && !licenseNumber.trim()) {
      setError('License number is required for therapist registration.');
      return;
    }

    if (!safetyConsent) {
      setError('Please acknowledge the non-emergency platform notice.');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        role,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        timezone,
        licenseNumber: role === 'THERAPIST' ? licenseNumber.trim() : undefined,
        qualifications: role === 'THERAPIST' ? qualifications.trim() : undefined,
        biography: role === 'THERAPIST' ? biography.trim() : undefined,
      });

      setSuccessMessage(
        'Account registered successfully! You can now sign in with your email and password.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Heart className="w-7 h-7 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Join WellNest</h1>
          <p className="text-sm text-slate-500 mt-1">Start your holistic emotional wellness journey</p>
        </div>

        {error && (
          <div
            data-testid="register-error-alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-shake"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Registration Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            data-testid="register-success-alert"
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Registration Complete</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'HELP_SEEKER', label: 'Help Seeker' },
              { id: 'THERAPIST', label: 'Therapist' },
              { id: 'MODERATOR', label: 'Moderator' },
              { id: 'ADMIN', label: 'Admin' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id as UserRole)}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  role === item.id
                    ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Password must be at least 8 characters long and contain at least one letter and one number.
          </p>

          {/* Timezone */}
          <div>
            <label htmlFor="reg-timezone" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="reg-timezone"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. UTC or America/New_York"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              />
            </div>
          </div>

          {/* Conditional Therapist Fields */}
          {role === 'THERAPIST' && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Therapist Professional Credentials</span>
              </div>

              <div>
                <label htmlFor="reg-license" className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical / Clinical License Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileBadge className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-license"
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. PSY-123456"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-qualifications" className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualifications &amp; Degrees
                </label>
                <input
                  id="reg-qualifications"
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Ph.D. Clinical Psychology, LMFT"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-bio" className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Professional Biography
                </label>
                <textarea
                  id="reg-bio"
                  rows={2}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Specializing in cognitive behavioral therapy, anxiety, and depression."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="text-[11px] text-indigo-800 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Therapist profiles require administrator verification before appearing in search results.</span>
              </div>
            </div>
          )}

          {/* Safety Notice Consent (SF-1 / SF-2) */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyConsent}
                onChange={(e) => setSafetyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                I understand that WellNest is an emotional well-being platform and <strong>not an emergency crisis response service</strong>. For acute emergencies, I will dial 988 or regional emergency services.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="register-submit-btn"
            className="w-full py-3 px-4 font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
