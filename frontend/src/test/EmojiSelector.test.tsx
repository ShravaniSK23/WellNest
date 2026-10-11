import './setup';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmojiSelector } from '../components/mood/EmojiSelector';
import { ALLOWED_MOOD_EMOJIS } from '../types/mood.types';

describe('EmojiSelector Component (Keyboard Accessible)', () => {
  it('renders all 10 allowed mood emojis with accessible radio roles', () => {
    const handleSelect = vi.fn();
    render(<EmojiSelector selectedEmoji={null} onSelect={handleSelect} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    ALLOWED_MOOD_EMOJIS.forEach((emoji) => {
      const btn = screen.getByTestId(`emoji-btn-${emoji}`);
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('role', 'radio');
      expect(btn).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('indicates selected emoji with aria-checked=true and active styling', () => {
    const handleSelect = vi.fn();
    render(<EmojiSelector selectedEmoji="😊" onSelect={handleSelect} />);

    const happyBtn = screen.getByTestId('emoji-btn-😊');
    expect(happyBtn).toHaveAttribute('aria-checked', 'true');

    const neutralBtn = screen.getByTestId('emoji-btn-😐');
    expect(neutralBtn).toHaveAttribute('aria-checked', 'false');

    expect(screen.getByText(/Selected: 😊/i)).toBeInTheDocument();
  });

  it('selects emoji on click and triggers onSelect callback', () => {
    const handleSelect = vi.fn();
    render(<EmojiSelector selectedEmoji={null} onSelect={handleSelect} />);

    const reliefBtn = screen.getByTestId('emoji-btn-😌');
    fireEvent.click(reliefBtn);

    expect(handleSelect).toHaveBeenCalledWith('😌');
  });

  it('supports keyboard arrow navigation and Enter/Space selection', () => {
    const handleSelect = vi.fn();
    render(<EmojiSelector selectedEmoji="😀" onSelect={handleSelect} />);

    const firstBtn = screen.getByTestId('emoji-btn-😀');
    firstBtn.focus();

    // Press ArrowRight to move to the next emoji (😊)
    fireEvent.keyDown(firstBtn, { key: 'ArrowRight' });
    expect(handleSelect).toHaveBeenCalledWith('😊');

    // Press Space on selected item
    fireEvent.keyDown(firstBtn, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledWith('😀');
  });
});
