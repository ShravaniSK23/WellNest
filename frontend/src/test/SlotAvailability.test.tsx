import './setup';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlotPicker } from '../components/therapist/SlotPicker';
import { TherapistAvailabilityPage } from '../pages/therapist/TherapistAvailabilityPage';
import { therapistApi } from '../api/therapistApi';
import type { AvailabilitySlot } from '../types/therapist.types';

describe('Slot Availability & 14-Day Calendar Management', () => {
  const now = new Date();

  // Create slots for tomorrow
  const tmrw = new Date(now);
  tmrw.setDate(now.getDate() + 1);
  tmrw.setHours(10, 0, 0, 0);

  const tmrwEnd = new Date(tmrw);
  tmrwEnd.setMinutes(50);

  const tmrwAfternoon = new Date(now);
  tmrwAfternoon.setDate(now.getDate() + 1);
  tmrwAfternoon.setHours(14, 0, 0, 0);

  const tmrwAfternoonEnd = new Date(tmrwAfternoon);
  tmrwAfternoonEnd.setMinutes(50);

  // Create slot beyond 14 days (18 days ahead)
  const beyond14Days = new Date(now);
  beyond14Days.setDate(now.getDate() + 18);
  beyond14Days.setHours(10, 0, 0, 0);

  const mockSlots: AvailabilitySlot[] = [
    {
      id: 'slot-open-1',
      therapistId: 't-test-1',
      startTime: tmrw.toISOString(),
      endTime: tmrwEnd.toISOString(),
      isBooked: false,
    },
    {
      id: 'slot-booked-2',
      therapistId: 't-test-1',
      startTime: tmrwAfternoon.toISOString(),
      endTime: tmrwAfternoonEnd.toISOString(),
      isBooked: true,
    },
    {
      id: 'slot-beyond-14',
      therapistId: 't-test-1',
      startTime: beyond14Days.toISOString(),
      endTime: new Date(beyond14Days.getTime() + 50 * 60 * 1000).toISOString(),
      isBooked: false,
    },
  ];

  it('strictly filters slots to within the 14-day calendar window (REQ-TS-5)', () => {
    const handleSelect = vi.fn();
    render(
      <SlotPicker
        slots={mockSlots}
        onSelectSlot={handleSelect}
      />
    );

    // Slot 18 days ahead must NOT be rendered
    expect(screen.queryByTestId('slot-available-slot-beyond-14')).not.toBeInTheDocument();
  });

  it('renders available slot as clickable and booked slot as reserved/disabled', () => {
    const handleSelect = vi.fn();
    render(
      <SlotPicker
        slots={mockSlots}
        onSelectSlot={handleSelect}
      />
    );

    // Click on tomorrow tab
    const tmrwDateKey = tmrw.toISOString().slice(0, 10);
    const tmrwTab = screen.getByTestId(`date-tab-${tmrwDateKey}`);
    fireEvent.click(tmrwTab);

    // Open slot
    const openSlotBtn = screen.getByTestId('slot-available-slot-open-1');
    expect(openSlotBtn).toBeInTheDocument();
    fireEvent.click(openSlotBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockSlots[0]);

    // Booked slot
    const bookedSlotElement = screen.getByTestId('slot-booked-slot-booked-2');
    expect(bookedSlotElement).toBeInTheDocument();
    expect(bookedSlotElement).toHaveTextContent(/reserved/i);
  });

  it('highlights selected slot with checked indicator', () => {
    const handleSelect = vi.fn();
    render(
      <SlotPicker
        slots={mockSlots}
        selectedSlotId="slot-open-1"
        onSelectSlot={handleSelect}
      />
    );

    const tmrwDateKey = tmrw.toISOString().slice(0, 10);
    fireEvent.click(screen.getByTestId(`date-tab-${tmrwDateKey}`));

    const openSlot = screen.getByTestId('slot-available-slot-open-1');
    expect(openSlot).toHaveTextContent(/selected/i);
  });

  it('allows therapist to create a new slot in TherapistAvailabilityPage', async () => {
    vi.spyOn(therapistApi, 'getTherapistSlots').mockResolvedValue(mockSlots.slice(0, 2));
    const createSpy = vi.spyOn(therapistApi, 'createAvailabilitySlot').mockResolvedValue({
      id: 'slot-new-999',
      therapistId: 't-7788-9901',
      startTime: `${tmrw.toISOString().slice(0, 10)}T16:00:00.000Z`,
      endTime: `${tmrw.toISOString().slice(0, 10)}T16:50:00.000Z`,
      isBooked: false,
    });

    render(
      <MemoryRouter>
        <TherapistAvailabilityPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/14-Day Availability Management/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId('create-slot-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
      expect(screen.getByTestId('slot-create-success')).toBeInTheDocument();
    });
  });
});
