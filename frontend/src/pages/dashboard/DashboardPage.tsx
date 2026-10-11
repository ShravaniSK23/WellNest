import React, { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { formatApiError } from '../../api/apiClient';
import type {
  DashboardSummaryResponse,
  RangeDays,
} from '../../types/dashboard.types';
import { RangeSelector } from '../../components/dashboard/RangeSelector';
import { AnalyticsSummaryCards } from '../../components/dashboard/AnalyticsSummaryCards';
import { MoodChart } from '../../components/dashboard/MoodChart';
import { UpcomingAppointmentsList } from '../../components/dashboard/UpcomingAppointmentsList';
import { RecommendedTherapistsList } from '../../components/dashboard/RecommendedTherapistsList';
import { NeedSomeoneToTalkBanner } from '../../components/dashboard/NeedSomeoneToTalkBanner';
import { WeeklyReportModal } from '../../components/dashboard/WeeklyReportModal';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  LayoutDashboard,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (range: RangeDays) => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await dashboardApi.getSummary(range);
      setData(summary);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(rangeDays);
  }, [rangeDays, fetchDashboardData]);

  const handleRangeChange = (newRange: RangeDays) => {
    setRangeDays(newRange);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Persistent Crisis Resource Banner (SF-1) */}
      <CrisisResourceBanner />

      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-100 text-brand-700">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Wellness Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Personal emotional analytics, therapy sessions, and wellness insights
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 7/30/90-Day Range Selector */}
          <RangeSelector
            selectedRange={rangeDays}
            onChange={handleRangeChange}
            disabled={isLoading}
          />

          {/* Weekly Report & PDF Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            data-testid="open-weekly-report-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-2xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Weekly Report / PDF</span>
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => fetchDashboardData(rangeDays)}
            disabled={isLoading}
            aria-label="Refresh dashboard metrics"
            className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          data-testid="dashboard-error-alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Unable to load dashboard data</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData(rangeDays)}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State Skeleton */}
      {isLoading ? (
        <div
          data-testid="dashboard-loading-state"
          className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 className="w-9 h-9 animate-spin text-brand-600" />
          <span className="text-sm font-medium">Aggregating wellness analytics from server...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Quick Action: Log Today's Mood if desired */}
          <div className="bg-gradient-to-r from-teal-50 to-brand-50 border border-brand-200/60 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Track Today's Emotional State</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Check in daily to build your consecutive streak and unlock personalized audio atmospheres.
              </p>
            </div>
            <Link
              to="/moods"
              data-testid="dashboard-log-mood-link"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition shadow-sm flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open Mood Tracker</span>
            </Link>
          </div>

          {/* 1. Analytics Summary Metrics Cards (Frequent Mood, Variability, Journaling Frequency, SF-3 Disclaimer) */}
          <AnalyticsSummaryCards analytics={data.analytics} />

          {/* 2. Mood Trend Chart Timeline */}
          <MoodChart moodHistory={data.moodHistory} rangeDays={data.rangeDays} />

          {/* 3. 'Need someone to talk to?' Conditional Banner */}
          <NeedSomeoneToTalkBanner show={data.showNeedSomeoneToTalkPrompt} />

          {/* 4. Upcoming Confirmed Appointments */}
          <UpcomingAppointmentsList appointments={data.upcomingAppointments} />

          {/* 5. Up to 3 Recommended Verified Therapists */}
          <RecommendedTherapistsList therapists={data.recommendedTherapists} />
        </div>
      ) : null}

      {/* Weekly Report & PDF Modal */}
      <WeeklyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
