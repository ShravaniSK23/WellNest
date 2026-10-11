import { apiClient } from './apiClient';
import type {
  ChannelInfo,
  CommunityPost,
  PostComment,
  CreatePostPayload,
  CreateCommentPayload,
  ReportContentPayload,
  ReportResponse,
} from '../types/community.types';

export const communityApi = {
  async getChannels(): Promise<{
    channels: ChannelInfo[];
    crisisHelpline: { name: string; phone: string; text: string; website: string; disclaimer: string };
  }> {
    const response = await apiClient.get('/community/channels');
    return response.data;
  },

  async getPosts(
    channel?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    posts: CommunityPost[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params: Record<string, any> = { page, limit };
    if (channel && channel !== 'ALL') {
      params.channel = channel;
    }
    const response = await apiClient.get('/community/posts', { params });
    return response.data;
  },

  async createPost(payload: CreatePostPayload): Promise<{ post: CommunityPost }> {
    const response = await apiClient.post<{ post: CommunityPost }>('/community/posts', payload);
    return response.data;
  },

  async getComments(postId: string): Promise<{ comments: PostComment[] }> {
    const response = await apiClient.get<{ comments: PostComment[] }>(`/community/posts/${postId}/comments`);
    return response.data;
  },

  async createComment(
    postId: string,
    payload: CreateCommentPayload
  ): Promise<{ comment: PostComment }> {
    const response = await apiClient.post<{ comment: PostComment }>(
      `/community/posts/${postId}/comments`,
      payload
    );
    return response.data;
  },

  async reportContent(payload: ReportContentPayload): Promise<ReportResponse> {
    const response = await apiClient.post<ReportResponse>('/community/reports', payload);
    return response.data;
  },
};
