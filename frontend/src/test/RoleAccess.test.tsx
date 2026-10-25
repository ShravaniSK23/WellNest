import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AuthContextModule from '../context/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { TherapistPortalPage } from '../pages/therapist/TherapistPortalPage';
import { appointmentApi } from '../api/appointmentApi';
import type { AppointmentRequestItem, Appointment } from '../types/appointment.types';

describe('Role-Based Access Control & Therapist Management Actions', () => {
  const mockUseAuth = vi.spyOn(AuthContextModule, 'useAuth');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows HELP_SEEKER access to Help Seeker routes and blocks THERAPIST routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-hs-1', email: 'seeker@wellnest.org', role: 'HELP_SEEKER' },
      token: 'valid-jwt',
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
      <MemoryRouter initialEntries={['/therapist/portal']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['THERAPIST']} />}>
            <Route path="/therapist/portal" element={<div>Therapist Workspace Content</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Access Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Help seeker should be redirected to /unauthorized when accessing /therapist/portal
    expect(screen.getByText('Unauthorized Access Page')).toBeInTheDocument();
    expect(screen.queryByText('Therapist Workspace Content')).not.toBeInTheDocument();
  });

  it('allows THERAPIST access to therapist portal and incoming requests', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-th-1', email: 'therapist@wellnest.org', role: 'THERAPIST' },
      token: 'valid-jwt',
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

    const mockIncomingRequests: AppointmentRequestItem[] = [
      {
        id: 'req-seek-001',
        appointmentId: 'apt-seek-001',
        helpSeekerId: 'u-seek-1',
        helpSeekerName: 'Clara Oswald',
        therapistId: 't-7788-9901',
        slotId: 'slot-clara-1',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
        status: 'PENDING',
        notes: 'Dealing with acute grief and anxiety.',
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        paymentStatus: 'AUTHORIZED',
        fee: 95.0,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(appointmentApi, 'getIncomingRequests').mockResolvedValue(mockIncomingRequests);
    vi.spyOn(appointmentApi, 'getAppointments').mockResolvedValue([]);
    const confirmSpy = vi.spyOn(appointmentApi, 'confirmAppointment').mockResolvedValue({
      appointmentId: 'apt-seek-001',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
    });

    render(
      <MemoryRouter initialEntries={['/therapist/portal']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['THERAPIST']} />}>
            <Route path="/therapist/portal" element={<TherapistPortalPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Clara Oswald')).toBeInTheDocument();
      expect(screen.getByText(/Dealing with acute grief and anxiety/i)).toBeInTheDocument();
    });

    // Accept action
    const acceptBtn = screen.getByTestId('accept-request-btn-req-seek-001');
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('apt-seek-001');
      expect(screen.getByTestId('action-feedback-banner')).toHaveTextContent(/Payment authorization captured/i);
    });
  });

  it('allows THERAPIST to decline an incoming request and release the slot', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-th-1', email: 'therapist@wellnest.org', role: 'THERAPIST' },
      token: 'valid-jwt',
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

    const mockIncomingRequests: AppointmentRequestItem[] = [
      {
        id: 'req-decline-001',
        appointmentId: 'apt-decline-001',
        helpSeekerId: 'u-seek-2',
        helpSeekerName: 'David Noble',
        therapistId: 't-7788-9901',
        slotId: 'slot-david-1',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
        status: 'PENDING',
        notes: 'Initial consultation',
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        paymentStatus: 'AUTHORIZED',
        fee: 95.0,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(appointmentApi, 'getIncomingRequests').mockResolvedValue(mockIncomingRequests);
    vi.spyOn(appointmentApi, 'getAppointments').mockResolvedValue([]);
    const declineSpy = vi.spyOn(appointmentApi, 'declineAppointment').mockResolvedValue({
      appointmentId: 'apt-decline-001',
      status: 'CANCELED',
      requestStatus: 'DECLINED',
    });

    render(
      <MemoryRouter>
        <TherapistPortalPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('David Noble')).toBeInTheDocument();
    });

    const declineBtn = screen.getByTestId('decline-request-btn-req-decline-001');
    fireEvent.click(declineBtn);

    await waitFor(() => {
      expect(declineSpy).toHaveBeenCalledWith('apt-decline-001');
      expect(screen.getByTestId('action-feedback-banner')).toHaveTextContent(/Slot and hold released/i);
    });
  });
});
