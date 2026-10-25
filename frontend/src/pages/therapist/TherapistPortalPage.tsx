import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment, AppointmentRequestItem, CancelResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import { AppointmentCard } from '../../components/appointment/AppointmentCard';
import { CancellationModal } from '../../components/appointment/CancellationModal';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const TherapistPortalPage: React.FC = () => {
  const [requests, setRequests] = useState<AppointmentRequestItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Cancellation modal
  const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);

  const fetchTherapistData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqs, apts] = await Promise.all([
        appointmentApi.getIncomingRequests(),
        appointmentApi.getAppointments('THERAPIST'),
      ]);
      setRequests(reqs.filter((r) => r.status === 'PENDING'));
      setAppointments(apts);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTherapistData();
  }, [fetchTherapistData]);

  // Handle Accept (Confirm Appointment -> Captures Payment, BR-5)
  const handleAcceptRequest = async (reqItem: AppointmentRequestItem) => {
    try {
      setError(null);
      await appointmentApi.confirmAppointment(reqItem.appointmentId);
      setActionFeedback(`Confirmed session with ${reqItem.helpSeekerName}. Payment authorization captured.`);

      // Refresh
      fetchTherapistData();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  // Handle Decline (Decline Request -> Releases Slot & Payment Hold)
  const handleDeclineRequest = async (reqItem: AppointmentRequestItem) => {
    try {
      setError(null);
      await appointmentApi.declineAppointment(reqItem.appointmentId);
      setActionFeedback(`Declined request from ${reqItem.helpSeekerName}. Slot and hold released.`);

      // Refresh
      fetchTherapistData();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const handleCancelSuccess = (_res: CancelResponse) => {
    setActionFeedback('Session canceled. Client has been issued a 100% full refund per BR-6.');
    fetchTherapistData();
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CONFIRMED') return apt.status === 'CONFIRMED';
    if (activeTab === 'PENDING') return apt.status === 'PENDING_CONFIRMATION';
    if (activeTab === 'COMPLETED') return apt.status === 'COMPLETED';
    if (activeTab === 'CANCELED') return apt.status === 'CANCELED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Crisis Banner */}
      <CrisisResourceBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Therapist Clinical Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review incoming patient booking requests and conduct video consultations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/therapist/availability"
            data-testid="manage-availability-link"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition"
          >
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Manage 14-Day Availability</span>
          </Link>
          <button
            type="button"
            onClick={fetchTherapistData}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh portal"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          data-testid="action-feedback-banner"
          className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-teal-600 hover:text-teal-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          data-testid="therapist-portal-error"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Incoming Patient Booking Requests (REQ-TS-7, REQ-TS-8) */}
      <div
        data-testid="incoming-requests-section"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Incoming Appointment Requests</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and accept patient slot reservations within 24 hours (REQ-TS-8)
            </p>
          </div>
          <span
            data-testid="pending-requests-count-badge"
            className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
          >
            {requests.length} Pending
          </span>
        </div>

        {requests.length === 0 ? (
          <div
            data-testid="no-incoming-requests-notice"
            className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500"
          >
            No incoming patient booking requests pending approval.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const startDate = new Date(req.startTime);
              const formattedDate = startDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = startDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Time until 24-hour expiration
              const expiresMs = new Date(req.expiresAt).getTime();
              const nowMs = Date.now();
              const hoursLeft = Math.max(0, (expiresMs - nowMs) / (1000 * 60 * 60));

              return (
                <div
                  key={req.id}
                  data-testid={`incoming-request-card-${req.id}`}
                  className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        {req.helpSeekerName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{req.helpSeekerName}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formattedTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-amber-100 italic">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-800 font-semibold">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>
                        Expires in ~{hoursLeft.toFixed(1)}h (Payment Hold: AUTHORIZED)
                      </span>
                    </div>
                  </div>

                  {/* Accept / Decline Action CTAs */}
                  <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                    <button
                      type="button"
                      data-testid={`accept-request-btn-${req.id}`}
                      onClick={() => handleAcceptRequest(req)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept &amp; Capture</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`decline-request-btn-${req.id}`}
                      onClick={() => handleDeclineRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Therapist Scheduled Appointments */}
      <div
        data-testid="therapist-appointments-section"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Practice Consultation Schedule</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active sessions, video links, and client consultations
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            {(['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                data-testid={`therapist-tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === tab
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            No consultations found under the "{activeTab}" filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                userRole="THERAPIST"
                onOpenCancel={(target) => setSelectedForCancel(target)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Therapist Cancellation Modal (BR-6 Full Refund Notice) */}
      {selectedForCancel && (
        <CancellationModal
          isOpen={Boolean(selectedForCancel)}
          onClose={() => setSelectedForCancel(null)}
          appointment={selectedForCancel}
          userRole="THERAPIST"
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
};
