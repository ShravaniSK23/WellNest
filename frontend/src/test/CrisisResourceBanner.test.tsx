import './setup';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CrisisResourceBanner } from '../components/common/CrisisResourceBanner';

describe('CrisisResourceBanner Component', () => {
  it('renders the persistent 988 Lifeline and Crisis Text Line links', () => {
    render(<CrisisResourceBanner />);

    expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();
    expect(screen.getByText(/Need immediate support\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '988' })).toHaveAttribute('href', 'tel:988');
    expect(screen.getByRole('link', { name: 'HOME to 741741' })).toHaveAttribute(
      'href',
      'sms:741741&body=HOME'
    );
  });

  it('opens and closes the detailed crisis resources modal', () => {
    render(<CrisisResourceBanner />);

    // Initially modal is not open
    expect(screen.queryByTestId('crisis-modal-content')).not.toBeInTheDocument();

    // Click to open modal
    const openBtn = screen.getByTestId('open-crisis-modal-btn');
    fireEvent.click(openBtn);

    // Modal should now be visible
    expect(screen.getByTestId('crisis-modal-content')).toBeInTheDocument();
    expect(screen.getByText(/Immediate Crisis Support Resources/i)).toBeInTheDocument();
    expect(screen.getByText(/The Trevor Project/i)).toBeInTheDocument();
    expect(screen.getByText(/Veterans Crisis Line/i)).toBeInTheDocument();

    // Non-diagnostic disclaimer is displayed
    expect(screen.getByText(/Non-Diagnostic Disclaimer/i)).toBeInTheDocument();

    // Close modal via close button
    const closeBtn = screen.getByRole('button', { name: /Close crisis resources dialog/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('crisis-modal-content')).not.toBeInTheDocument();
  });
});
