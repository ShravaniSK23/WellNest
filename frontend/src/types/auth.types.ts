export type UserRole = 'HELP_SEEKER' | 'THERAPIST' | 'MODERATOR' | 'ADMIN';

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
  mfaEnabled?: boolean;
  failedLoginCount?: number;
  lockedUntil?: string | null;
}

export interface HelpSeekerProfile {
  id: string;
  userId: string;
  fullName: string;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TherapistCredential {
  id: string;
  documentType: string;
  documentUrl: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
}

export interface TherapistProfile {
  id: string;
  userId: string;
  fullName: string;
  licenseNumber: string;
  qualifications: string;
  biography: string;
  consultationFee: number;
  verificationStatus: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  isVisible: boolean;
  credentials?: TherapistCredential[];
}

export interface ModeratorProfile {
  id: string;
  userId: string;
  department: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  permissionLevel: string;
}

export interface UserProfile extends BaseUser {
  helpSeeker?: HelpSeekerProfile;
  therapist?: TherapistProfile;
  moderator?: ModeratorProfile;
  admin?: AdminProfile;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  timezone?: string;
  licenseNumber?: string;
  qualifications?: string;
  biography?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  token?: string;
  accessToken?: string;
  user?: BaseUser;
  mfaRequired?: boolean;
  mfaPendingToken?: string;
  message?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface MfaVerifyPayload {
  userId: string;
  sessionId: string;
  mfaCode: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  timezone?: string;
  biography?: string;
  qualifications?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
