export type CommunityChannelId =
  | 'STRESS'
  | 'ACADEMIC_PRESSURE'
  | 'WORKPLACE_BURNOUT'
  | 'GENERAL_SUPPORT';

export interface ChannelInfo {
  id: CommunityChannelId;
  name: string;
  description: string;
}

export type ReportReason =
  | 'INAPPROPRIATE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'HATE_SPEECH'
  | 'OTHER';

export interface CommunityPost {
  id: string;
  channel: CommunityChannelId;
  authorPseudonym: string;
  title: string;
  content: string;
  commentCount?: number;
  reportCount?: number;
  status?: 'VISIBLE' | 'HIDDEN' | 'REMOVED';
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  authorPseudonym: string;
  content: string;
  reportCount?: number;
  status?: 'VISIBLE' | 'HIDDEN' | 'REMOVED';
  createdAt: string;
}

export interface CreatePostPayload {
  channel: CommunityChannelId;
  title: string;
  content: string;
}

export interface CreateCommentPayload {
  content: string;
  parentCommentId?: string;
}

export interface ReportContentPayload {
  postId?: string;
  commentId?: string;
  reason: ReportReason;
  details?: string;
}

export interface ReportResponse {
  reportId: string;
  contentHidden: boolean;
  currentReportCount: number;
  message: string;
}

export type ModerationActionType =
  | 'RESTORE'
  | 'PERMANENT_REMOVE'
  | 'TEMPORARY_SUSPENSION'
  | 'ESCALATE';

export interface ModerationActionPayload {
  postId?: string;
  commentId?: string;
  actionType: ModerationActionType;
  durationDays?: number;
  reasoning: string;
}

export interface ModerationQueueItem {
  id: string;
  channel?: CommunityChannelId;
  postId?: string;
  title?: string;
  content: string;
  authorPseudonym: string;
  reportCount: number;
  reasons: string[];
  status: string;
  createdAt?: string;
}

export interface ModerationQueueResponse {
  queue: {
    hiddenPosts: ModerationQueueItem[];
    hiddenComments: ModerationQueueItem[];
    reportedPosts: ModerationQueueItem[];
    reportedComments: ModerationQueueItem[];
  };
}
