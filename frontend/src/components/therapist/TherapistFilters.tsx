import React from 'react';
import type { TherapistSearchFilters } from '../../types/therapist.types';
import { Search, Filter, X, DollarSign } from 'lucide-react';

interface TherapistFiltersProps {
  filters: TherapistSearchFilters;
  onChange: (updated: TherapistSearchFilters) => void;
  onReset: () => void;
  totalFound: number;
}

const SPECIALIZATIONS = [
  'ALL',
  'Anxiety',
  'Depression',
  'CBT',
  'Stress',
  'Trauma & PTSD',
  'Relationships',
  'Mindfulness',
];

export const TherapistFilters: React.FC<TherapistFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalFound,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleSpecSelect = (spec: string) => {
    onChange({
      ...filters,
      specialization: spec === 'ALL' ? undefined : spec,
      page: 1,
    });
  };

  const handleMaxFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? parseFloat(e.target.value) : undefined;
    onChange({ ...filters, maxFee: val, page: 1 });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.specialization || (filters.maxFee && filters.maxFee < 200)
  );

  return (
    <div
      data-testid="therapist-filters-container"
      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5"
    >
      {/* Top Search bar & Max fee input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search input */}
        <div className="md:col-span-2 relative">
          <label htmlFor="therapist-search-input" className="sr-only">
            Search therapists
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="therapist-search-input"
            data-testid="therapist-search-input"
            type="text"
            placeholder="Search by therapist name, qualification, or clinical specialty..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          />
        </div>

        {/* Max Fee Input */}
        <div className="relative">
          <label htmlFor="therapist-max-fee-input" className="sr-only">
            Maximum Consultation Fee
          </label>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1 text-xs font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Max:</span>
          </div>
          <input
            id="therapist-max-fee-input"
            data-testid="therapist-max-fee-input"
            type="number"
            min="0"
            max="300"
            step="10"
            placeholder="Max Fee ($)"
            value={filters.maxFee || ''}
            onChange={handleMaxFeeChange}
            className="w-full pl-16 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Specialization Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Specialization Area
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              data-testid="reset-filters-btn"
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((spec) => {
            const isSelected =
              spec === 'ALL'
                ? !filters.specialization || filters.specialization === 'ALL'
                : filters.specialization?.toLowerCase() === spec.toLowerCase();

            return (
              <button
                key={spec}
                type="button"
                data-testid={`spec-filter-${spec.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => handleSpecSelect(spec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span data-testid="verified-therapists-count">
          Showing <strong className="text-slate-800">{totalFound}</strong> verified licensed practitioners
        </span>
        <span className="text-teal-700 font-medium">✓ Verified against official license registry</span>
      </div>
    </div>
  );
};
