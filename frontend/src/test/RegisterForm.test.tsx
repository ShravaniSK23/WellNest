import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from '../pages/auth/RegisterPage';
import * as AuthContextModule from '../context/AuthContext';

describe('RegisterPage Component', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: null,
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: vi.fn(),
      cancelMfa: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });
  });

  it('renders standard registration inputs for Help Seeker role by default', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    // Therapist-specific license input should NOT be visible by default
    expect(screen.queryByLabelText(/Medical \/ Clinical License Number/i)).not.toBeInTheDocument();
  });

  it('reveals license number and credentials when Therapist role is selected', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const therapistTab = screen.getByRole('button', { name: 'Therapist' });
    fireEvent.click(therapistTab);

    expect(screen.getByLabelText(/Medical \/ Clinical License Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qualifications & Degrees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brief Professional Biography/i)).toBeInTheDocument();
  });

  it('validates password matching before submitting', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Mismatch999!' } });

    // Check safety consent
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('register-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('successfully submits valid registration data', async () => {
    mockRegister.mockResolvedValueOnce({
      message: 'Account registered successfully.',
      userId: 'u-1234',
      role: 'HELP_SEEKER',
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });

    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'HELP_SEEKER',
        })
      );
      expect(screen.getByTestId('register-success-alert')).toBeInTheDocument();
    });
  });
});
