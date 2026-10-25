import React, { useState, useEffect, useCallback } from 'react';
import type {
  Therapist,
  TherapistSearchFilters,
  TherapistPagination,
} from '../../types/therapist.types';
import { therapistApi } from '../../api/therapistApi';
import { formatApiError } from '../../api/apiClient';
import { TherapistCard } from '../../components/therapist/TherapistCard';
import { TherapistFilters } from '../../components/therapist/TherapistFilters';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';

export const TherapistsPage: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [pagination, setPagination] = useState<TherapistPagination>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<TherapistSearchFilters>({
    page: 1,
    limit: 9,
    maxFee: 200,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTherapists = useCallback(async (currentFilters: TherapistSearchFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await therapistApi.searchTherapists(currentFilters);
      // Strictly verified only (BR-1, BR-2, REQ-TS-4)
      const verifiedOnly = res.therapists.filter((t) => t.verificationStatus === 'VERIFIED');
      setTherapists(verifiedOnly);
      setPagination(res.pagination);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTherapists(filters);
  }, [filters, fetchTherapists]);

  const handleFiltersChange = (updated: TherapistSearchFilters) => {
    setFilters(updated);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 9,
      maxFee: 200,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Persistent Crisis Safety Banner (SF-1) */}
      <CrisisResourceBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-700">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Verified Practitioners
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse board-certified licensed psychologists, psychiatrists, and clinical therapists
            </p>
          </div>
        </div>

        {/* Verification Safety Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Strict Registry Verification Active (BR-2)</span>
        </div>
      </div>

      {/* Filter Component */}
      <TherapistFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        totalFound={pagination.total}
      />

      {/* Error Alert */}
      {error && (
        <div
          data-testid="therapists-error-alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Failed to load therapists</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchTherapists(filters)}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div
          data-testid="therapists-loading-state"
          className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-medium">Filtering verified clinical practitioners...</span>
        </div>
      ) : therapists.length === 0 ? (
        /* Empty State */
        <div
          data-testid="therapists-empty-state"
          className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4 max-w-md mx-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Therapists Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No verified practitioners match your current filter criteria. Try adjusting the specialization or fee range.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Therapists Grid */
        <div
          data-testid="therapists-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {therapists.map((therapist) => (
            <TherapistCard key={therapist.id} therapist={therapist} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div
          data-testid="therapists-pagination"
          className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs text-slate-600"
        >
          <span>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              data-testid="prev-page-btn"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              data-testid="next-page-btn"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice Footer */}
      <div className="p-4 rounded-2xl bg-slate-100/70 text-slate-500 text-xs flex items-center gap-3">
        <LifeBuoy className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <span>
          <strong>Clinical Safety &amp; Emergency Disclaimer:</strong> Therapy consultations are scheduled appointments and not intended for acute emergency crises. If you or someone you know is in immediate crisis, please call 988 or visit an emergency room.
        </span>
      </div>
    </div>
  );
};
