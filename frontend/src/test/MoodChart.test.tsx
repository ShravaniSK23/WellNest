import './setup';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { MoodChart } from '../components/dashboard/MoodChart';

describe('MoodChart Component', () => {
  it('renders empty state when moodHistory is empty with link to log mood', () => {
    render(
      <MemoryRouter>
        <MoodChart moodHistory={[]} rangeDays={30} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mood-chart-empty')).toBeInTheDocument();
    expect(screen.getByText(/No Mood Logs in Selected Period/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log Today's Mood/i })).toHaveAttribute(
      'href',
      '/moods'
    );
  });

  it('renders timeline with date items and shows active detail on item selection', () => {
    const mockHistory = [
      { id: 'm-1', date: '2026-10-09', moodEmoji: '😊', note: 'Productive and peaceful study session' },
      { id: 'm-2', date: '2026-10-10', moodEmoji: '😀', note: null },
    ];

    render(<MoodChart moodHistory={mockHistory} rangeDays={7} />);

    expect(screen.getByTestId('mood-chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('mood-chart-item-2026-10-09')).toBeInTheDocument();
    expect(screen.getByTestId('mood-chart-item-2026-10-10')).toBeInTheDocument();

    // Click item 1 to inspect details
    const item1 = screen.getByTestId('mood-chart-item-2026-10-09');
    fireEvent.click(item1);

    expect(screen.getByTestId('mood-chart-active-detail')).toBeInTheDocument();
    expect(screen.getByText(/Productive and peaceful study session/i)).toBeInTheDocument();
  });
});
