import React, { useState } from 'react';
import type { PostComment } from '../../types/community.types';
import { CreateCommentBox } from './CreateCommentBox';
import { HiddenContentBadge } from './HiddenContentBadge';
import { Flag, MessageSquare, Reply, User } from 'lucide-react';

interface CommentListProps {
  postId: string;
  comments: PostComment[];
  onReport: (comment: PostComment) => void;
  onCommentAdded: (newComment: PostComment) => void;
}

interface CommentItemProps {
  comment: PostComment;
  postId: string;
  onReport: (comment: PostComment) => void;
  onReplySuccess: (newComment: PostComment) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onReport,
  onReplySuccess,
  isReply = false,
}) => {
  const isHidden = comment.status === 'HIDDEN' || (comment.reportCount ?? 0) >= 3;
  const [isRevealed, setIsRevealed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      data-testid={`comment-item-${comment.id}`}
      className={`p-4 rounded-2xl border transition-all ${
        isReply
          ? 'ml-6 sm:ml-8 mt-2 bg-slate-50/70 border-slate-200'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}
    >
      {/* Author and Metadata Header (Pseudonym ONLY) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span
            data-testid="comment-author-pseudonym"
            className="text-xs font-bold text-slate-800 tracking-tight"
          >
            {comment.authorPseudonym}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">&bull;</span>
          <span className="text-[10px] text-slate-400">{formattedDate}</span>
        </div>

        <button
          type="button"
          data-testid={`report-comment-btn-${comment.id}`}
          onClick={() => onReport(comment)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Report comment"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">Report</span>
        </button>
      </div>

      {/* Hidden Content Warning if >= 3 reports or HIDDEN */}
      {isHidden && (
        <div className="mb-2">
          <HiddenContentBadge
            reportCount={comment.reportCount ?? 3}
            isRevealed={isRevealed}
            onToggleReveal={() => setIsRevealed(!isRevealed)}
          />
        </div>
      )}

      {/* Comment Body */}
      {(!isHidden || isRevealed) && (
        <p
          data-testid={`comment-content-${comment.id}`}
          className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        >
          {comment.content}
        </p>
      )}

      {/* Comment Actions */}
      {(!isHidden || isRevealed) && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            data-testid={`reply-to-comment-btn-${comment.id}`}
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition"
          >
            <Reply className="w-3 h-3" />
            <span>{showReplyForm ? 'Cancel Reply' : 'Reply'}</span>
          </button>
        </div>
      )}

      {/* Inline Reply Form */}
      {showReplyForm && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <CreateCommentBox
            postId={postId}
            parentCommentId={comment.id}
            placeholder={`Reply to ${comment.authorPseudonym}...`}
            onSuccess={(newReply) => {
              setShowReplyForm(false);
              onReplySuccess(newReply);
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export const CommentList: React.FC<CommentListProps> = ({
  postId,
  comments,
  onReport,
  onCommentAdded,
}) => {
  // Group comments: top-level comments (parentCommentId is null/undefined) and replies
  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const replies = comments.filter((c) => !!c.parentCommentId);

  const getRepliesFor = (commentId: string) =>
    replies.filter((r) => r.parentCommentId === commentId);

  if (comments.length === 0) {
    return (
      <div
        data-testid="empty-comments-state"
        className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs"
      >
        <MessageSquare className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
        <p className="font-medium">No comments yet.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Be the first peer to leave a supportive and compassionate thought.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="comments-container">
      {topLevelComments.map((comment) => {
        const commentReplies = getRepliesFor(comment.id);
        return (
          <div key={comment.id} className="space-y-2">
            <CommentItem
              comment={comment}
              postId={postId}
              onReport={onReport}
              onReplySuccess={onCommentAdded}
            />

            {/* Render Replies */}
            {commentReplies.length > 0 && (
              <div className="space-y-2" data-testid={`comment-replies-${comment.id}`}>
                {commentReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    onReport={onReport}
                    onReplySuccess={onCommentAdded}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
