import type { MusicRecommendation } from '../types/mood.types';

export interface MoodMusicConfig {
  moodEmoji: string;
  playlistName: string;
  genre: string;
  youtubeUrl: string;
}

/**
 * Central repository for all mood-aligned music recommendations.
 * Each mood maps to a verified, working YouTube video URL matching the emotional state.
 * Easy to update or expand in one central location without altering UI components.
 */
export const MOOD_MUSIC_CONFIG: Record<string, MoodMusicConfig> = {
  // Great / Joyful
  '😀': {
    moodEmoji: '😀',
    playlistName: 'Upbeat Joy',
    genre: 'Acoustic Pop',
    youtubeUrl: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs', // Pharrell Williams - Happy
  },

  // Happy / Content
  '😊': {
    moodEmoji: '😊',
    playlistName: 'Calm & Peaceful',
    genre: 'Ambient Chill',
    youtubeUrl: 'https://www.youtube.com/watch?v=V1bFr2SWP1I', // Israel Kamakawiwoʻole - Somewhere Over the Rainbow
  },

  // Neutral / Okay
  '😐': {
    moodEmoji: '😐',
    playlistName: 'Focus & Balance',
    genre: 'Lo-Fi Beats',
    youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl - Beats to Relax/Study to
  },

  // Down / Pensive
  '😔': {
    moodEmoji: '😔',
    playlistName: 'Gentle Comfort',
    genre: 'Piano & Strings',
    youtubeUrl: 'https://www.youtube.com/watch?v=7maJOI3QMu0', // Yiruma - River Flows in You
  },

  // Sad / Low
  '😢': {
    moodEmoji: '😢',
    playlistName: 'Emotional Healing',
    genre: 'Soft Acoustic',
    youtubeUrl: 'https://www.youtube.com/watch?v=k4V3Mo61fJM', // Coldplay - Fix You
  },

  // Angry / Frustrated
  '😡': {
    moodEmoji: '😡',
    playlistName: 'De-Stress & Unwind',
    genre: 'Nature Sounds',
    youtubeUrl: 'https://www.youtube.com/watch?v=eKFTSSKCzWA', // Relaxing River Sounds
  },

  // Tired / Exhausted
  '😴': {
    moodEmoji: '😴',
    playlistName: 'Deep Sleep & Relaxation',
    genre: 'Meditation',
    youtubeUrl: 'https://www.youtube.com/watch?v=1ZYbU8csA68', // Deep Sleep Meditation Music
  },

  // Anxious / Stressed
  '😰': {
    moodEmoji: '😰',
    playlistName: 'Anxiety Relief',
    genre: 'Binaural Beats',
    youtubeUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU', // Marconi Union - Weightless
  },

  // Excited / Celebratory
  '🥳': {
    moodEmoji: '🥳',
    playlistName: 'Celebration Vibes',
    genre: 'Dance & Upbeat',
    youtubeUrl: 'https://www.youtube.com/watch?v=Gs069dndIYk', // Earth, Wind & Fire - September
  },

  // Peaceful / Relieved
  '😌': {
    moodEmoji: '😌',
    playlistName: 'Mindful Serenity',
    genre: 'Instrumental',
    youtubeUrl: 'https://www.youtube.com/watch?v=WNcsUNKlAKw', // Claude Debussy - Clair de Lune
  },
};

export const DEFAULT_MUSIC_CONFIG: MoodMusicConfig = {
  moodEmoji: '✨',
  playlistName: 'WellNest Peaceful Melodies',
  genre: 'Ambient',
  youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl - Peaceful Melodies
};

/**
 * Resolves a working YouTube video link for a mood recommendation.
 * Automatically replaces broken/placeholder legacy URLs with the central verified link.
 */
export function resolveMusicVideoUrl(moodEmoji?: string, candidateUrl?: string): string {
  // If candidate is a valid YouTube or external streaming URL (not the broken mock wellnest domain)
  if (
    candidateUrl &&
    !candidateUrl.includes('music.wellnest.org') &&
    (candidateUrl.startsWith('https://www.youtube.com') ||
      candidateUrl.startsWith('https://music.youtube.com') ||
      candidateUrl.startsWith('https://youtu.be'))
  ) {
    return candidateUrl;
  }

  if (moodEmoji && MOOD_MUSIC_CONFIG[moodEmoji]) {
    return MOOD_MUSIC_CONFIG[moodEmoji].youtubeUrl;
  }

  return DEFAULT_MUSIC_CONFIG.youtubeUrl;
}
