import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { formatApiError } from '../../api/apiClient';
import type { WeeklyReportRecord } from '../../types/dashboard.types';
import {
  FileText,
  Download,
  X,
  Loader2,
  Calendar,
  Smile,
  Activity,
  BookOpen,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<WeeklyReportRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReport(null);
      setError(null);
      setDownloadSuccess(false);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getWeeklyReport();
        setReport(data.report);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError(null);
    setDownloadSuccess(false);
    try {
      const blob = await dashboardApi.downloadWeeklyReportPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'WellNest_Wellness_Report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const summary = report?.summaryJson;

  return (
    <div
      data-testid="weekly-report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-report-title"
      onClick={onClose}
    >
      <div
        data-testid="weekly-report-modal-content"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="Close weekly report modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-brand-100 text-brand-700">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 id="weekly-report-title" className="text-xl font-bold text-slate-900">
              Weekly Wellness Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 7-day emotional reflection and analytics summary
            </p>
          </div>
        </div>

        {error && (
          <div
            data-testid="weekly-report-error"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>WellNest_Wellness_Report.pdf downloaded successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Generating weekly report...</span>
          </div>
        ) : summary ? (
          <div className="space-y-5">
            {/* Period Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" /> Reporting Period
              </span>
              <span className="font-bold text-slate-900">
                {summary.periodStart} &mdash; {summary.periodEnd}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Smile className="w-3.5 h-3.5 text-brand-600" /> Frequent Mood
                </div>
                <div className="text-2xl font-bold text-slate-900">{summary.frequentMood}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" /> Variability
                </div>
                <div className="text-lg font-bold text-slate-900">{summary.variability}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" /> Moods Logged
                </div>
                <div className="text-2xl font-bold text-slate-900">{summary.totalMoodsLogged}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-purple-600" /> Journal Entries
                </div>
                <div className="text-2xl font-bold text-slate-900">{summary.journalingFrequency}</div>
              </div>
            </div>

            {/* Non-diagnostic notice per SF-3 */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Non-Diagnostic Disclaimer (SF-3):</strong>{' '}
              {summary.disclaimer || 'Informational summary only. Not a clinical diagnosis.'}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                data-testid="download-pdf-btn"
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
