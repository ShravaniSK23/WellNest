import React, { useState, useEffect, useCallback } from 'react';
import { moodApi } from '../../api/moodApi';
import { formatApiError } from '../../api/apiClient';
import { EmojiSelector } from '../../components/mood/EmojiSelector';
import { MoodNoteInput } from '../../components/mood/MoodNoteInput';
import { StreakBadge } from '../../components/mood/StreakBadge';
import { QuoteCard } from '../../components/mood/QuoteCard';
import { MusicRecommendationCard } from '../../components/mood/MusicRecommendationCard';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import type {
  MoodEmoji,
  StreakInfo,
  DailyQuote,
  MusicRecommendation,
} from '../../types/mood.types';
import {
  Smile,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Edit3,
} from 'lucide-react';

export const MoodPage: React.FC = () => {
  // Today's ISO local date (YYYY-MM-DD)
  const todayLocalDate = new Date().toISOString().split('T')[0];

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [musicRecommendation, setMusicRecommendation] = useState<MusicRecommendation | null>(null);

  const [isAlreadyLoggedToday, setIsAlreadyLoggedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTodayData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await moodApi.getTodayMood(todayLocalDate);
      setStreak(data.streak);
      setQuote(data.quote);

      if (data.moodEntry) {
        setSelectedEmoji(data.moodEntry.moodEmoji);
        setNote(data.moodEntry.note || '');
        setIsAlreadyLoggedToday(true);
      } else {
        setIsAlreadyLoggedToday(false);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [todayLocalDate]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmoji) {
      setError('Please select an emoji representing your current mood.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await moodApi.recordMood({
        localDate: todayLocalDate,
        moodEmoji: selectedEmoji,
        note: note.trim() || undefined,
      });

      setStreak(result.streak);
      setQuote(result.quote);
      setMusicRecommendation(result.musicRecommendation);
      setIsAlreadyLoggedToday(true);

      const msg = result.isEdit
        ? "Today's mood entry has been successfully updated."
        : "Your mood for today has been recorded! Great job maintaining your streak.";
      setSuccessMessage(msg);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Persistent Crisis Resource Banner (SF-1 / SF-2) */}
      <CrisisResourceBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-100 text-brand-700">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Daily Mood Tracker
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Check in with your feelings today &bull;{' '}
                <span className="font-semibold text-slate-700">{todayLocalDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={loadTodayData}
          disabled={isLoading}
          aria-label="Refresh mood status"
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: Logging Form on Left, Streak/Quote/Music on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Mood Form */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div
              data-testid="mood-error-alert"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Unable to save mood</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div
              data-testid="mood-success-alert"
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-fade-in"
              role="status"
            >
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Success</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Same-day Edit Notification Banner */}
          {isAlreadyLoggedToday && !isLoading && (
            <div
              data-testid="same-day-edit-banner"
              className="p-3.5 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-brand-900 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>
                  <strong>Already recorded today!</strong> You can update your mood or note anytime.
                </span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                Same-Day Edit
              </span>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            {isLoading ? (
              <div
                data-testid="mood-loading-state"
                className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500"
              >
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <span className="text-sm font-medium">Loading your mood status...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="mood-form">
                {/* 1. Emoji Mood Selector */}
                <EmojiSelector
                  selectedEmoji={selectedEmoji}
                  onSelect={(emoji: MoodEmoji) => {
                    setSelectedEmoji(emoji);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                />

                {/* 2. 500-Character Note */}
                <MoodNoteInput
                  note={note}
                  onChange={(val) => {
                    setNote(val);
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                />

                {/* Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                    Encrypted and isolated to your profile
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedEmoji}
                    data-testid="submit-mood-btn"
                    className="w-full sm:w-auto px-7 py-3 font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isAlreadyLoggedToday ? (
                      <>
                        <Edit3 className="w-4 h-4" />
                        <span>Update Today's Mood</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Log Today's Mood</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Streak, Quote, and Music Recommendation */}
        <div className="space-y-6">
          {/* Consecutive Streak Badge */}
          <StreakBadge streak={streak} />

          {/* Music Recommendation Card */}
          {musicRecommendation && (
            <MusicRecommendationCard recommendation={musicRecommendation} />
          )}

          {/* Motivational Daily Quote Card */}
          <QuoteCard quote={quote} />

          {/* Safety Disclaimer (SF-3) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
            <strong>Non-Diagnostic Notice (SF-3):</strong> WellNest daily mood reflections are supportive tools and do not constitute a medical or clinical diagnosis.
          </div>
        </div>
      </div>
    </div>
  );
};
