import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoodPage } from '../pages/mood/MoodPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { moodApi } from '../api/moodApi';
import { dashboardApi } from '../api/dashboardApi';

vi.mock('../api/moodApi');
vi.mock('../api/dashboardApi');

describe('Mood Tracking & Wellness Dashboard E2E Integration Flow', () => {
  const todayStr = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes end-to-end user flow: log mood -> view recommendation -> explore dashboard analytics -> generate report', async () => {
    // 1. Mock Mood API endpoints
    vi.mocked(moodApi.getTodayMood).mockResolvedValueOnce({
      moodEntry: null,
      streak: { currentStreak: 4, longestStreak: 9, lastLoggedDate: '2026-10-10' },
      quote: { quote: 'Peace comes from within.', author: 'Buddha' },
    });

    vi.mocked(moodApi.recordMood).mockResolvedValueOnce({
      moodEntry: {
        id: 'm-e2e',
        localDate: todayStr,
        moodEmoji: '😊',
        note: 'Grateful for mindful progress today.',
      },
      streak: { currentStreak: 5, longestStreak: 9, lastLoggedDate: todayStr },
      musicRecommendation: {
        moodEmoji: '😊',
        playlistName: 'Calm & Peaceful',
        genre: 'Ambient Chill',
        playlistUrl: 'https://music.wellnest.org/playlists/calm-peaceful',
      },
      quote: { quote: 'Peace comes from within.', author: 'Buddha' },
      isEdit: false,
    });

    // 2. Mock Dashboard API endpoints
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      rangeDays: 30,
      moodHistory: [
        { id: 'm-e2e', date: todayStr, moodEmoji: '😊', note: 'Grateful for mindful progress today.' },
      ],
      analytics: {
        frequentMood: '😊',
        variability: 'LOW',
        journalingFrequency: 3,
        disclaimer: 'Informational summary only. Not a clinical diagnosis.',
      },
      upcomingAppointments: [],
      recommendedTherapists: [
        {
          id: 't-1',
          fullName: 'Dr. Sarah Jenkins',
          biography: 'Clinical psychologist specializing in cognitive behavioral therapy.',
          qualifications: 'Ph.D. Clinical Psychology',
          yearsOfExperience: 10,
          consultationFee: 90.0,
          averageRating: 4.9,
        },
      ],
      showNeedSomeoneToTalkPrompt: true,
    });

    vi.mocked(dashboardApi.getWeeklyReport).mockResolvedValueOnce({
      report: {
        id: 'rep-e2e',
        helpSeekerId: 'hs-1',
        periodStart: '2026-10-04T00:00:00Z',
        periodEnd: '2026-10-11T00:00:00Z',
        summaryJson: {
          periodStart: '2026-10-04',
          periodEnd: '2026-10-11',
          frequentMood: '😊',
          variability: 'LOW',
          totalMoodsLogged: 5,
          journalingFrequency: 3,
          disclaimer: 'Informational summary only. Not a clinical diagnosis.',
        },
        createdAt: '2026-10-11T10:00:00Z',
      },
    });

    // Render flow inside MemoryRouter starting at /moods
    const { unmount } = render(
      <MemoryRouter initialEntries={['/moods']}>
        <Routes>
          <Route path="/moods" element={<MoodPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Step A: In Mood Tracker, select 😊 and type reflection note
    await waitFor(() => {
      expect(screen.getByTestId('emoji-btn-😊')).toBeInTheDocument();
      expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('emoji-btn-😊'));
    fireEvent.change(screen.getByTestId('mood-note-textarea'), {
      target: { value: 'Grateful for mindful progress today.' },
    });
    fireEvent.click(screen.getByTestId('submit-mood-btn'));

    // Step B: Verify mood logged, music recommendation rendered, and success notice
    await waitFor(() => {
      expect(moodApi.recordMood).toHaveBeenCalled();
      expect(screen.getByTestId('music-recommendation-card')).toBeInTheDocument();
      expect(screen.getByTestId('music-playlist-name')).toHaveTextContent('Calm & Peaceful');
      expect(screen.getByTestId('current-streak-value')).toHaveTextContent('5');
    });

    unmount();

    // Step C: Switch to /dashboard to inspect analytics and features
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledWith(30);
      // Analytics from backend
      expect(screen.getByTestId('analytics-frequent-mood-value')).toHaveTextContent('😊');
      expect(screen.getByTestId('analytics-variability-value')).toHaveTextContent('LOW');
      expect(screen.getByTestId('analytics-journaling-frequency-value')).toHaveTextContent('3');
      // Mood chart rendered
      expect(screen.getByTestId(`mood-chart-item-${todayStr}`)).toBeInTheDocument();
      // 'Need someone to talk to?' banner rendered because no upcoming appointments
      expect(screen.getByTestId('need-someone-to-talk-banner')).toBeInTheDocument();
      // Recommended therapist
      expect(screen.getByTestId('recommended-therapist-card-t-1')).toBeInTheDocument();
    });

    // Step D: Open Weekly Report modal
    const openReportBtn = screen.getByTestId('open-weekly-report-btn');
    fireEvent.click(openReportBtn);

    await waitFor(() => {
      expect(dashboardApi.getWeeklyReport).toHaveBeenCalled();
      expect(screen.getByTestId('weekly-report-modal-content')).toBeInTheDocument();
      expect(screen.getByText('Weekly Wellness Report')).toBeInTheDocument();
    });
  });
});
