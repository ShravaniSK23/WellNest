import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { dashboardApi } from '../api/dashboardApi';

vi.mock('../api/dashboardApi');

describe('DashboardPage Component', () => {
  const mockSummary30 = {
    rangeDays: 30,
    moodHistory: [
      { id: 'm-1', date: '2026-10-01', moodEmoji: '😊', note: 'Calm morning walk' },
      { id: 'm-2', date: '2026-10-02', moodEmoji: '😀', note: 'Project launch celebration' },
      { id: 'm-3', date: '2026-10-03', moodEmoji: '😊', note: null },
    ],
    analytics: {
      frequentMood: '😊',
      variability: 'LOW' as const,
      journalingFrequency: 5,
      disclaimer: 'Informational summary only. Not a clinical diagnosis.',
    },
    upcomingAppointments: [
      {
        appointmentId: 'apt-1',
        therapistName: 'Dr. Sarah Jenkins',
        qualifications: 'Ph.D. Clinical Psychology',
        startTime: '2026-10-15T10:00:00Z',
        endTime: '2026-10-15T11:00:00Z',
        status: 'CONFIRMED',
      },
    ],
    recommendedTherapists: [
      {
        id: 't-1',
        fullName: 'Dr. Marcus Vance',
        biography: 'Specializes in stress management and cognitive behavioral therapies.',
        qualifications: 'Licensed Clinical Psychologist',
        yearsOfExperience: 12,
        consultationFee: 85.0,
        averageRating: 4.9,
      },
      {
        id: 't-2',
        fullName: 'Elena Rostova, LMFT',
        biography: 'Family and mindfulness emotional coaching.',
        qualifications: 'Licensed Marriage & Family Therapist',
        yearsOfExperience: 8,
        consultationFee: 75.0,
        averageRating: 4.8,
      },
    ],
    showNeedSomeoneToTalkPrompt: false,
  };

  const mockSummary7WithPrompt = {
    ...mockSummary30,
    rangeDays: 7,
    upcomingAppointments: [],
    showNeedSomeoneToTalkPrompt: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches 30-day summary on initial mount and displays analytics and appointments', async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValueOnce(mockSummary30);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Initial loading state
    expect(screen.getByTestId('dashboard-loading-state')).toBeInTheDocument();

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledWith(30);
      // Crisis banner
      expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();
      // Analytics values directly from backend
      expect(screen.getByTestId('analytics-frequent-mood-value')).toHaveTextContent('😊');
      expect(screen.getByTestId('analytics-variability-value')).toHaveTextContent('LOW');
      expect(screen.getByTestId('analytics-journaling-frequency-value')).toHaveTextContent('5');
      expect(screen.getByTestId('analytics-disclaimer-notice')).toHaveTextContent(
        'Informational summary only. Not a clinical diagnosis.'
      );
    });

    // Upcoming appointment rendered
    expect(screen.getByTestId('appointment-item-apt-1')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Jenkins')).toBeInTheDocument();

    // Recommended therapists rendered
    expect(screen.getByTestId('recommended-therapist-card-t-1')).toBeInTheDocument();
    expect(screen.getByText('Dr. Marcus Vance')).toBeInTheDocument();

    // 'Need someone to talk to?' banner is NOT shown when showNeedSomeoneToTalkPrompt is false
    expect(screen.queryByTestId('need-someone-to-talk-banner')).not.toBeInTheDocument();
  });

  it('switches range to 7 days and displays Need someone to talk to? banner when condition is met', async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValueOnce(mockSummary30);
    vi.mocked(dashboardApi.getSummary).mockResolvedValueOnce(mockSummary7WithPrompt);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('range-btn-7')).toBeInTheDocument();
    });

    // Click 7-day range button
    const sevenDayBtn = screen.getByTestId('range-btn-7');
    fireEvent.click(sevenDayBtn);

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledWith(7);
      // 'Need someone to talk to?' banner IS displayed
      expect(screen.getByTestId('need-someone-to-talk-banner')).toBeInTheDocument();
      expect(screen.getByText('Need someone to talk to?')).toBeInTheDocument();
    });
  });

  it('opens weekly report modal when clicking Weekly Report button', async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValueOnce(mockSummary30);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-weekly-report-btn')).toBeInTheDocument();
    });

    const reportBtn = screen.getByTestId('open-weekly-report-btn');
    fireEvent.click(reportBtn);

    expect(screen.getByTestId('weekly-report-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByText('Weekly Wellness Report')).toBeInTheDocument();
  });

  it('displays error alert on API failure with retry action', async () => {
    vi.mocked(dashboardApi.getSummary).mockRejectedValueOnce(
      new Error('Network error loading dashboard')
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Network error loading dashboard')).toBeInTheDocument();
    });
  });
});
