import React, { useState } from 'react';
import { Phone, HeartHandshake, X, ExternalLink, ShieldAlert, LifeBuoy } from 'lucide-react';

interface CrisisResourceBannerProps {
  className?: string;
  compact?: boolean;
}

export const CrisisResourceBanner: React.FC<CrisisResourceBannerProps> = ({
  className = '',
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        data-testid="crisis-resource-banner"
        className={`bg-rose-50 border border-rose-200 text-rose-900 rounded-lg transition-all ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
        } ${className}`}
        role="region"
        aria-label="Crisis Helplines and Safety Resources"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="p-1 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
              <Phone className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </span>
            <span>
              <strong>Need immediate support?</strong> Call or text{' '}
              <a
                href="tel:988"
                className="underline font-bold hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 rounded"
              >
                988
              </a>{' '}
              (Suicide & Crisis Lifeline) or text{' '}
              <a
                href="sms:741741&body=HOME"
                className="underline font-bold hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 rounded"
              >
                HOME to 741741
              </a>
              .
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden md:inline text-rose-700 italic">
              Non-emergency substitute &bull; 24/7 free & confidential
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              data-testid="open-crisis-modal-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-rose-700 bg-white border border-rose-300 rounded-md shadow-sm hover:bg-rose-100 hover:border-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-rose-600" />
              <span>All Crisis Resources</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Crisis Helpline Modal */}
      {isModalOpen && (
        <div
          data-testid="crisis-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            data-testid="crisis-modal-content"
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crisis-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close crisis resources dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emergency Alert Header */}
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 id="crisis-modal-title" className="text-xl font-bold text-slate-900">
                  Immediate Crisis Support Resources
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  WellNest is a support platform, not a medical or emergency service. If you or someone you know is in
                  immediate physical danger, call <strong>911</strong> (US/Canada), <strong>112</strong> (Europe/India),
                  or visit the nearest emergency room.
                </p>
              </div>
            </div>

            {/* Helplines Directory */}
            <div className="space-y-4">
              {/* 988 Lifeline */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-brand-600" /> 988 Suicide & Crisis Lifeline (US & Canada)
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Free, confidential 24/7 mental health crisis support by call or text.
                    </p>
                  </div>
                  <a
                    href="tel:988"
                    className="px-4 py-2 bg-brand-600 text-white font-medium text-sm rounded-lg hover:bg-brand-700 transition"
                  >
                    Call 988
                  </a>
                </div>
              </div>

              {/* Crisis Text Line */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-brand-600" /> Crisis Text Line
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Text with a trained crisis counselor 24/7. Text <strong>HOME</strong> to <strong>741741</strong>.
                    </p>
                  </div>
                  <a
                    href="sms:741741&body=HOME"
                    className="px-4 py-2 bg-slate-800 text-white font-medium text-sm rounded-lg hover:bg-slate-900 transition"
                  >
                    Text 741741
                  </a>
                </div>
              </div>

              {/* Specialized Services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h4 className="text-sm font-semibold text-slate-900">The Trevor Project (LGBTQ+)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">24/7 suicide prevention for LGBTQ young people.</p>
                  <a
                    href="tel:18664887386"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 mt-2 hover:underline"
                  >
                    1-866-488-7386 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h4 className="text-sm font-semibold text-slate-900">Veterans Crisis Line</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Dial 988, then press 1, or text 838255.</p>
                  <a
                    href="tel:988"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 mt-2 hover:underline"
                  >
                    Dial 988 (Press 1) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h4 className="text-sm font-semibold text-slate-900">India Helplines (Vandrevala / iCall)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Mental health counselors available 24/7 across India.</p>
                  <a
                    href="tel:+919999666555"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 mt-2 hover:underline"
                  >
                    +91 9999 666 555 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h4 className="text-sm font-semibold text-slate-900">International Directory</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Worldwide directory via Befrienders Worldwide.</p>
                  <a
                    href="https://www.befrienders.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 mt-2 hover:underline"
                  >
                    befrienders.org <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Non-diagnostic notice per SF-3 */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Non-Diagnostic Disclaimer:</strong> WellNest insights, trackers, and forums are informational tools
              only and do not constitute clinical or medical diagnosis. Please consult a licensed professional for
              medical concerns.
            </div>

            {/* Dismiss action */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Close Resources
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
