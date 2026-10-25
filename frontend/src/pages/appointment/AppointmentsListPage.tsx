import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment, CancelResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import { AppointmentCard } from '../../components/appointment/AppointmentCard';
import { RescheduleModal } from '../../components/appointment/RescheduleModal';
import { CancellationModal } from '../../components/appointment/CancellationModal';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  Calendar,
  Loader2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

type FilterTab = 'ALL' | 'UPCOMING' | 'PENDING' | 'COMPLETED' | 'CANCELED';

export const AppointmentsListPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentApi.getAppointments('HELP_SEEKER');
      setAppointments(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleRescheduleSuccess = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleCancelSuccess = (res: CancelResponse) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === res.appointmentId) {
          return {
            ...a,
            status: 'CANCELED',
            refundStatus: res.refundStatus || 'FULL_REFUND_INITIATED',
            paymentStatus: res.fullRefundInitiated ? 'REFUNDED' : a.paymentStatus,
          };
        }
        return a;
      })
    );
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') {
      return apt.status === 'CONFIRMED' || apt.status === 'PENDING_CONFIRMATION';
    }
    if (activeTab === 'PENDING') return apt.status === 'PENDING_CONFIRMATION';
    if (activeTab === 'COMPLETED') return apt.status === 'COMPLETED';
    if (activeTab === 'CANCELED') return apt.status === 'CANCELED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Crisis Resource Safety Banner (SF-1) */}
      <CrisisResourceBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              My Therapy Appointments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review scheduled sessions, join video consultations, and manage bookings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchAppointments}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/therapists"
            data-testid="book-new-session-cta"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Session</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        data-testid="appointments-filter-tabs"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold"
      >
        {(['ALL', 'UPCOMING', 'PENDING', 'COMPLETED', 'CANCELED'] as FilterTab[]).map(
          (tab) => {
            const count = appointments.filter((a) => {
              if (tab === 'ALL') return true;
              if (tab === 'UPCOMING') return a.status === 'CONFIRMED' || a.status === 'PENDING_CONFIRMATION';
              if (tab === 'PENDING') return a.status === 'PENDING_CONFIRMATION';
              if (tab === 'COMPLETED') return a.status === 'COMPLETED';
              if (tab === 'CANCELED') return a.status === 'CANCELED';
              return true;
            }).length;

            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                data-testid={`tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-bold transition flex-shrink-0 ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          data-testid="appointments-error-alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Failed to load appointments</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchAppointments}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div
          data-testid="appointments-loading-state"
          className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-medium">Retrieving therapy session records...</span>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State */
        <div
          data-testid="appointments-empty-state"
          className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 max-w-md mx-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Appointments In This View</h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'ALL'
                ? "You haven't scheduled any consultations yet. Find a verified therapist to begin."
                : `No appointments currently marked as ${activeTab.toLowerCase()}.`}
            </p>
          </div>
          <Link
            to="/therapists"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Find a Therapist</span>
          </Link>
        </div>
      ) : (
        /* Appointments List */
        <div data-testid="appointments-list-container" className="space-y-4">
          {filteredAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              userRole="HELP_SEEKER"
              onOpenReschedule={(target) => setSelectedForReschedule(target)}
              onOpenCancel={(target) => setSelectedForCancel(target)}
            />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedForReschedule && (
        <RescheduleModal
          isOpen={Boolean(selectedForReschedule)}
          onClose={() => setSelectedForReschedule(null)}
          appointment={selectedForReschedule}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Cancellation Modal */}
      {selectedForCancel && (
        <CancellationModal
          isOpen={Boolean(selectedForCancel)}
          onClose={() => setSelectedForCancel(null)}
          appointment={selectedForCancel}
          userRole="HELP_SEEKER"
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
};
