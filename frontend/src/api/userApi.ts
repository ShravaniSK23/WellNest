import { apiClient } from './apiClient';
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from '../types/auth.types';

export const userApi = {
  async getProfile(): Promise<{ user: UserProfile }> {
    const response = await apiClient.get<{ user: UserProfile }>('/users/me');
    return response.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<{ message: string; user: UserProfile }> {
    const response = await apiClient.put<{ message: string; user: UserProfile }>('/users/me', payload);
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/users/me/password', payload);
    return response.data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/users/me');
    return response.data;
  },
};
