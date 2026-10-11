import React from 'react';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import { Smile, Info } from 'lucide-react';

export const MoodShell: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Persistent Crisis Resource Banner (Mandatory per SF-1 / SF-2 for mood screens) */}
      <CrisisResourceBanner />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Mood Tracking</h1>
            <p className="text-xs text-slate-500">Record your daily emotional state and reflections</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center my-6">
          <p className="text-sm font-semibold text-slate-700">Daily Mood Module Shell</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This screen includes the persistent crisis resource banner compliant with requirement SF-1/SF-2. Feature logic for mood submission and streaks is managed downstream.
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Safety &amp; Compliance Notice (SF-3):</strong> WellNest daily mood reflections are non-clinical emotional tools. If you are experiencing thoughts of self-harm, please use the crisis resources above or dial 988 immediately.
          </span>
        </div>
      </div>
    </div>
  );
};
