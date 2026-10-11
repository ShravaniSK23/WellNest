import './setup';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MoodNoteInput } from '../components/mood/MoodNoteInput';

describe('MoodNoteInput Component', () => {
  it('renders textarea with 0 / 500 initial character count', () => {
    const handleChange = vi.fn();
    render(<MoodNoteInput note="" onChange={handleChange} />);

    expect(screen.getByTestId('mood-note-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('mood-note-counter')).toHaveTextContent('0 / 500');
  });

  it('updates live counter when user types', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<MoodNoteInput note="" onChange={handleChange} />);

    const textarea = screen.getByTestId('mood-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Feeling very calm and centered today.' } });

    expect(handleChange).toHaveBeenCalledWith('Feeling very calm and centered today.');

    rerender(<MoodNoteInput note="Feeling very calm and centered today." onChange={handleChange} />);
    expect(screen.getByTestId('mood-note-counter')).toHaveTextContent('37 / 500');
  });

  it('has maxLength of 500', () => {
    render(<MoodNoteInput note="" onChange={vi.fn()} />);
    const textarea = screen.getByTestId('mood-note-textarea');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });
});
