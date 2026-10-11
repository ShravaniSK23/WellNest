import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, FileBadge, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';

export const TherapistShell: React.FC = () => {
  const { user } = useAuth();
  const therapist = user?.therapist;
  const status = therapist?.verificationStatus || 'UNVERIFIED';

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Licensed &amp; Verified
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Credentials Under Administrator Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Credentials Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-full flex items-center gap-1.5">
            <FileBadge className="w-3.5 h-3.5" /> Pending Credential Upload
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <CrisisResourceBanner />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Therapist Clinical Portal</h1>
              <p className="text-xs text-slate-500">Manage therapy schedules, patient sessions, and credentials</p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center my-6">
          <p className="text-sm font-semibold text-slate-700">Therapist Workspace Shell</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Role-aware authentication guard active: Accessible exclusively to registered practitioners with the THERAPIST role.
          </p>
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
          <strong>Practitioner Notice:</strong> Per platform security policies (SE-6), you only have access to patient session records for HelpSeekers who have booked a confirmed appointment with you.
        </div>
      </div>
    </div>
  );
};
