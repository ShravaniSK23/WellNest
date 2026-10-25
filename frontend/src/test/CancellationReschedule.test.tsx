import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RescheduleModal } from '../components/appointment/RescheduleModal';
import { CancellationModal } from '../components/appointment/CancellationModal';
import { therapistApi } from '../api/therapistApi';
import { appointmentApi } from '../api/appointmentApi';
import type { Appointment } from '../types/appointment.types';
import type { AvailabilitySlot } from '../types/therapist.types';

describe('Cancellation Policy & Rescheduling Business Rules', () => {
  const futureDate48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const futureDate12h = new Date(Date.now() + 12 * 60 * 60 * 1000); // <24h

  const baseAppointment: Appointment = {
    id: 'apt-resched-1',
    requestId: 'req-resched-1',
    helpSeekerId: 'u-user-1',
    helpSeekerName: 'Alex Morgan',
    therapistId: 't-7788-9901',
    therapistName: 'Dr. Sarah Jenkins',
    therapistQualifications: 'Ph.D. Clinical Psychology',
    therapistFee: 95.0,
    slotId: 'slot-old-1',
    status: 'CONFIRMED',
    startTime: futureDate48h.toISOString(),
    endTime: new Date(futureDate48h.getTime() + 50 * 60 * 1000).toISOString(),
    rescheduleCount: 0,
    paymentStatus: 'CAPTURED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newSlots: AvailabilitySlot[] = [
    {
      id: 'slot-new-target',
      therapistId: 't-7788-9901',
      startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      isBooked: false,
    },
  ];

  // RESCHEDULE TESTS
  describe('Reschedule Rules (BR-4, REQ-TS-9)', () => {
    it('allows reschedule when rescheduleCount is 0 or 1', async () => {
      vi.spyOn(therapistApi, 'getTherapistSlots').mockResolvedValue(newSlots);
      const rescheduleSpy = vi.spyOn(appointmentApi, 'rescheduleAppointment').mockResolvedValue({
        appointmentId: 'apt-resched-1',
        newStartTime: newSlots[0].startTime,
        rescheduleCount: 1,
      });

      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      render(
        <RescheduleModal
          isOpen={true}
          onClose={handleClose}
          appointment={baseAppointment}
          onSuccess={handleSuccess}
        />
      );

      expect(screen.getByTestId('reschedule-count-badge')).toHaveTextContent(/0 of 2 used/i);
      expect(screen.getByText(/You are using reschedule/i)).toBeInTheDocument();

      // Wait for slots to finish loading
      await waitFor(() => {
        expect(screen.getByTestId('date-picker-bar')).toBeInTheDocument();
      });

      // Click on target slot date
      const dateKey = newSlots[0].startTime.slice(0, 10);
      const dateTab = screen.getByTestId(`date-tab-${dateKey}`);
      fireEvent.click(dateTab);

      // Select new slot
      const newSlotBtn = screen.getByTestId('slot-available-slot-new-target');
      fireEvent.click(newSlotBtn);

      // Confirm Reschedule
      const confirmBtn = screen.getByTestId('confirm-reschedule-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(rescheduleSpy).toHaveBeenCalledWith('apt-resched-1', { newSlotId: 'slot-new-target' });
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('strictly blocks rescheduling when rescheduleCount is >= 2 (BR-4 limit)', () => {
      const maxedAppointment: Appointment = {
        ...baseAppointment,
        rescheduleCount: 2, // Maximum reached
      };

      render(
        <RescheduleModal
          isOpen={true}
          onClose={vi.fn()}
          appointment={maxedAppointment}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByTestId('reschedule-count-badge')).toHaveTextContent(/2 of 2 used/i);
      expect(screen.getByTestId('reschedule-limit-reached-alert')).toBeInTheDocument();
      expect(screen.getByText(/Maximum Reschedules Reached \(BR-4 Limit\)/i)).toBeInTheDocument();
      expect(screen.queryByTestId('confirm-reschedule-btn')).not.toBeInTheDocument();
    });
  });

  // CANCELLATION TESTS
  describe('Cancellation Policy & Refund Status (BR-3, BR-6, REQ-TS-10, REQ-TS-11)', () => {
    it('grants 100% full refund when Help Seeker cancels >= 24h before start time (BR-3)', async () => {
      const cancelSpy = vi.spyOn(appointmentApi, 'cancelAppointment').mockResolvedValue({
        appointmentId: 'apt-resched-1',
        status: 'CANCELED',
        fullRefundInitiated: true,
        refundStatus: 'FULL_REFUND_INITIATED',
        refundAmount: 95.0,
      });

      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      render(
        <CancellationModal
          isOpen={true}
          onClose={handleClose}
          appointment={baseAppointment} // 48h in future
          userRole="HELP_SEEKER"
          onSuccess={handleSuccess}
        />
      );

      // Should show 100% Full Refund Guarantee
      expect(screen.getByText(/100% Full Refund Guaranteed/i)).toBeInTheDocument();
      expect(screen.getByTestId('expected-refund-status')).toHaveTextContent('FULL_REFUND_INITIATED');

      // Enter required reason
      const reasonInput = screen.getByTestId('cancellation-reason-input');
      fireEvent.change(reasonInput, { target: { value: 'Work conference rescheduled' } });

      // Confirm
      fireEvent.click(screen.getByTestId('confirm-cancellation-btn'));

      await waitFor(() => {
        expect(cancelSpy).toHaveBeenCalledWith(
          'apt-resched-1',
          { reason: 'Work conference rescheduled' },
          'HELP_SEEKER'
        );
        expect(handleSuccess).toHaveBeenCalled();
      });
    });

    it('marks cancellation as non-refundable when Help Seeker cancels < 24h before start time (BR-3)', async () => {
      const lateAppointment: Appointment = {
        ...baseAppointment,
        id: 'apt-late-cancel',
        startTime: futureDate12h.toISOString(), // 12h away (<24h)
      };

      const cancelSpy = vi.spyOn(appointmentApi, 'cancelAppointment').mockResolvedValue({
        appointmentId: 'apt-late-cancel',
        status: 'CANCELED',
        fullRefundInitiated: false,
        refundStatus: 'NON_REFUNDABLE',
        refundAmount: 0.0,
      });

      render(
        <CancellationModal
          isOpen={true}
          onClose={vi.fn()}
          appointment={lateAppointment}
          userRole="HELP_SEEKER"
          onSuccess={vi.fn()}
        />
      );

      // Should show Late Cancellation notice & NON_REFUNDABLE
      expect(screen.getByText(/Late Cancellation Notice/i)).toBeInTheDocument();
      expect(screen.getByTestId('expected-refund-status')).toHaveTextContent('NON_REFUNDABLE');
      expect(screen.getByText(/Less than 24 hours remain before your session/i)).toBeInTheDocument();
    });

    it('always issues 100% full refund when Therapist initiates cancellation (BR-6)', async () => {
      const therapistCancelSpy = vi.spyOn(appointmentApi, 'cancelAppointment').mockResolvedValue({
        appointmentId: 'apt-resched-1',
        status: 'CANCELED',
        fullRefundInitiated: true,
        refundStatus: 'FULL_REFUND_INITIATED',
        refundAmount: 95.0,
      });

      render(
        <CancellationModal
          isOpen={true}
          onClose={vi.fn()}
          appointment={baseAppointment}
          userRole="THERAPIST"
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByTestId('cancellation-policy-banner')).toHaveTextContent(/BR-6/);
      expect(screen.getByTestId('cancellation-policy-banner')).toHaveTextContent(/100% full refund/);
      expect(screen.getByTestId('expected-refund-status')).toHaveTextContent('FULL_REFUND_INITIATED');
    });
  });
});
