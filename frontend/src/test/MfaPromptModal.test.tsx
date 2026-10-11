import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MfaPromptModal } from '../components/auth/MfaPromptModal';
import * as AuthContextModule from '../context/AuthContext';

describe('MfaPromptModal Component', () => {
  const mockVerifyMfa = vi.fn();
  const mockCancelMfa = vi.fn();

  it('renders nothing when mfaPending is null or false', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: null,
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: mockVerifyMfa,
      cancelMfa: mockCancelMfa,
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });

    render(<MfaPromptModal />);
    expect(screen.queryByTestId('mfa-prompt-modal-backdrop')).not.toBeInTheDocument();
  });

  it('renders modal with 6-digit TOTP input when mfaPending is active', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: {
        isPending: true,
        mfaPendingToken: 'mock-jwt-token',
        userId: 'u-123',
        sessionId: 's-456',
        role: 'HELP_SEEKER',
      },
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: mockVerifyMfa,
      cancelMfa: mockCancelMfa,
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });

    render(<MfaPromptModal />);
    expect(screen.getByTestId('mfa-prompt-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
  });

  it('allows user to enter code, submits to verifyMfa, or cancel back to login', async () => {
    mockVerifyMfa.mockResolvedValueOnce(undefined);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: {
        isPending: true,
        mfaPendingToken: 'mock-jwt-token',
        userId: 'u-123',
        sessionId: 's-456',
        role: 'HELP_SEEKER',
      },
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: mockVerifyMfa,
      cancelMfa: mockCancelMfa,
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });

    render(<MfaPromptModal />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });

    const submitBtn = screen.getByTestId('submit-mfa-code-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockVerifyMfa).toHaveBeenCalledWith('123456');
    });

    // Test cancel button
    const cancelBtn = screen.getByTestId('cancel-mfa-btn');
    fireEvent.click(cancelBtn);
    expect(mockCancelMfa).toHaveBeenCalled();
  });
});
