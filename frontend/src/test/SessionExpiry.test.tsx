import './setup';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SessionExpiryModal } from '../components/auth/SessionExpiryModal';
import * as AuthContextModule from '../context/AuthContext';

describe('SessionExpiryModal Component', () => {
  const mockDismiss = vi.fn();

  it('renders nothing when session is active', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: true,
      isLoading: false,
      mfaPending: null,
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: vi.fn(),
      cancelMfa: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: mockDismiss,
    });

    render(
      <MemoryRouter>
        <SessionExpiryModal />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('session-expiry-modal-backdrop')).not.toBeInTheDocument();
  });

  it('displays dialog when sessionExpired is true and handles re-login click', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaPending: null,
      sessionExpired: true,
      sessionExpiryReason: 'Session timed out after 30 minutes of inactivity.',
      login: vi.fn(),
      verifyMfa: vi.fn(),
      cancelMfa: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: mockDismiss,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<SessionExpiryModal />} />
          <Route path="/login" element={<div>Redirected to Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('session-expiry-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(
      screen.getByText('Session timed out after 30 minutes of inactivity.')
    ).toBeInTheDocument();

    const loginBtn = screen.getByTestId('session-login-btn');
    fireEvent.click(loginBtn);

    expect(mockDismiss).toHaveBeenCalled();
    expect(screen.getByText('Redirected to Login Screen')).toBeInTheDocument();
  });
});
