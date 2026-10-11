import React from 'react';
import type { RecommendedTherapist } from '../../types/dashboard.types';
import { Star, ShieldCheck, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecommendedTherapistsListProps {
  therapists: RecommendedTherapist[];
}

export const RecommendedTherapistsList: React.FC<RecommendedTherapistsListProps> = ({
  therapists,
}) => {
  return (
    <div
      data-testid="recommended-therapists-section"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Recommended Licensed Therapists</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified mental health professionals available for consultation
          </p>
        </div>
        <Link
          to="/therapists"
          className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {therapists.length === 0 ? (
        <div
          data-testid="recommended-therapists-empty"
          className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500"
        >
          No therapist recommendations currently available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {therapists.slice(0, 3).map((therapist) => (
            <div
              key={therapist.id}
              data-testid={`recommended-therapist-card-${therapist.id}`}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-brand-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
                    {therapist.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{therapist.averageRating.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {therapist.fullName}
                  </h4>
                  <p className="text-xs text-teal-700 font-medium line-clamp-1">
                    {therapist.qualifications}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {therapist.biography}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div className="text-xs text-slate-600 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 -mr-0.5" />
                  <span className="font-bold text-slate-900">{therapist.consultationFee.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">/ session</span>
                </div>

                <Link
                  to="/therapists"
                  className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
                >
                  Book Slot
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
