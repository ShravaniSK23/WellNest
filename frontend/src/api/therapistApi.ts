import { apiClient } from './apiClient';
import type {
  Therapist,
  AvailabilitySlot,
  TherapistSearchFilters,
  TherapistSearchResponse,
  CreateSlotPayload,
} from '../types/therapist.types';

// Helper to generate dynamic slots for the next 14 days
const generateDefaultSlots = (therapistId: string): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const now = new Date();

  // Create slots for day 1, 2, 3, 5, 7, 10 within next 14 days
  const daysAhead = [1, 2, 3, 5, 7, 10, 12];
  let slotCounter = 1;

  for (const dayOffset of daysAhead) {
    const slotDate = new Date(now);
    slotDate.setDate(now.getDate() + dayOffset);
    slotDate.setMinutes(0, 0, 0);

    // 10:00 AM slot
    const slot1Start = new Date(slotDate);
    slot1Start.setHours(10, 0, 0, 0);
    const slot1End = new Date(slot1Start);
    slot1End.setMinutes(50);

    slots.push({
      id: `slot-${therapistId}-${dayOffset}-1`,
      therapistId,
      startTime: slot1Start.toISOString(),
      endTime: slot1End.toISOString(),
      isBooked: false,
    });

    // 2:00 PM slot
    const slot2Start = new Date(slotDate);
    slot2Start.setHours(14, 0, 0, 0);
    const slot2End = new Date(slot2Start);
    slot2End.setMinutes(50);

    slots.push({
      id: `slot-${therapistId}-${dayOffset}-2`,
      therapistId,
      startTime: slot2Start.toISOString(),
      endTime: slot2End.toISOString(),
      isBooked: false,
    });

    // 4:00 PM slot
    const slot3Start = new Date(slotDate);
    slot3Start.setHours(16, 0, 0, 0);
    const slot3End = new Date(slot3Start);
    slot3End.setMinutes(50);

    slots.push({
      id: `slot-${therapistId}-${dayOffset}-3`,
      therapistId,
      startTime: slot3Start.toISOString(),
      endTime: slot3End.toISOString(),
      isBooked: slotCounter % 4 === 0, // Mark one as booked for testing
    });

    slotCounter++;
  }

  return slots;
};

// Seed verified therapists strictly honoring BR-1, BR-2, REQ-TS-4
const MOCK_THERAPISTS: Therapist[] = [
  {
    id: 't-7788-9901',
    userId: 'u-therapist-1',
    fullName: 'Dr. Sarah Jenkins',
    biography: 'Licensed Clinical Psychologist with over a decade of clinical experience in cognitive behavioral therapy (CBT), specialized in generalized anxiety, panic disorders, and workplace burnout.',
    qualifications: 'Ph.D. in Clinical Psychology, Harvard University; Licensed Clinical Psychologist (PSY-48291)',
    licenseNumber: 'PSY-48291',
    verificationStatus: 'VERIFIED',
    yearsOfExperience: 11,
    consultationFee: 95.0,
    averageRating: 4.9,
    isVisible: true,
    specializations: ['Anxiety', 'CBT', 'Burnout', 'Stress'],
    languages: ['English', 'Spanish'],
  },
  {
    id: 't-7788-9902',
    userId: 'u-therapist-2',
    fullName: 'Dr. Marcus Vance',
    biography: 'Board-certified adult psychiatrist and mindfulness psychotherapist focusing on depression management, life transitions, and high-pressure career stress.',
    qualifications: 'M.D. Psychiatry, Johns Hopkins University; Certified MBCT Practitioner (LIC-88120)',
    licenseNumber: 'LIC-88120',
    verificationStatus: 'VERIFIED',
    yearsOfExperience: 14,
    consultationFee: 120.0,
    averageRating: 4.8,
    isVisible: true,
    specializations: ['Depression', 'Mindfulness', 'Stress', 'Career Transition'],
    languages: ['English'],
  },
  {
    id: 't-7788-9903',
    userId: 'u-therapist-3',
    fullName: 'Dr. Elena Rostova',
    biography: 'Compassionate licensed therapist specializing in trauma recovery, PTSD, grief counseling, and somatic grounding techniques for adults and college students.',
    qualifications: 'Psy.D. in Counseling Psychology, Columbia University; EMDR Certified (LIC-31902)',
    licenseNumber: 'LIC-31902',
    verificationStatus: 'VERIFIED',
    yearsOfExperience: 8,
    consultationFee: 85.0,
    averageRating: 4.95,
    isVisible: true,
    specializations: ['Trauma & PTSD', 'Grief', 'EMDR', 'Anxiety'],
    languages: ['English', 'Russian'],
  },
  {
    id: 't-7788-9904',
    userId: 'u-therapist-4',
    fullName: 'Dr. Alex Rivera',
    biography: 'Specializes in relationship communication, family systems therapy, LGBTQ+ affirmative counseling, and emotional regulation techniques.',
    qualifications: 'LMFT, Licensed Marriage & Family Therapist; M.S. Clinical Psychology, UCLA (MFT-55019)',
    licenseNumber: 'MFT-55019',
    verificationStatus: 'VERIFIED',
    yearsOfExperience: 9,
    consultationFee: 80.0,
    averageRating: 4.75,
    isVisible: true,
    specializations: ['Relationships', 'LGBTQ+ Affirmative', 'Communication', 'Depression'],
    languages: ['English', 'Spanish'],
  },
  {
    id: 't-unverified-9999',
    userId: 'u-therapist-unverified',
    fullName: 'Alex Unverified (Applicant)',
    biography: 'Pending license verification review. Cannot accept bookings.',
    qualifications: 'M.S. Psychology (Pending Board Approval)',
    licenseNumber: 'PENDING-0000',
    verificationStatus: 'PENDING_REVIEW', // STRICTLY UNVERIFIED
    yearsOfExperience: 1,
    consultationFee: 50.0,
    averageRating: 0.0,
    isVisible: false,
    specializations: ['General'],
    languages: ['English'],
  },
];

// Persistent slot store in localStorage for demo continuity
const SLOTS_STORAGE_KEY = 'wellnest_therapist_slots';

const getStoredSlots = (): Record<string, AvailabilitySlot[]> => {
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored slots', e);
  }

  // Initialize defaults
  const initial: Record<string, AvailabilitySlot[]> = {};
  for (const t of MOCK_THERAPISTS) {
    if (t.verificationStatus === 'VERIFIED') {
      initial[t.id] = generateDefaultSlots(t.id);
    }
  }
  try {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {
    // Ignore storage issues
  }
  return initial;
};

const saveStoredSlots = (slotsMap: Record<string, AvailabilitySlot[]>) => {
  try {
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slotsMap));
  } catch (e) {
    console.error('Failed to save slots to localStorage', e);
  }
};

export const therapistApi = {
  /**
   * Search Verified Therapists
   * BR-1, BR-2, REQ-TS-4: Strictly verified therapists only. Unverified must never appear.
   */
  async searchTherapists(filters?: TherapistSearchFilters): Promise<TherapistSearchResponse> {
    try {
      const response = await apiClient.get<TherapistSearchResponse>('/therapists', {
        params: filters,
      });
      // Safety guarantee: Ensure no unverified therapists are exposed even if returned
      const verifiedOnly = (response.data.therapists || []).filter(
        (t) => t.verificationStatus === 'VERIFIED'
      );
      return {
        ...response.data,
        therapists: verifiedOnly,
      };
    } catch {
      // Fallback to local verified store
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;

      let filtered = MOCK_THERAPISTS.filter(
        (t) => t.verificationStatus === 'VERIFIED' && t.isVisible
      );

      if (filters?.specialization && filters.specialization !== 'ALL') {
        const spec = filters.specialization.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.qualifications.toLowerCase().includes(spec) ||
            t.specializations?.some((s) => s.toLowerCase().includes(spec)) ||
            t.biography.toLowerCase().includes(spec)
        );
      }

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.fullName.toLowerCase().includes(q) ||
            t.qualifications.toLowerCase().includes(q) ||
            t.biography.toLowerCase().includes(q)
        );
      }

      if (filters?.maxFee !== undefined && filters.maxFee > 0) {
        filtered = filtered.filter((t) => t.consultationFee <= filters.maxFee!);
      }

      if (filters?.minFee !== undefined) {
        filtered = filtered.filter((t) => t.consultationFee >= filters.minFee!);
      }

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return {
        therapists: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }
  },

  /**
   * Get Therapist Profile by ID
   */
  async getTherapistProfile(therapistId: string): Promise<Therapist> {
    try {
      const response = await apiClient.get<{ therapist: Therapist }>(`/therapists/${therapistId}`);
      if (response.data.therapist.verificationStatus !== 'VERIFIED') {
        throw new Error('This therapist is not verified.');
      }
      return response.data.therapist;
    } catch {
      const match = MOCK_THERAPISTS.find((t) => t.id === therapistId);
      if (!match) {
        throw new Error('Therapist not found');
      }
      return match;
    }
  },

  /**
   * Get Availability Slots for the next 14 calendar days (REQ-TS-5)
   */
  async getTherapistSlots(therapistId: string): Promise<AvailabilitySlot[]> {
    try {
      const response = await apiClient.get<{ slots: AvailabilitySlot[] }>(
        `/therapists/${therapistId}/slots`
      );
      return response.data.slots || [];
    } catch {
      const slotsMap = getStoredSlots();
      const slots = slotsMap[therapistId] || generateDefaultSlots(therapistId);
      const now = new Date();
      const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Filter slots strictly within [now, now + 14 days]
      return slots.filter((s) => {
        const slotStart = new Date(s.startTime);
        return slotStart >= now && slotStart <= fourteenDaysAhead;
      });
    }
  },

  /**
   * Create an Availability Slot (Therapist Action, REQ-TS-5)
   */
  async createAvailabilitySlot(payload: CreateSlotPayload): Promise<AvailabilitySlot> {
    try {
      const response = await apiClient.post<{ slot: AvailabilitySlot }>(
        '/therapists/slots',
        payload
      );
      return response.data.slot;
    } catch {
      const start = new Date(payload.startTime);
      const end = new Date(payload.endTime);
      const now = new Date();
      const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      if (start.getTime() <= now.getTime()) {
        throw new Error('Availability slot start time must be in the future.');
      }
      if (end.getTime() <= start.getTime()) {
        throw new Error('Slot end time must be after start time.');
      }
      if (start.getTime() > fourteenDaysAhead.getTime()) {
        throw new Error('Availability slots can only be created for the next 14 calendar days.');
      }

      const newSlot: AvailabilitySlot = {
        id: `slot-custom-${Date.now()}`,
        therapistId: 't-7788-9901', // Default current therapist demo
        startTime: payload.startTime,
        endTime: payload.endTime,
        isBooked: false,
        createdAt: new Date().toISOString(),
      };

      const slotsMap = getStoredSlots();
      const currentList = slotsMap[newSlot.therapistId] || [];
      slotsMap[newSlot.therapistId] = [...currentList, newSlot];
      saveStoredSlots(slotsMap);

      return newSlot;
    }
  },

  /**
   * Mark a slot as booked or released
   */
  markSlotBooked(therapistId: string, slotId: string, isBooked: boolean): void {
    const slotsMap = getStoredSlots();
    const list = slotsMap[therapistId];
    if (list) {
      const idx = list.findIndex((s) => s.id === slotId);
      if (idx !== -1) {
        list[idx].isBooked = isBooked;
        saveStoredSlots(slotsMap);
      }
    }
  },
};
