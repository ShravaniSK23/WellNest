import { apiClient } from './apiClient';
import type {
  RecordMoodPayload,
  RecordMoodResponse,
  TodayMoodResponse,
  StreakInfo,
} from '../types/mood.types';

export const moodApi = {
  /**
   * Record or edit daily mood entry (same-day edit handled by backend)
   */
  async recordMood(payload: RecordMoodPayload): Promise<RecordMoodResponse> {
    const response = await apiClient.post<RecordMoodResponse>('/moods', payload);
    return response.data;
  },

  /**
   * Fetch today's mood entry, current streak, and daily quote
   */
  async getTodayMood(dateStr?: string): Promise<TodayMoodResponse> {
    const params = dateStr ? { date: dateStr } : {};
    const response = await apiClient.get<TodayMoodResponse>('/moods/today', { params });
    return response.data;
  },

  /**
   * Fetch mood streak data
   */
  async getStreak(): Promise<{ streak: StreakInfo }> {
    const response = await apiClient.get<{ streak: StreakInfo }>('/moods/streak');
    return response.data;
  },
};
