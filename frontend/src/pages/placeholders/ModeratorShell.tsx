import React from 'react';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';

export const ModeratorShell: React.FC = () => {
  return (
    <div className="space-y-6">
      <CrisisResourceBanner />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Community Safety Moderation</h1>
            <p className="text-xs text-slate-500">Review flagged forum discussions and enforce community guidelines</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center my-6">
          <p className="text-sm font-semibold text-slate-700">Moderation Queue Shell</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Role-aware authentication guard active: Accessible exclusively to MODERATOR and ADMIN roles.
          </p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Anonymity Enforcement:</strong> Forum review entries preserve HelpSeeker pseudonymity (BR-7). Unmasking personal real names requires formal System Admin escalation.
          </span>
        </div>
      </div>
    </div>
  );
};
