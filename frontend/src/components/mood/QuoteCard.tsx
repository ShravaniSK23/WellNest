import React from 'react';
import { Quote } from 'lucide-react';
import type { DailyQuote } from '../../types/mood.types';

interface QuoteCardProps {
  quote: DailyQuote | null;
  className?: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, className = '' }) => {
  if (!quote) return null;

  return (
    <div
      data-testid="daily-quote-card"
      className={`relative overflow-hidden bg-white/90 border border-slate-200/80 rounded-2xl p-5 shadow-2xs backdrop-blur-xs ${className}`}
    >
      <div className="absolute -top-3 -right-3 text-brand-100 pointer-events-none select-none">
        <Quote className="w-20 h-20 opacity-30" />
      </div>

      <div className="relative z-10 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0 mt-0.5">
          <Quote className="w-4 h-4" />
        </div>
        <div>
          <p
            data-testid="daily-quote-text"
            className="text-sm font-medium text-slate-800 italic leading-relaxed"
          >
            &ldquo;{quote.quote}&rdquo;
          </p>
          <p
            data-testid="daily-quote-author"
            className="mt-2 text-xs font-semibold text-brand-700 tracking-wide"
          >
            &mdash; {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
};
