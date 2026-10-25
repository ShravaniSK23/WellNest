import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentCard } from '../components/appointment/AppointmentCard';
import { AppointmentsListPage } from '../pages/appointment/AppointmentsListPage';
import { appointmentApi } from '../api/appointmentApi';
import type { Appointment } from '../types/appointment.types';

describe('All Appointment States & State Lifecycles', () => {
  const baseAppointment: Appointment = {
    id: 'apt-test-101',
    requestId: 'req-test-101',
    helpSeekerId: 'u-user-1',
    helpSeekerName: 'Alex Morgan',
    therapistId: 't-therapist-1',
    therapistName: 'Dr. Sarah Jenkins',
    therapistQualifications: 'Ph.D. Clinical Psychology',
    therapistFee: 95.0,
    slotId: 'slot-101',
    status: 'CONFIRMED',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    rescheduleCount: 0,
    notes: 'Discussion about exam stress',
    paymentStatus: 'CAPTURED',
    refundStatus: 'NOT_APPLICABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders CONFIRMED state with captured payment and consultation link', () => {
    render(
      <MemoryRouter>
        <AppointmentCard appointment={baseAppointment} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('status-badge-apt-test-101')).toHaveTextContent(/CONFIRMED/i);
    expect(screen.getByTestId('payment-status-apt-test-101')).toHaveTextContent(/CAPTURED/i);
    expect(screen.getByTestId('join-video-btn-apt-test-101')).toBeInTheDocument();
  });

  it('renders PENDING_CONFIRMATION state with authorization hold and 24h notice', () => {
    const pendingAppointment: Appointment = {
      ...baseAppointment,
      id: 'apt-test-pending',
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'AUTHORIZED',
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    };

    render(
      <MemoryRouter>
        <AppointmentCard appointment={pendingAppointment} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('status-badge-apt-test-pending')).toHaveTextContent(/PENDING APPROVAL/i);
    expect(screen.getByTestId('payment-status-apt-test-pending')).toHaveTextContent(/AUTHORIZED/i);
    expect(screen.getByText(/24h Response Window/i)).toBeInTheDocument();
  });

  it('renders CANCELED state with refund status badge', () => {
    const canceledAppointment: Appointment = {
      ...baseAppointment,
      id: 'apt-test-canceled',
      status: 'CANCELED',
      paymentStatus: 'REFUNDED',
      refundStatus: 'FULL_REFUND_INITIATED',
    };

    render(
      <MemoryRouter>
        <AppointmentCard appointment={canceledAppointment} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('status-badge-apt-test-canceled')).toHaveTextContent(/CANCELED/i);
    expect(screen.getByTestId('payment-status-apt-test-canceled')).toHaveTextContent(/REFUNDED/i);
    expect(screen.getByTestId('refund-status-apt-test-canceled')).toHaveTextContent(/FULL_REFUND_INITIATED/i);
  });

  it('renders COMPLETED state accurately without action buttons', () => {
    const completedAppointment: Appointment = {
      ...baseAppointment,
      id: 'apt-test-completed',
      status: 'COMPLETED',
      paymentStatus: 'CAPTURED',
    };

    render(
      <MemoryRouter>
        <AppointmentCard appointment={completedAppointment} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('status-badge-apt-test-completed')).toHaveTextContent(/COMPLETED/i);
    expect(screen.queryByTestId('reschedule-btn-apt-test-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cancel-btn-apt-test-completed')).not.toBeInTheDocument();
  });

  it('filters appointments by status tabs on AppointmentsListPage', async () => {
    const mockList: Appointment[] = [
      { ...baseAppointment, id: 'apt-1', status: 'CONFIRMED' },
      { ...baseAppointment, id: 'apt-2', status: 'PENDING_CONFIRMATION' },
      { ...baseAppointment, id: 'apt-3', status: 'COMPLETED' },
      { ...baseAppointment, id: 'apt-4', status: 'CANCELED', refundStatus: 'FULL_REFUND_INITIATED' },
    ];

    vi.spyOn(appointmentApi, 'getAppointments').mockResolvedValue(mockList);

    render(
      <MemoryRouter>
        <AppointmentsListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card-apt-1')).toBeInTheDocument();
    });

    // In ALL tab, all 4 are present
    expect(screen.getByTestId('appointment-card-apt-1')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-apt-2')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-apt-3')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-card-apt-4')).toBeInTheDocument();

    // Switch to PENDING tab
    fireEvent.click(screen.getByTestId('tab-pending'));
    expect(screen.getByTestId('appointment-card-apt-2')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-card-apt-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('appointment-card-apt-3')).not.toBeInTheDocument();

    // Switch to CANCELED tab
    fireEvent.click(screen.getByTestId('tab-canceled'));
    expect(screen.getByTestId('appointment-card-apt-4')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-card-apt-2')).not.toBeInTheDocument();
  });
});
