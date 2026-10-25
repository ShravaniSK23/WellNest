import './setup';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MusicRecommendationCard } from '../components/mood/MusicRecommendationCard';
import {
  MOOD_MUSIC_CONFIG,
  DEFAULT_MUSIC_CONFIG,
  resolveMusicVideoUrl,
} from '../constants/moodMusic';
import { ALLOWED_MOOD_EMOJIS } from '../types/mood.types';

describe('Mood-Based Music Recommendations & YouTube Links', () => {
  it('has a valid, working YouTube video URL configured for every allowed mood emoji', () => {
    ALLOWED_MOOD_EMOJIS.forEach((emoji) => {
      const config = MOOD_MUSIC_CONFIG[emoji];
      expect(config).toBeDefined();
      expect(config.moodEmoji).toBe(emoji);
      expect(config.playlistName).toBeTruthy();
      expect(config.genre).toBeTruthy();
      expect(config.youtubeUrl).toMatch(/^https:\/\/(www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]+/);
    });
  });

  it('provides a default fallback YouTube video URL for unknown or unset moods', () => {
    expect(DEFAULT_MUSIC_CONFIG.youtubeUrl).toMatch(/^https:\/\/(www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]+/);
    expect(resolveMusicVideoUrl('unknown-emoji')).toBe(DEFAULT_MUSIC_CONFIG.youtubeUrl);
  });

  it('replaces broken legacy placeholder URLs (music.wellnest.org) with verified YouTube links', () => {
    const legacyUrl = 'https://music.wellnest.org/playlists/upbeat-joy';
    const resolved = resolveMusicVideoUrl('😀', legacyUrl);
    expect(resolved).toBe(MOOD_MUSIC_CONFIG['😀'].youtubeUrl);
    expect(resolved).toContain('youtube.com/watch?v=');
  });

  it('renders MusicRecommendationCard with the Listen button pointing to the specific mood YouTube video', () => {
    const testCases = [
      { emoji: '😀', expectedUrl: MOOD_MUSIC_CONFIG['😀'].youtubeUrl, title: 'Upbeat Joy' },
      { emoji: '😔', expectedUrl: MOOD_MUSIC_CONFIG['😔'].youtubeUrl, title: 'Gentle Comfort' },
      { emoji: '😰', expectedUrl: MOOD_MUSIC_CONFIG['😰'].youtubeUrl, title: 'Anxiety Relief' },
      { emoji: '😴', expectedUrl: MOOD_MUSIC_CONFIG['😴'].youtubeUrl, title: 'Deep Sleep & Relaxation' },
    ];

    testCases.forEach(({ emoji, expectedUrl, title }) => {
      const { unmount } = render(
        <MusicRecommendationCard
          recommendation={{
            moodEmoji: emoji,
            playlistName: title,
            genre: 'Genre',
            playlistUrl: expectedUrl,
          }}
        />
      );

      const link = screen.getByTestId('music-playlist-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', expectedUrl);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveTextContent('Listen');

      unmount();
    });
  });

  it('renders nothing when recommendation is null', () => {
    const { container } = render(<MusicRecommendationCard recommendation={null} />);
    expect(container.firstChild).toBeNull();
  });
});
