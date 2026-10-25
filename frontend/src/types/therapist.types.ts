export type TherapistVerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface TherapistCredential {
  id: string;
  documentType: string;
  documentUrl: string;
  status: TherapistVerificationStatus;
}

export interface Therapist {
  id: string;
  userId: string;
  fullName: string;
  biography: string;
  qualifications: string;
  licenseNumber: string;
  verificationStatus: TherapistVerificationStatus;
  yearsOfExperience: number;
  consultationFee: number;
  averageRating: number;
  isVisible: boolean;
  specializations?: string[];
  languages?: string[];
  user?: {
    email?: string;
    createdAt?: string;
  };
  credentials?: TherapistCredential[];
}

export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  isBooked: boolean;
  createdAt?: string;
}

export interface TherapistSearchFilters {
  specialization?: string;
  language?: string;
  minFee?: number;
  maxFee?: number;
  search?: string;
  availableDate?: string;
  page?: number;
  limit?: number;
}

export interface TherapistPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TherapistSearchResponse {
  therapists: Therapist[];
  pagination: TherapistPagination;
}

export interface CreateSlotPayload {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}
