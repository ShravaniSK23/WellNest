export interface MusicRecommendation {
  moodEmoji: string;
  playlistName: string;
  genre: string;
  playlistUrl: string;
}

export interface IMusicRecommendationService {
  getRecommendationForMood(moodEmoji: string): Promise<MusicRecommendation>;
}

export class MockMusicRecommendationService implements IMusicRecommendationService {
  private playlistMap: Record<string, MusicRecommendation> = {
    '😀': { moodEmoji: '😀', playlistName: 'Upbeat Joy', genre: 'Acoustic Pop', playlistUrl: 'https://music.wellnest.org/playlists/upbeat-joy' },
    '😊': { moodEmoji: '😊', playlistName: 'Calm & Peaceful', genre: 'Ambient Chill', playlistUrl: 'https://music.wellnest.org/playlists/calm-peaceful' },
    '😐': { moodEmoji: '😐', playlistName: 'Focus & Balance', genre: 'Lo-Fi Beats', playlistUrl: 'https://music.wellnest.org/playlists/focus-balance' },
    '😔': { moodEmoji: '😔', playlistName: 'Gentle Comfort', genre: 'Piano & Strings', playlistUrl: 'https://music.wellnest.org/playlists/gentle-comfort' },
    '😢': { moodEmoji: '😢', playlistName: 'Emotional Healing', genre: 'Soft Acoustic', playlistUrl: 'https://music.wellnest.org/playlists/emotional-healing' },
    '😡': { moodEmoji: '😡', playlistName: 'De-Stress & Unwind', genre: 'Nature Sounds', playlistUrl: 'https://music.wellnest.org/playlists/destress-unwind' },
    '😴': { moodEmoji: '😴', playlistName: 'Deep Sleep & Relaxation', genre: 'Meditation', playlistUrl: 'https://music.wellnest.org/playlists/deep-sleep' },
    '😰': { moodEmoji: '😰', playlistName: 'Anxiety Relief', genre: 'Binaural Beats', playlistUrl: 'https://music.wellnest.org/playlists/anxiety-relief' },
    '🥳': { moodEmoji: '🥳', playlistName: 'Celebration Vibes', genre: 'Dance & Upbeat', playlistUrl: 'https://music.wellnest.org/playlists/celebration' },
    '😌': { moodEmoji: '😌', playlistName: 'Mindful Serenity', genre: 'Instrumental', playlistUrl: 'https://music.wellnest.org/playlists/mindful-serenity' },
  };

  public async getRecommendationForMood(moodEmoji: string): Promise<MusicRecommendation> {
    return (
      this.playlistMap[moodEmoji] || {
        moodEmoji,
        playlistName: 'WellNest Peaceful Melodies',
        genre: 'Ambient',
        playlistUrl: 'https://music.wellnest.org/playlists/default',
      }
    );
  }
}

export const musicRecommendationService: IMusicRecommendationService = new MockMusicRecommendationService();
