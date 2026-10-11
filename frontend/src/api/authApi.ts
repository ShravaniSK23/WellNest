import { apiClient } from './apiClient';
import type {
  RegisterPayload,
  LoginPayload,
  LoginSuccessResponse,
  MfaSetupResponse,
  MfaVerifyPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

export const authApi = {
  async register(payload: RegisterPayload) {
    const response = await apiClient.post<{ message: string; userId: string; email: string; role: string }>(
      '/auth/register',
      payload
    );
    return response.data;
  },

  async login(payload: LoginPayload): Promise<LoginSuccessResponse> {
    const response = await apiClient.post<LoginSuccessResponse>('/auth/login', payload);
    return response.data;
  },

  async setupMfa(): Promise<MfaSetupResponse> {
    const response = await apiClient.post<MfaSetupResponse>('/auth/mfa/setup');
    return response.data;
  },

  async verifyMfa(payload: MfaVerifyPayload): Promise<LoginSuccessResponse> {
    const response = await apiClient.post<LoginSuccessResponse>('/auth/mfa/verify', payload);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string; resetToken?: string }> {
    const response = await apiClient.post<{ message: string; resetToken?: string }>(
      '/auth/forgot-password',
      payload
    );
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', payload);
    return response.data;
  },
};
