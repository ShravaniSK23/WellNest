import { apiClient } from './apiClient';
import type {
  ModerationQueueResponse,
  ModerationActionPayload,
} from '../types/community.types';

export const moderationApi = {
  async getModerationQueue(): Promise<ModerationQueueResponse> {
    const response = await apiClient.get<ModerationQueueResponse>('/moderation/queue');
    return response.data;
  },

  async executeAction(
    payload: ModerationActionPayload
  ): Promise<{ actionId: string; actionType: string; message: string }> {
    const response = await apiClient.post<{ actionId: string; actionType: string; message: string }>(
      '/moderation/actions',
      payload
    );
    return response.data;
  },
};
