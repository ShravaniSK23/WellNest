import React from 'react';
import type { UpcomingAppointment } from '../../types/dashboard.types';
import { Calendar, Clock, Video, CheckCircle2 } from 'lucide-react';

interface UpcomingAppointmentsListProps {
  appointments: UpcomingAppointment[];
}

export const UpcomingAppointmentsList: React.FC<UpcomingAppointmentsListProps> = ({
  appointments,
}) => {
  return (
    <div
      data-testid="upcoming-appointments-section"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Upcoming Therapy Sessions</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed consultations with licensed practitioners
          </p>
        </div>
        <span
          data-testid="appointments-count-badge"
          className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
        >
          {appointments.length} Scheduled
        </span>
      </div>

      {appointments.length === 0 ? (
        <div
          data-testid="appointments-empty-state"
          className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500"
        >
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No Upcoming Appointments</p>
          <p className="text-slate-500 mt-0.5">
            You currently have no scheduled therapy sessions. Book a consultation whenever you need guidance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const startDate = new Date(apt.startTime);
            const formattedDate = startDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = startDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={apt.appointmentId}
                data-testid={`appointment-item-${apt.appointmentId}`}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 mt-0.5">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{apt.therapistName}</h4>
                    {apt.qualifications && (
                      <p className="text-xs text-slate-500">{apt.qualifications}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 font-medium">
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

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{apt.status}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
