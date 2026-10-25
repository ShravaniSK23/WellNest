import React from 'react';
import { Link } from 'react-router-dom';
import type { Therapist } from '../../types/therapist.types';
import {
  ShieldCheck,
  Star,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldAlert,
  Award,
} from 'lucide-react';

interface TherapistCardProps {
  therapist: Therapist;
}

export const TherapistCard: React.FC<TherapistCardProps> = ({ therapist }) => {
  // CRITICAL REQUIREMENT: Never infer verification in frontend.
  // Must rely strictly on the verificationStatus field from backend.
  const isVerified = therapist.verificationStatus === 'VERIFIED';

  return (
    <div
      data-testid={`therapist-card-${therapist.id}`}
      className={`rounded-3xl border bg-white p-6 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${
        isVerified ? 'border-slate-200 hover:border-brand-400' : 'border-rose-200 bg-rose-50/20'
      }`}
    >
      <div className="space-y-4">
        {/* Top Header: Avatar, Name, Rating & Verified Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white font-bold text-lg flex items-center justify-center shadow-xs">
              {therapist.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base">{therapist.fullName}</h3>
                {isVerified ? (
                  <span
                    data-testid="verified-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200"
                    title="Verified against state medical license registry"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span
                    data-testid="unverified-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {therapist.qualifications}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div
            data-testid="therapist-rating"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex-shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{therapist.averageRating.toFixed(1)}</span>
          </div>
        </div>

        {/* Bio summary */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {therapist.biography}
        </p>

        {/* Specialties Tags */}
        {therapist.specializations && therapist.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {therapist.specializations.map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>{therapist.yearsOfExperience}+ Years Experience</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>50 min session</span>
          </div>
        </div>
      </div>

      {/* Footer: Fee & Action CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Consultation</span>
          <div className="flex items-baseline text-slate-900">
            <DollarSign className="w-3.5 h-3.5 -mr-0.5 text-slate-500" />
            <span className="text-lg font-black">{therapist.consultationFee.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 ml-1">/ session</span>
          </div>
        </div>

        {isVerified ? (
          <Link
            to={`/therapists/${therapist.id}`}
            data-testid={`view-profile-btn-${therapist.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition"
          >
            <span>Book Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            disabled
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
};
