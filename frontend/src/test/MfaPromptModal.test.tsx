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

  it('renders MFA setup with QR code and manual key when enrollment is required for role', async () => {
    const authApiModule = await import('../api/authApi');
    vi.spyOn(authApiModule.authApi, 'setupMfa').mockResolvedValueOnce({
      secret: 'SECRETKEY123456',
      qrCodeUrl: 'data:image/png;base64,mockqrcode',
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: {
        isPending: true,
        mfaPendingToken: 'mock-jwt-token',
        userId: 'u-therapist-1',
        sessionId: 's-therapist-1',
        role: 'THERAPIST',
        isEnrollmentRequired: true,
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
    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qrcode-image')).toBeInTheDocument();
      expect(screen.getByText('SECRETKEY123456')).toBeInTheDocument();
      expect(screen.getByTestId('copy-mfa-secret-btn')).toBeInTheDocument();
    });

    // Enter 6 digit code and submit
    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '654321' } });

    const submitBtn = screen.getByTestId('submit-mfa-code-btn');
    expect(submitBtn).toHaveTextContent('Verify & Complete Setup');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockVerifyMfa).toHaveBeenCalledWith('654321');
    });
  });
});
