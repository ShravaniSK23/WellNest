import React, { useState, useEffect, useCallback } from 'react';
import type {
  CommunityPost,
  ChannelInfo,
  CommunityChannelId,
  ReportResponse,
} from '../../types/community.types';
import { communityApi } from '../../api/communityApi';
import { formatApiError } from '../../api/apiClient';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import { ChannelFilter } from '../../components/community/ChannelFilter';
import { PostCard } from '../../components/community/PostCard';
import { CreatePostModal } from '../../components/community/CreatePostModal';
import { ReportModal } from '../../components/community/ReportModal';
import {
  Users,
  PenSquare,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

const DEFAULT_CHANNELS: ChannelInfo[] = [
  { id: 'STRESS', name: 'Stress', description: 'Coping strategies, mindfulness, and relief' },
  { id: 'ACADEMIC_PRESSURE', name: 'Academic Pressure', description: 'Exams, assignments, and campus well-being' },
  { id: 'WORKPLACE_BURNOUT', name: 'Workplace Burnout', description: 'Career stress, boundaries, and work-life balance' },
  { id: 'GENERAL_SUPPORT', name: 'General Support', description: 'Compassionate peer listening and uplifting thoughts' },
];

export const CommunityPage: React.FC = () => {
  const [channels, setChannels] = useState<ChannelInfo[]>(DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<CommunityChannelId | 'ALL'>('ALL');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPosts, setTotalPosts] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<{
    postId?: string;
    commentId?: string;
    title?: string;
  } | null>(null);

  // Notification / Feedback banner state
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // Load Channels
  const fetchChannels = useCallback(async () => {
    try {
      const data = await communityApi.getChannels();
      if (data?.channels && data.channels.length > 0) {
        setChannels(data.channels);
      }
    } catch {
      // Fallback channels already loaded
    }
  }, []);

  // Load Posts
  const fetchPosts = useCallback(
    async (currentPage = page, channel = selectedChannel) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await communityApi.getPosts(channel, currentPage, 15);
        setPosts(data.posts || []);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalPosts(data.pagination.total || 0);
        }
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [page, selectedChannel]
  );

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchPosts(page, selectedChannel);
  }, [selectedChannel, page, fetchPosts]);

  const handleChannelChange = (channelId: CommunityChannelId | 'ALL') => {
    setSelectedChannel(channelId);
    setPage(1);
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotalPosts((prev) => prev + 1);
    setFeedbackMessage({
      type: 'success',
      text: 'Your post was anonymously published with your pseudonym!',
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleReportSuccess = (result: ReportResponse) => {
    if (result.contentHidden && reportTarget?.postId) {
      // Update post state to hidden if this post reached 3 reports
      setPosts((prev) =>
        prev.map((p) =>
          p.id === reportTarget.postId
            ? { ...p, status: 'HIDDEN', reportCount: result.currentReportCount }
            : p
        )
      );
    }
    setFeedbackMessage({
      type: 'info',
      text: result.message || 'Thank you for your report. Our safety team has been notified.',
    });
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  return (
    <div className="space-y-6" data-testid="community-page">
      {/* 1. Persistent Crisis Helpline Banner */}
      <CrisisResourceBanner />

      {/* 2. Privacy & Pseudonym Assurance Notice (BR-7, REQ-AC-5) */}
      <div
        data-testid="privacy-assurance-banner"
        className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-900"
      >
        <ShieldCheck className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-teal-950">
            Anonymous Peer Community Privacy Guarantee:
          </span>{' '}
          All posts and comments are strictly identified by system-generated pseudonyms. Your email,
          real name, and user account IDs are never exposed, derived, or visible to peers or public
          clients.
        </div>
      </div>

      {/* 3. Hero Header & Create Post Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Supportive Peer Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Anonymous Community Channels
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            A safe haven to share experiences, vent, offer encouragement, and connect with peers
            navigating similar mental wellness journeys.
          </p>
        </div>

        <button
          type="button"
          data-testid="open-create-post-modal-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 flex-shrink-0"
        >
          <PenSquare className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          data-testid="community-feedback-banner"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4. Channel Selection & Feed Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80">
        <ChannelFilter
          channels={channels}
          selectedChannel={selectedChannel}
          onSelect={handleChannelChange}
          disabled={isLoading}
        />

        <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
          <span className="tabular-nums font-medium">
            {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
          </span>
          <button
            type="button"
            data-testid="refresh-posts-btn"
            onClick={() => fetchPosts(page, selectedChannel)}
            disabled={isLoading}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-50 transition"
            title="Refresh community posts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. Error Alert */}
      {error && (
        <div
          data-testid="posts-error-alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchPosts(page, selectedChannel)}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 6. Feed List */}
      {isLoading ? (
        <div
          data-testid="loading-posts-state"
          className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm font-medium">Loading anonymous peer posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          data-testid="empty-posts-state"
          className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No posts in this channel yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first peer to start a compassionate conversation or share your reflections in{' '}
            {selectedChannel === 'ALL' ? 'the community' : selectedChannel}.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>Share First Post</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="posts-feed-container">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReport={(target) => setReportTarget(target)}
              onPostUpdated={(updated) =>
                setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
            />
          ))}
        </div>
      )}

      {/* 7. Pagination Controls */}
      {totalPages > 1 && (
        <div
          data-testid="community-pagination"
          className="flex items-center justify-between pt-4 pb-8"
        >
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-medium text-slate-500">
            Page <strong className="text-slate-900">{page}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 8. Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        channels={channels}
        defaultChannel={selectedChannel === 'ALL' ? 'GENERAL_SUPPORT' : selectedChannel}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePostCreated}
      />

      {/* 9. Report Dialog */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          postId={reportTarget.postId}
          commentId={reportTarget.commentId}
          itemTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
};
