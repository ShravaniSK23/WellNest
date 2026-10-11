import React, { useState } from 'react';
import type { CommunityPost, PostComment, CommunityChannelId } from '../../types/community.types';
import { communityApi } from '../../api/communityApi';
import { formatApiError } from '../../api/apiClient';
import { HiddenContentBadge } from './HiddenContentBadge';
import { CommentList } from './CommentList';
import { CreateCommentBox } from './CreateCommentBox';
import {
  MessageSquare,
  Flag,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface PostCardProps {
  post: CommunityPost;
  onReport: (item: { postId?: string; commentId?: string; title?: string }) => void;
  onPostUpdated?: (updatedPost: CommunityPost) => void;
}

const CHANNEL_LABELS: Record<CommunityChannelId, { label: string; badgeClass: string }> = {
  STRESS: {
    label: 'Stress Management',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  ACADEMIC_PRESSURE: {
    label: 'Academic Pressure',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  WORKPLACE_BURNOUT: {
    label: 'Workplace Burnout',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  GENERAL_SUPPORT: {
    label: 'General Support',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onReport,
  onPostUpdated,
}) => {
  const isHidden = post.status === 'HIDDEN' || (post.reportCount ?? 0) >= 3;
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState<number>(post.commentCount ?? 0);

  const channelMeta = CHANNEL_LABELS[post.channel] || {
    label: post.channel,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleToggleComments = async () => {
    const nextState = !isCommentsExpanded;
    setIsCommentsExpanded(nextState);

    if (nextState && !commentsLoaded) {
      setIsLoadingComments(true);
      setCommentsError(null);
      try {
        const res = await communityApi.getComments(post.id);
        setComments(res.comments);
        setCommentsLoaded(true);
        setCommentCount(res.comments.length);
      } catch (err) {
        setCommentsError(formatApiError(err));
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleNewCommentAdded = (newComment: PostComment) => {
    setComments((prev) => [...prev, newComment]);
    const updatedCount = commentCount + 1;
    setCommentCount(updatedCount);
    if (onPostUpdated) {
      onPostUpdated({ ...post, commentCount: updatedCount });
    }
  };

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Channel badge + Pseudonym Author + Date */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              data-testid={`post-channel-badge-${post.channel}`}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${channelMeta.badgeClass}`}
            >
              <Tag className="w-3 h-3" />
              <span>{channelMeta.label}</span>
            </span>

            {/* Pseudonym Display ONLY (BR-7 / REQ-AC-5) */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <User className="w-3 h-3 text-slate-500" />
              <span data-testid="post-author-pseudonym">{post.authorPseudonym}</span>
            </div>
          </div>

          <time className="text-[11px] text-slate-400 font-medium">{formattedDate}</time>
        </div>

        {/* Post Title */}
        <h2
          data-testid="post-title"
          className="text-lg sm:text-xl font-bold text-slate-900 leading-snug"
        >
          {post.title}
        </h2>

        {/* Auto-Hide Warning if >= 3 reports or HIDDEN */}
        {isHidden && (
          <HiddenContentBadge
            reportCount={post.reportCount ?? 3}
            isRevealed={isRevealed}
            onToggleReveal={() => setIsRevealed(!isRevealed)}
          />
        )}

        {/* Post Content */}
        {(!isHidden || isRevealed) && (
          <p
            data-testid="post-content"
            className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap leading-relaxed"
          >
            {post.content}
          </p>
        )}

        {isHidden && !isRevealed && (
          <p
            data-testid="hidden-placeholder-message"
            className="text-xs text-slate-400 italic"
          >
            Post content is hidden pending moderator review. Click &ldquo;View Anyway&rdquo; above to inspect.
          </p>
        )}

        {/* Actions Bar: Comments toggle + Report button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            data-testid={`toggle-comments-btn-${post.id}`}
            onClick={handleToggleComments}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
          >
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>
              {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            </span>
            {isCommentsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            data-testid={`report-post-btn-${post.id}`}
            onClick={() => onReport({ postId: post.id, title: post.title })}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-xl hover:bg-rose-50/70 transition"
            title="Report this post"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {isCommentsExpanded && (
        <div
          data-testid={`comments-drawer-${post.id}`}
          className="bg-slate-50/80 border-t border-slate-200/80 p-5 sm:p-6 space-y-4 animate-fade-in"
        >
          {/* Post Comment Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Add a Reflection or Support
            </h3>
            <CreateCommentBox
              postId={post.id}
              onSuccess={handleNewCommentAdded}
            />
          </div>

          {/* Comments Loading / Error / List */}
          {isLoadingComments && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading comments...</span>
            </div>
          )}

          {commentsError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{commentsError}</span>
            </div>
          )}

          {!isLoadingComments && !commentsError && (
            <CommentList
              postId={post.id}
              comments={comments}
              onReport={(comment) =>
                onReport({
                  commentId: comment.id,
                  title: `Comment by ${comment.authorPseudonym}`,
                })
              }
              onCommentAdded={handleNewCommentAdded}
            />
          )}
        </div>
      )}
    </article>
  );
};
