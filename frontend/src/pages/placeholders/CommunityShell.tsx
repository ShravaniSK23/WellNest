import React from 'react';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import { Users, Shield, Info } from 'lucide-react';

export const CommunityShell: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Persistent Crisis Resource Banner (Mandatory per SF-1 / SF-2 for community screens) */}
      <CrisisResourceBanner />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Anonymous Community Forum</h1>
            <p className="text-xs text-slate-500">Safe, pseudonymous peer-to-peer mental wellness discussion</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center my-6">
          <p className="text-sm font-semibold text-slate-700">Community Forum Module Shell</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This screen includes the persistent crisis resource banner compliant with requirement SF-1/SF-2. Forum post and moderation logic is managed downstream.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Pseudonymous Privacy (BR-7):</strong> In forum spaces, your real identity and email are completely concealed under an assigned pseudonym.
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Moderation Policy:</strong> Posts receiving $\ge 3$ community reports are automatically hidden pending human moderator review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
