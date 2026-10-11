import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Clock, LogIn } from 'lucide-react';

export const SessionExpiryModal: React.FC = () => {
  const { sessionExpired, sessionExpiryReason, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!sessionExpired) return null;

  const handleLoginRedirect = () => {
    dismissSessionExpired();
    navigate('/login', { state: { from: location } });
  };

  return (
    <div
      data-testid="session-expiry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div
        data-testid="session-expiry-modal-content"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-center"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </div>

        <h2 id="session-expired-title" className="text-xl font-bold text-slate-900 mb-2">
          Session Expired
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {sessionExpiryReason ||
            'For your safety and privacy, your WellNest session has automatically expired after 30 minutes of inactivity.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            data-testid="session-login-btn"
            onClick={handleLoginRedirect}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
