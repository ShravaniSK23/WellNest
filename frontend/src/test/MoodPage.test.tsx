import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoodPage } from '../pages/mood/MoodPage';
import { moodApi } from '../api/moodApi';

vi.mock('../api/moodApi');

describe('MoodPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then displays fresh mood tracker', async () => {
    vi.mocked(moodApi.getTodayMood).mockResolvedValueOnce({
      moodEntry: null,
      streak: { currentStreak: 3, longestStreak: 7, lastLoggedDate: '2026-10-10' },
      quote: {
        quote: 'Peace comes from within. Do not seek it without.',
        author: 'Buddha',
      },
    });

    render(<MoodPage />);

    // Check loading indicator appears
    expect(screen.getByTestId('mood-loading-state')).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByTestId('current-streak-value')).toHaveTextContent('3');
      expect(screen.getByTestId('longest-streak-value')).toHaveTextContent('7');
      expect(screen.getByTestId('daily-quote-text')).toHaveTextContent('Peace comes from within');
    });

    // Crisis banner is rendered
    expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();
    // Same-day edit banner should not appear yet
    expect(screen.queryByTestId('same-day-edit-banner')).not.toBeInTheDocument();
  });

  it('logs a new mood entry and renders music recommendation', async () => {
    vi.mocked(moodApi.getTodayMood).mockResolvedValueOnce({
      moodEntry: null,
      streak: { currentStreak: 0, longestStreak: 0, lastLoggedDate: null },
      quote: { quote: 'Every day is a fresh beginning.', author: 'Anonymous' },
    });

    vi.mocked(moodApi.recordMood).mockResolvedValueOnce({
      moodEntry: {
        id: 'm-1',
        localDate: new Date().toISOString().split('T')[0],
        moodEmoji: '😀',
        note: 'Feeling fantastic and energetic!',
      },
      streak: { currentStreak: 1, longestStreak: 1, lastLoggedDate: new Date().toISOString() },
      musicRecommendation: {
        moodEmoji: '😀',
        playlistName: 'Upbeat Joy',
        genre: 'Acoustic Pop',
        playlistUrl: 'https://music.wellnest.org/playlists/upbeat-joy',
      },
      quote: { quote: 'Every day is a fresh beginning.', author: 'Anonymous' },
      isEdit: false,
    });

    render(<MoodPage />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-mood-btn')).toBeInTheDocument();
    });

    // Select emoji 😀
    const joyBtn = screen.getByTestId('emoji-btn-😀');
    fireEvent.click(joyBtn);

    // Enter note
    const noteArea = screen.getByTestId('mood-note-textarea');
    fireEvent.change(noteArea, { target: { value: 'Feeling fantastic and energetic!' } });

    // Click submit
    const submitBtn = screen.getByTestId('submit-mood-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moodApi.recordMood).toHaveBeenCalledWith(
        expect.objectContaining({
          moodEmoji: '😀',
          note: 'Feeling fantastic and energetic!',
        })
      );
      // Music recommendation appears
      expect(screen.getByTestId('music-recommendation-card')).toBeInTheDocument();
      expect(screen.getByTestId('music-playlist-name')).toHaveTextContent('Upbeat Joy');
      expect(screen.getByTestId('music-genre')).toHaveTextContent('Acoustic Pop');
      // Success alert appears
      expect(screen.getByTestId('mood-success-alert')).toBeInTheDocument();
    });
  });

  it('handles same-day edit when user already logged today', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    vi.mocked(moodApi.getTodayMood).mockResolvedValueOnce({
      moodEntry: {
        id: 'm-existing',
        localDate: todayStr,
        moodEmoji: '😊',
        note: 'Morning coffee reflection',
      },
      streak: { currentStreak: 4, longestStreak: 8, lastLoggedDate: todayStr },
      quote: { quote: 'Be present.', author: 'Eckhart Tolle' },
    });

    vi.mocked(moodApi.recordMood).mockResolvedValueOnce({
      moodEntry: {
        id: 'm-existing',
        localDate: todayStr,
        moodEmoji: '😌',
        note: 'Updated evening reflection - feeling relaxed',
      },
      streak: { currentStreak: 4, longestStreak: 8 },
      musicRecommendation: {
        moodEmoji: '😌',
        playlistName: 'Mindful Serenity',
        genre: 'Instrumental',
        playlistUrl: 'https://music.wellnest.org/playlists/mindful-serenity',
      },
      quote: { quote: 'Be present.', author: 'Eckhart Tolle' },
      isEdit: true,
    });

    render(<MoodPage />);

    await waitFor(() => {
      expect(screen.getByTestId('same-day-edit-banner')).toBeInTheDocument();
      expect(screen.getByTestId('submit-mood-btn')).toHaveTextContent("Update Today's Mood");
    });

    // Change emoji to 😌
    fireEvent.click(screen.getByTestId('emoji-btn-😌'));
    // Update note
    fireEvent.change(screen.getByTestId('mood-note-textarea'), {
      target: { value: 'Updated evening reflection - feeling relaxed' },
    });

    fireEvent.click(screen.getByTestId('submit-mood-btn'));

    await waitFor(() => {
      expect(moodApi.recordMood).toHaveBeenCalledWith(
        expect.objectContaining({
          moodEmoji: '😌',
          note: 'Updated evening reflection - feeling relaxed',
        })
      );
      expect(screen.getByTestId('mood-success-alert')).toHaveTextContent('successfully updated');
    });
  });

  it('displays error alert if API call fails', async () => {
    vi.mocked(moodApi.getTodayMood).mockRejectedValueOnce(
      new Error('Failed to retrieve daily mood')
    );

    render(<MoodPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mood-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to retrieve daily mood')).toBeInTheDocument();
    });
  });
});
