import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Therapist, AvailabilitySlot } from '../../types/therapist.types';
import { therapistApi } from '../../api/therapistApi';
import { formatApiError } from '../../api/apiClient';
import { SlotPicker } from '../../components/therapist/SlotPicker';
import { BookingModal } from '../../components/appointment/BookingModal';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  DollarSign,
  Clock,
  Award,
  Globe,
  FileCheck,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const TherapistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    therapistApi
      .getTherapistProfile(id)
      .then((data) => {
        if (isMounted) setTherapist(data);
      })
      .catch((err) => {
        if (isMounted) setError(formatApiError(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    setIsLoadingSlots(true);
    therapistApi
      .getTherapistSlots(id)
      .then((data) => {
        if (isMounted) setSlots(data);
      })
      .catch((err) => {
        console.error('Failed to load slots', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div
        data-testid="therapist-detail-loading"
        className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500"
      >
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-medium">Loading practitioner profile and calendar...</span>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="font-bold">Practitioner Not Found or Ineligible</p>
          <p className="text-xs text-rose-700 mt-1">{error || 'This therapist profile could not be loaded.'}</p>
        </div>
        <Link
          to="/therapists"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  // Never infer verification in frontend!
  const isVerified = therapist.verificationStatus === 'VERIFIED';

  const handleBookingSuccess = () => {
    // Refresh slots
    if (id) {
      therapistApi.getTherapistSlots(id).then(setSlots);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Persistent Crisis Resource Banner (SF-1) */}
      <CrisisResourceBanner />

      {/* Back button */}
      <Link
        to="/therapists"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Verified Directory</span>
      </Link>

      {/* Practitioner Profile Header Card */}
      <div
        data-testid="therapist-profile-header"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {therapist.fullName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{therapist.fullName}</h1>
                {isVerified ? (
                  <span
                    data-testid="verified-status-pill"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>State Licensed &amp; Verified</span>
                  </span>
                ) : (
                  <span
                    data-testid="unverified-status-pill"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Verification Required</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {therapist.qualifications}
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                  License #{therapist.licenseNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  {therapist.yearsOfExperience} Years Clinical Experience
                </span>
                {therapist.languages && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {therapist.languages.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fee & Rating Box */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 sm:w-48 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{therapist.averageRating.toFixed(2)} Rating</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Consultation</span>
              <div className="flex items-baseline justify-end text-slate-900">
                <DollarSign className="w-4 h-4 -mr-0.5 text-slate-500" />
                <span className="text-2xl font-black">{therapist.consultationFee.toFixed(2)}</span>
                <span className="text-xs text-slate-400 ml-1">/ 50m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Clinical Background &amp; Approach
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {therapist.biography}
          </p>
        </div>

        {/* Specialties */}
        {therapist.specializations && therapist.specializations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Specialties &amp; Focus Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-100"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 14-Day Calendar Availability & Booking */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        {isVerified ? (
          <>
            <SlotPicker
              slots={slots}
              selectedSlotId={selectedSlot?.id}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              isLoading={isLoadingSlots}
            />

            {/* Selected slot CTA banner */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {selectedSlot ? (
                  <div className="text-xs">
                    <span className="text-slate-400">Selected consultation time:</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {new Date(selectedSlot.startTime).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(selectedSlot.startTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Select an open time slot from the 14-day schedule above to proceed with booking.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedSlot}
                data-testid="proceed-to-book-btn"
                onClick={() => setIsBookingModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>Reserve &amp; Book Consultation</span>
              </button>
            </div>
          </>
        ) : (
          <div
            data-testid="unverified-booking-blocked"
            className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 space-y-2"
          >
            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Bookings Unavailable</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              This practitioner profile is currently unverified or pending administrative review. Per platform safety rules (BR-2, REQ-TS-4), sessions can only be scheduled with verified practitioners.
            </p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          therapist={therapist}
          slot={selectedSlot}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
