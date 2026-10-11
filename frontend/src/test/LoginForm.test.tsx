import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../pages/auth/LoginPage';
import * as AuthContextModule from '../context/AuthContext';

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();

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
      login: mockLogin,
      verifyMfa: vi.fn(),
      cancelMfa: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });
  });

  it('renders login form with email, password inputs and action links', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create account/i })).toBeInTheDocument();
  });

  it('submits credentials on form submit', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('login-submit-btn');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!',
      });
    });
  });

  it('displays user-friendly error alert when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('login-submit-btn');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('login-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
