import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { VideoConsultationPage } from '../pages/appointment/VideoConsultationPage';
import { appointmentApi } from '../api/appointmentApi';
import type { Appointment } from '../types/appointment.types';

describe('Video Consultation States & Security (BR-16, REQ-TS-16)', () => {
  const now = Date.now();

  // 1. Session scheduled 45 minutes in the future (>10m window -> Waiting Room)
  const waitingAppointment: Appointment = {
    id: 'apt-wait-1',
    requestId: 'req-wait-1',
    helpSeekerId: 'u-hs-1',
    helpSeekerName: 'Alex Morgan',
    therapistId: 't-th-1',
    therapistName: 'Dr. Sarah Jenkins',
    slotId: 'slot-wait-1',
    status: 'CONFIRMED',
    startTime: new Date(now + 45 * 60 * 1000).toISOString(),
    endTime: new Date(now + 95 * 60 * 1000).toISOString(),
    rescheduleCount: 0,
    paymentStatus: 'CAPTURED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Session scheduled 5 minutes in future (<=10m window -> Active Video Room)
  const imminentAppointment: Appointment = {
    id: 'apt-live-1',
    requestId: 'req-live-1',
    helpSeekerId: 'u-hs-1',
    helpSeekerName: 'Alex Morgan',
    therapistId: 't-th-1',
    therapistName: 'Dr. Sarah Jenkins',
    slotId: 'slot-live-1',
    status: 'CONFIRMED',
    startTime: new Date(now + 5 * 60 * 1000).toISOString(),
    endTime: new Date(now + 55 * 60 * 1000).toISOString(),
    rescheduleCount: 0,
    paymentStatus: 'CAPTURED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders Waiting Room with countdown clock when session is > 10m away (REQ-TS-16)', async () => {
    vi.spyOn(appointmentApi, 'getAppointmentById').mockResolvedValue(waitingAppointment);

    render(
      <MemoryRouter initialEntries={['/appointments/apt-wait-1/video']}>
        <Routes>
          <Route path="/appointments/:id/video" element={<VideoConsultationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('video-waiting-screen')).toBeInTheDocument();
      expect(screen.getByTestId('waiting-room-countdown')).toBeInTheDocument();
      expect(screen.getByText(/Room Opens 10 Minutes Prior to Start/i)).toBeInTheDocument();
      expect(screen.getByText(/Pre-Consultation Equipment Check/i)).toBeInTheDocument();
    });
  });

  it('renders Active WebRTC Video Call Room when within 10 minutes of session', async () => {
    vi.spyOn(appointmentApi, 'getAppointmentById').mockResolvedValue(imminentAppointment);
    vi.spyOn(appointmentApi, 'getVideoToken').mockResolvedValue({
      appointmentId: 'apt-live-1',
      videoRoomUrl: 'https://wellnest.daily.co/apt-apt-live-1',
      sessionToken: 'jwt_mock_token_123',
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    });

    render(
      <MemoryRouter initialEntries={['/appointments/apt-live-1/video']}>
        <Routes>
          <Route path="/appointments/:id/video" element={<VideoConsultationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('video-active-screen')).toBeInTheDocument();
      expect(screen.getByTestId('call-duration-timer')).toBeInTheDocument();
      expect(screen.getByTestId('self-view-pip')).toBeInTheDocument();
      expect(screen.getByTestId('video-controls-dock')).toBeInTheDocument();
    });

    // In-call controls
    const micBtn = screen.getByTestId('toggle-mic-btn');
    expect(micBtn).toHaveTextContent(/mute/i);
    fireEvent.click(micBtn);
    expect(micBtn).toHaveTextContent(/muted/i);

    const videoBtn = screen.getByTestId('toggle-video-btn');
    fireEvent.click(videoBtn);
    expect(videoBtn).toHaveTextContent(/camera off/i);
  });

  it('renders Error State with retry button when room connection or token fails', async () => {
    vi.spyOn(appointmentApi, 'getAppointmentById').mockRejectedValue(
      new Error('Session token expired or room access unauthorized.')
    );

    render(
      <MemoryRouter initialEntries={['/appointments/apt-err-1/video']}>
        <Routes>
          <Route path="/appointments/:id/video" element={<VideoConsultationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('video-error-screen')).toBeInTheDocument();
      expect(screen.getByText(/Consultation Room Unavailable/i)).toBeInTheDocument();
      expect(screen.getByTestId('retry-video-token-btn')).toBeInTheDocument();
    });
  });

  it('never exposes provider secrets (STRIPE_SECRET_KEY, DAILY_API_KEY) in client DOM', async () => {
    vi.spyOn(appointmentApi, 'getAppointmentById').mockResolvedValue(imminentAppointment);
    vi.spyOn(appointmentApi, 'getVideoToken').mockResolvedValue({
      appointmentId: 'apt-live-1',
      videoRoomUrl: 'https://wellnest.daily.co/apt-apt-live-1',
      sessionToken: 'jwt_mock_token_123',
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/appointments/apt-live-1/video']}>
        <Routes>
          <Route path="/appointments/:id/video" element={<VideoConsultationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('video-active-screen')).toBeInTheDocument();
    });

    // Verify secret strings are nowhere in DOM HTML
    expect(container.innerHTML).not.toContain('STRIPE_SECRET_KEY');
    expect(container.innerHTML).not.toContain('DAILY_API_KEY');
    expect(container.innerHTML).not.toContain('STRIPE_WEBHOOK_SECRET');
  });
});
