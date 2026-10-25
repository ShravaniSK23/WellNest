import {
  MOOD_MUSIC_RECOMMENDATIONS,
  DEFAULT_MUSIC_RECOMMENDATION,
} from '../config/moodMusic.js';

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
  private playlistMap: Record<string, MusicRecommendation> = MOOD_MUSIC_RECOMMENDATIONS;

  public async getRecommendationForMood(moodEmoji: string): Promise<MusicRecommendation> {
    return (
      this.playlistMap[moodEmoji] || {
        ...DEFAULT_MUSIC_RECOMMENDATION,
        moodEmoji,
      }
    );
  }
}

export const musicRecommendationService: IMusicRecommendationService = new MockMusicRecommendationService();
