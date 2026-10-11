import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeeklyReportModal } from '../components/dashboard/WeeklyReportModal';
import { dashboardApi } from '../api/dashboardApi';

vi.mock('../api/dashboardApi');

describe('WeeklyReportModal Component', () => {
  const mockReportRecord = {
    id: 'rep-1',
    helpSeekerId: 'hs-1',
    periodStart: '2026-10-04T00:00:00Z',
    periodEnd: '2026-10-11T00:00:00Z',
    summaryJson: {
      periodStart: '2026-10-04',
      periodEnd: '2026-10-11',
      frequentMood: '😊',
      variability: 'LOW',
      totalMoodsLogged: 6,
      journalingFrequency: 3,
      disclaimer: 'Informational summary only. Not a clinical diagnosis.',
    },
    createdAt: '2026-10-11T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<WeeklyReportModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('weekly-report-modal-backdrop')).not.toBeInTheDocument();
  });

  it('fetches and displays weekly report metrics when opened', async () => {
    vi.mocked(dashboardApi.getWeeklyReport).mockResolvedValueOnce({
      report: mockReportRecord,
    });

    render(<WeeklyReportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(dashboardApi.getWeeklyReport).toHaveBeenCalled();
      expect(screen.getByText('2026-10-04 — 2026-10-11')).toBeInTheDocument();
      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/Informational summary only/i)).toBeInTheDocument();
    });
  });

  it('downloads PDF blob when clicking Download Official PDF button', async () => {
    vi.mocked(dashboardApi.getWeeklyReport).mockResolvedValueOnce({
      report: mockReportRecord,
    });

    const mockBlob = new Blob(['%PDF-1.4 mock pdf content'], { type: 'application/pdf' });
    vi.mocked(dashboardApi.downloadWeeklyReportPdf).mockResolvedValueOnce(mockBlob);

    // Mock createObjectURL & revokeObjectURL
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-pdf-url');
    window.URL.revokeObjectURL = vi.fn();

    render(<WeeklyReportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByTestId('download-pdf-btn');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(dashboardApi.downloadWeeklyReportPdf).toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(screen.getByText(/downloaded successfully/i)).toBeInTheDocument();
    });

    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(dashboardApi.getWeeklyReport).mockResolvedValueOnce({
      report: mockReportRecord,
    });
    const handleClose = vi.fn();

    render(<WeeklyReportModal isOpen={true} onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close weekly report modal/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Close weekly report modal/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});
