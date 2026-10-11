import React from 'react';
import { Music, Headphones, ExternalLink } from 'lucide-react';
import type { MusicRecommendation } from '../../types/mood.types';

interface MusicRecommendationCardProps {
  recommendation: MusicRecommendation | null;
  className?: string;
}

export const MusicRecommendationCard: React.FC<MusicRecommendationCardProps> = ({
  recommendation,
  className = '',
}) => {
  if (!recommendation) return null;

  return (
    <div
      data-testid="music-recommendation-card"
      className={`bg-gradient-to-br from-indigo-50/70 via-teal-50/50 to-white border border-indigo-100 rounded-2xl p-5 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs uppercase tracking-wider">
          <Headphones className="w-4 h-4 text-indigo-600" />
          <span>Mood-Aligned Audio Atmosphere</span>
        </div>
        <span className="text-xl" title={`Mood: ${recommendation.moodEmoji}`}>
          {recommendation.moodEmoji}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h4
            data-testid="music-playlist-name"
            className="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            <Music className="w-4 h-4 text-brand-600" />
            {recommendation.playlistName}
          </h4>
          <p
            data-testid="music-genre"
            className="text-xs text-slate-500 mt-0.5"
          >
            Genre: <span className="font-medium text-slate-700">{recommendation.genre}</span>
          </p>
        </div>

        <a
          href={recommendation.playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="music-playlist-link"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span>Listen</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
