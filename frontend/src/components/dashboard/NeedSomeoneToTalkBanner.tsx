import React from 'react';
import { HeartHandshake, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NeedSomeoneToTalkBannerProps {
  show: boolean;
  onBrowseTherapists?: () => void;
}

export const NeedSomeoneToTalkBanner: React.FC<NeedSomeoneToTalkBannerProps> = ({
  show,
  onBrowseTherapists,
}) => {
  if (!show) return null;

  return (
    <div
      data-testid="need-someone-to-talk-banner"
      className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-brand-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-brand-700/10"
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-white">
            <HeartHandshake className="w-3.5 h-3.5" /> Compassionate Professional Care
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Need someone to talk to?
          </h3>
          <p className="text-teal-50 text-xs sm:text-sm leading-relaxed">
            You don't have to carry your burdens alone. Connect with verified, licensed therapists for secure video consultations and personalized emotional guidance.
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3">
          {onBrowseTherapists ? (
            <button
              type="button"
              onClick={onBrowseTherapists}
              data-testid="talk-to-therapist-btn"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 font-bold text-xs sm:text-sm hover:bg-teal-50 shadow-md transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect with a Therapist</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/therapists"
              data-testid="talk-to-therapist-link"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 font-bold text-xs sm:text-sm hover:bg-teal-50 shadow-md transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect with a Therapist</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
