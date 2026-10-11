import React from 'react';
import type { DashboardAnalytics } from '../../types/dashboard.types';
import { Smile, Activity, BookOpen, AlertCircle } from 'lucide-react';

interface AnalyticsSummaryCardsProps {
  analytics: DashboardAnalytics;
  className?: string;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
  analytics,
  className = '',
}) => {
  const getVariabilityBadge = (variability: string) => {
    switch (variability) {
      case 'LOW':
        return (
          <span
            data-testid="variability-badge"
            className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
          >
            LOW (Stable)
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            data-testid="variability-badge"
            className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200"
          >
            MEDIUM (Balanced)
          </span>
        );
      case 'HIGH':
        return (
          <span
            data-testid="variability-badge"
            className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200"
          >
            HIGH (Varied)
          </span>
        );
      default:
        return (
          <span data-testid="variability-badge" className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
            {variability}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3 Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Most Frequent Mood */}
        <div
          data-testid="analytics-card-frequent-mood"
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Most Frequent Mood
            </span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="analytics-frequent-mood-value"
              className="text-3xl sm:text-4xl select-none"
            >
              {analytics.frequentMood || 'N/A'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              dominant sentiment
            </span>
          </div>
        </div>

        {/* Mood Variability */}
        <div
          data-testid="analytics-card-variability"
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mood Variability
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              data-testid="analytics-variability-value"
              className="text-xl font-extrabold text-slate-900"
            >
              {analytics.variability}
            </span>
            {getVariabilityBadge(analytics.variability)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Statistical variability from backend analytics
          </p>
        </div>

        {/* Journaling Frequency */}
        <div
          data-testid="analytics-card-journaling"
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Journaling Reflections
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="analytics-journaling-frequency-value"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums"
            >
              {analytics.journalingFrequency}
            </span>
            <span className="text-xs font-medium text-slate-500">entries in range</span>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Notice (SF-3) */}
      <div
        data-testid="analytics-disclaimer-notice"
        className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5"
      >
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Non-Diagnostic Notice (SF-3):</strong>{' '}
          {analytics.disclaimer ||
            'Informational summary only. Not a clinical diagnosis. These insights reflect subjective tracking data.'}
        </div>
      </div>
    </div>
  );
};
