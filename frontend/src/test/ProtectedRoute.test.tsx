import './setup';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';
import { UserProfile } from '../types/auth.types';

describe('ProtectedRoute Guard Component', () => {
  const mockUseAuth = vi.spyOn(AuthContextModule, 'useAuth');

  it('renders loading state when authentication is initializing', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      mfaPending: null,
      sessionExpired: false,
      sessionExpiryReason: null,
      login: vi.fn(),
      verifyMfa: vi.fn(),
      cancelMfa: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('route-loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({
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
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      dismissSessionExpired: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
  });

  it('allows access when user is authenticated with authorized role', () => {
    const mockUser: UserProfile = {
      id: 'u-123',
      email: 'seeker@wellnest.org',
      role: 'HELP_SEEKER',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'valid-token',
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
      dismissSessionExpired: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['HELP_SEEKER']} />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
  });

  it('redirects to /unauthorized when user role does not match allowedRoles', () => {
    const mockUser: UserProfile = {
      id: 'u-456',
      email: 'seeker@wellnest.org',
      role: 'HELP_SEEKER',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'valid-token',
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
      dismissSessionExpired: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/unauthorized" element={<div>403 Unauthorized Screen</div>} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<div>Admin Control Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('403 Unauthorized Screen')).toBeInTheDocument();
    expect(screen.queryByText('Admin Control Panel')).not.toBeInTheDocument();
  });
});
