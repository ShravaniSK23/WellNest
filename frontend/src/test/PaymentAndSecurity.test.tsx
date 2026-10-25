import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BookingModal } from '../components/appointment/BookingModal';
import { TherapistCard } from '../components/therapist/TherapistCard';
import { appointmentApi } from '../api/appointmentApi';
import type { Therapist, AvailabilitySlot } from '../types/therapist.types';

describe('Payment Tokenization (PCI-DSS) & Verification Gating Security', () => {
  const verifiedTherapist: Therapist = {
    id: 't-test-verified',
    userId: 'u-therapist-1',
    fullName: 'Dr. Sarah Jenkins',
    biography: 'Licensed Clinical Psychologist.',
    qualifications: 'Ph.D. Clinical Psychology',
    licenseNumber: 'PSY-48291',
    verificationStatus: 'VERIFIED',
    yearsOfExperience: 10,
    consultationFee: 95.0,
    averageRating: 4.9,
    isVisible: true,
  };

  const unverifiedTherapist: Therapist = {
    id: 't-test-unverified',
    userId: 'u-therapist-unverified',
    fullName: 'Applicant Unverified',
    biography: 'Awaiting license check.',
    qualifications: 'M.S. Psychology',
    licenseNumber: 'PENDING-999',
    verificationStatus: 'PENDING_REVIEW', // UNVERIFIED!
    yearsOfExperience: 1,
    consultationFee: 50.0,
    averageRating: 0.0,
    isVisible: false,
  };

  const mockSlot: AvailabilitySlot = {
    id: 'slot-test-1',
    therapistId: 't-test-verified',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    isBooked: false,
  };

  // 1. PCI-DSS ZERO RAW CARD DATA TESTS
  describe('PCI-DSS Compliance (CO-3, SE-7)', () => {
    it('never contains raw credit card number, CVV, or card expiration inputs', () => {
      render(
        <BookingModal
          isOpen={true}
          onClose={vi.fn()}
          therapist={verifiedTherapist}
          slot={mockSlot}
          onSuccess={vi.fn()}
        />
      );

      // Verify no input collecting raw card data exists in the DOM
      expect(screen.queryByPlaceholderText(/card number/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/cvv/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/cvc/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/mm\/yy/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/expiry/i)).not.toBeInTheDocument();

      // Verify explicit PCI-DSS guarantee banner is displayed
      expect(screen.getByText(/PCI-DSS Level 1/i)).toBeInTheDocument();
      expect(screen.getByText(/WellNest never collects, transmits, or stores raw card numbers or CVVs/i)).toBeInTheDocument();
    });

    it('submits booking using tokenized payment reference with 2-phase authorization hold (ADR-004)', async () => {
      const bookingSpy = vi.spyOn(appointmentApi, 'submitBookingRequest').mockResolvedValue({
        appointmentId: 'apt-new-777',
        requestId: 'req-new-777',
        status: 'PENDING_CONFIRMATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        paymentStatus: 'AUTHORIZED',
      });

      const handleSuccess = vi.fn();

      render(
        <BookingModal
          isOpen={true}
          onClose={vi.fn()}
          therapist={verifiedTherapist}
          slot={mockSlot}
          onSuccess={handleSuccess}
        />
      );

      // Enter optional notes
      const notesInput = screen.getByTestId('booking-notes-input');
      fireEvent.change(notesInput, { target: { value: 'Exam anxiety support' } });

      // Submit
      const submitBtn = screen.getByTestId('confirm-booking-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(bookingSpy).toHaveBeenCalledWith({
          therapistId: 't-test-verified',
          slotId: 'slot-test-1',
          notes: 'Exam anxiety support',
          paymentMethodToken: 'pm_tok_demo_4242', // STRICT TOKEN ONLY
        });
        expect(handleSuccess).toHaveBeenCalled();
        expect(screen.getByTestId('booking-success-view')).toBeInTheDocument();
      });
    });
  });

  // 2. VERIFICATION GATING (NEVER INFER VERIFICATION IN FRONTEND)
  describe('Verification Gating (BR-1, BR-2, REQ-TS-4)', () => {
    it('displays Verified badge only when verificationStatus is explicitly VERIFIED', () => {
      render(
        <MemoryRouter>
          <TherapistCard therapist={verifiedTherapist} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
      expect(screen.getByTestId('view-profile-btn-t-test-verified')).toBeInTheDocument();
      expect(screen.queryByTestId('unverified-badge')).not.toBeInTheDocument();
    });

    it('displays Unverified badge and disables booking when therapist is unverified', () => {
      render(
        <MemoryRouter>
          <TherapistCard therapist={unverifiedTherapist} />
        </MemoryRouter>
      );

      // Must never infer verification
      expect(screen.getByTestId('unverified-badge')).toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
      expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();

      // CTA must be disabled
      expect(screen.getByText('Not Available')).toBeDisabled();
      expect(screen.queryByTestId('view-profile-btn-t-test-unverified')).not.toBeInTheDocument();
    });
  });
});
