import React from 'react';
import { Sliders, ClipboardList, FileCheck } from 'lucide-react';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';

export const AdminShell: React.FC = () => {
  return (
    <div className="space-y-6">
      <CrisisResourceBanner />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
            <p className="text-xs text-slate-500">Therapist license verification, audit review, and security governance</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center my-6">
          <p className="text-sm font-semibold text-slate-700">Administrator Control Center Shell</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Role-aware authentication guard active: Accessible exclusively to users with the ADMIN role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <FileCheck className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Therapist Credential Verification:</strong> Review medical licenses and approve practitioner discovery gating (BR-2 / REQ-UA-15).
            </div>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>System Audit Trails:</strong> Inspect immutable security events, failed logins, and administrative escalations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
