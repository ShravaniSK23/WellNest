import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import { Smile, Calendar, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardShell: React.FC = () => {
  const { user } = useAuth();
  const name = user?.helpSeeker?.fullName || user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="space-y-6">
      {/* Persistent Crisis Banner (SF-1) */}
      <CrisisResourceBanner />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-brand-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-teal-700/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
            <Heart className="w-3.5 h-3.5" /> WellNest Emotional Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome, {name}
          </h1>
          <p className="text-teal-50 text-sm leading-relaxed">
            Take a deep breath. This is your safe haven to track how you feel, connect with support, and find peace of mind.
          </p>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/moods"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Smile className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Daily Mood Tracker</h3>
          <p className="text-xs text-slate-500 mt-1">Log today's emotional state with safety helpline integration.</p>
        </Link>

        <Link
          to="/community"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Anonymous Community</h3>
          <p className="text-xs text-slate-500 mt-1">Share feelings safely with pseudonymous peer discussions.</p>
        </Link>

        <Link
          to="/therapists"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Professional Therapy</h3>
          <p className="text-xs text-slate-500 mt-1">Discover licensed psychologists and confidential video appointments.</p>
        </Link>
      </div>

      {/* Informational Disclaimer (SF-3) */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
        <strong>Non-Diagnostic Notice (SF-3):</strong> WellNest provides supportive wellness reflections and non-clinical tracking. Insights and summaries do not constitute a medical diagnosis or psychotherapeutic prescription.
      </div>
    </div>
  );
};
