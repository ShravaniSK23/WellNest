import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../api/userApi';
import { formatApiError } from '../../api/apiClient';
import {
  User,
  ShieldCheck,
  KeyRound,
  Trash2,
  Clock,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { MfaEnrollModal } from '../../components/auth/MfaEnrollModal';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [biography, setBiography] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // MFA Modal State
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize form fields from user object
  useEffect(() => {
    if (user) {
      const name =
        user.helpSeeker?.fullName ||
        user.therapist?.fullName ||
        user.email.split('@')[0];
      setFullName(name);
      setTimezone(user.helpSeeker?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      if (user.therapist) {
        setBiography(user.therapist.biography || '');
        setQualifications(user.therapist.qualifications || '');
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsUpdatingProfile(true);

    try {
      const res = await userApi.updateProfile({
        fullName: fullName.trim(),
        timezone: timezone.trim(),
        biography: biography.trim() || undefined,
        qualifications: qualifications.trim() || undefined,
      });
      await refreshProfile();
      setProfileSuccess(res.message || 'Profile successfully updated.');
    } catch (err) {
      setProfileError(formatApiError(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError('New password must be at least 8 characters long and contain both a letter and a number.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message || 'Password changed successfully. All other active sessions have been invalidated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(formatApiError(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await userApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(formatApiError(err));
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account &amp; Security</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal profile, credentials, and authentication preferences</p>
      </div>

      {/* User Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 font-bold text-2xl flex items-center justify-center">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Role: {user.role}
              </span>
              {user.mfaEnabled ? (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2FA Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  2FA Disabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Edit Profile */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Profile Details</h3>
            <p className="text-xs text-slate-500">Update your name, timezone, and professional details</p>
          </div>
        </div>

        {profileError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <p className="text-xs">{profileError}</p>
          </div>
        )}

        {profileSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="text-xs">{profileSuccess}</p>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4" data-testid="profile-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="prof-timezone" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Preferred Timezone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  id="prof-timezone"
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. America/New_York"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {user.role === 'THERAPIST' && (
            <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="prof-qualifications" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Qualifications &amp; Degrees
                </label>
                <input
                  id="prof-qualifications"
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="prof-bio" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Biography
                </label>
                <textarea
                  id="prof-bio"
                  rows={3}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              data-testid="save-profile-btn"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Security & Two-Factor Authentication */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-slate-500">Protect your WellNest account with an authenticator application</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {user.mfaEnabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Disabled'}
            </p>
            <p className="text-xs text-slate-600 mt-1 max-w-lg">
              {user.mfaEnabled
                ? 'Your account requires an authenticator passcode (TOTP) during login for enhanced protection.'
                : 'MFA adds an essential second layer of defense. It is strongly recommended for all accounts and required for Therapists, Moderators, and Administrators.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMfaModalOpen(true)}
            data-testid="configure-mfa-btn"
            className="px-4 py-2 text-xs font-semibold text-brand-700 bg-white border border-brand-300 hover:bg-brand-50 rounded-lg shadow-xs transition"
          >
            {user.mfaEnabled ? 'Reconfigure 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </section>

      {/* Section 3: Password Change */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500">Update your sign-in password. Note: active sessions will be revoked.</p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
            <p className="text-xs">{passwordError}</p>
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <p className="text-xs">{passwordSuccess}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg" data-testid="change-password-form">
          <div>
            <label htmlFor="curr-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Current Password
            </label>
            <input
              id="curr-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 chars, letters and numbers"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              data-testid="update-password-btn"
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 4: Danger Zone / Delete Account */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">Danger Zone: Account Deletion</h3>
            <p className="text-xs text-rose-600">Irreversibly anonymize and soft-delete your WellNest account (SE-10)</p>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{deleteError}</span>
          </div>
        )}

        {!showDeleteConfirm ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-600">
              Deleting your account will scrub your personal identifiers, invalidate all active sessions, and anonymize your records.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              data-testid="init-delete-btn"
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-lg transition"
            >
              Delete My Account
            </button>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-start gap-2 text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>
                This action cannot be undone. To permanently delete your account, type <strong>DELETE</strong> below:
              </span>
            </div>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full max-w-xs px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmationText('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText !== 'DELETE'}
                data-testid="confirm-delete-btn"
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Permanent Deletion</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MFA Setup Modal */}
      <MfaEnrollModal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        onSuccess={() => {
          refreshProfile();
        }}
      />
    </div>
  );
};
