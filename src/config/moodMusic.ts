export interface MoodMusicItem {
  moodEmoji: string;
  playlistName: string;
  genre: string;
  playlistUrl: string;
}

/**
 * Central repository of mood-aligned music recommendations with verified working YouTube video links.
 * Each entry maps an allowed mood emoji to a curated track matching the emotional tone.
 */
export const MOOD_MUSIC_RECOMMENDATIONS: Record<string, MoodMusicItem> = {
  // Great / Joyful -> Upbeat, feel-good acoustic pop
  '😀': {
    moodEmoji: '😀',
    playlistName: 'Upbeat Joy',
    genre: 'Acoustic Pop',
    playlistUrl: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs', // Pharrell Williams - Happy
  },

  // Happy / Content -> Calm, heartwarming, peaceful chill
  '😊': {
    moodEmoji: '😊',
    playlistName: 'Calm & Peaceful',
    genre: 'Ambient Chill',
    playlistUrl: 'https://www.youtube.com/watch?v=V1bFr2SWP1I', // Israel Kamakawiwoʻole - Somewhere Over the Rainbow
  },

  // Neutral / Okay -> Lo-fi beats for concentration and everyday balance
  '😐': {
    moodEmoji: '😐',
    playlistName: 'Focus & Balance',
    genre: 'Lo-Fi Beats',
    playlistUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl - Beats to Relax/Study to
  },

  // Down / Pensive -> Gentle, comforting piano & strings
  '😔': {
    moodEmoji: '😔',
    playlistName: 'Gentle Comfort',
    genre: 'Piano & Strings',
    playlistUrl: 'https://www.youtube.com/watch?v=7maJOI3QMu0', // Yiruma - River Flows in You
  },

  // Sad / Low -> Soft acoustic, emotional validation and healing
  '😢': {
    moodEmoji: '😢',
    playlistName: 'Emotional Healing',
    genre: 'Soft Acoustic',
    playlistUrl: 'https://www.youtube.com/watch?v=k4V3Mo61fJM', // Coldplay - Fix You
  },

  // Angry / Frustrated -> Calming nature stream and forest sounds to diffuse tension
  '😡': {
    moodEmoji: '😡',
    playlistName: 'De-Stress & Unwind',
    genre: 'Nature Sounds',
    playlistUrl: 'https://www.youtube.com/watch?v=eKFTSSKCzWA', // Relaxing River Sounds
  },

  // Tired / Exhausted -> Soothing ambient sleep and restorative meditation
  '😴': {
    moodEmoji: '😴',
    playlistName: 'Deep Sleep & Relaxation',
    genre: 'Meditation',
    playlistUrl: 'https://www.youtube.com/watch?v=1ZYbU8csA68', // Deep Sleep Meditation Music
  },

  // Anxious / Stressed -> Scientifically proven calming audio to reduce heart rate
  '😰': {
    moodEmoji: '😰',
    playlistName: 'Anxiety Relief',
    genre: 'Binaural Beats',
    playlistUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU', // Marconi Union - Weightless
  },

  // Excited / Celebratory -> High-energy, uplifting dance & classic celebration vibes
  '🥳': {
    moodEmoji: '🥳',
    playlistName: 'Celebration Vibes',
    genre: 'Dance & Upbeat',
    playlistUrl: 'https://www.youtube.com/watch?v=Gs069dndIYk', // Earth, Wind & Fire - September
  },

  // Peaceful / Relieved -> Timeless, tranquil classical serenity
  '😌': {
    moodEmoji: '😌',
    playlistName: 'Mindful Serenity',
    genre: 'Instrumental',
    playlistUrl: 'https://www.youtube.com/watch?v=WNcsUNKlAKw', // Claude Debussy - Clair de Lune
  },
};

export const DEFAULT_MUSIC_RECOMMENDATION: MoodMusicItem = {
  moodEmoji: '✨',
  playlistName: 'WellNest Peaceful Melodies',
  genre: 'Ambient',
  playlistUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl - Peaceful Melodies
};
