import React, { useState } from 'react';
import { communityApi } from '../../api/communityApi';
import { formatApiError } from '../../api/apiClient';
import type { PostComment } from '../../types/community.types';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface CreateCommentBoxProps {
  postId: string;
  parentCommentId?: string;
  placeholder?: string;
  onSuccess: (comment: PostComment) => void;
  onCancel?: () => void;
}

export const CreateCommentBox: React.FC<CreateCommentBoxProps> = ({
  postId,
  parentCommentId,
  placeholder = 'Write an encouraging comment or shared reflection...',
  onSuccess,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxCommentLength = 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (content.length > maxCommentLength) {
      setError(`Comment must not exceed ${maxCommentLength} characters.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await communityApi.createComment(postId, {
        content: content.trim(),
        parentCommentId,
      });

      setContent('');
      onSuccess(res.comment);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-testid="create-comment-form">
      {error && (
        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <textarea
          rows={3}
          maxLength={maxCommentLength}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          data-testid="comment-input-textarea"
          className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 tabular-nums">
            {content.length} / {maxCommentLength}
          </span>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              data-testid="submit-comment-btn"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-xs transition"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Reply</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
