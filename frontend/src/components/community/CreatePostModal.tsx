import React, { useState } from 'react';
import { communityApi } from '../../api/communityApi';
import { formatApiError } from '../../api/apiClient';
import type {
  CommunityChannelId,
  CommunityPost,
  ChannelInfo,
} from '../../types/community.types';
import {
  PenLine,
  X,
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  channels: ChannelInfo[];
  defaultChannel?: CommunityChannelId;
  onClose: () => void;
  onSuccess: (post: CommunityPost) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  channels,
  defaultChannel = 'GENERAL_SUPPORT',
  onClose,
  onSuccess,
}) => {
  const [channel, setChannel] = useState<CommunityChannelId>(defaultChannel);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxContentLength = 2000;
  const maxTitleLength = 200;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Post title is required.');
      return;
    }

    if (!content.trim()) {
      setError('Post content is required.');
      return;
    }

    if (content.length > maxContentLength) {
      setError(`Content must not exceed ${maxContentLength.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await communityApi.createPost({
        channel,
        title: title.trim(),
        content: content.trim(),
      });

      onSuccess(result.post);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="create-post-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      onClick={onClose}
    >
      <div
        data-testid="create-post-modal-content"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          aria-label="Close create post modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-2xl">
            <PenLine className="w-6 h-6" />
          </div>
          <div>
            <h2 id="create-post-title" className="text-xl font-bold text-slate-900">
              Create Community Post
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Share your thoughts safely with the anonymous peer community
            </p>
          </div>
        </div>

        {error && (
          <div
            data-testid="create-post-error-alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-post-form">
          {/* Topic Channel */}
          <div>
            <label htmlFor="post-channel" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Topic Channel <span className="text-rose-500">*</span>
            </label>
            <select
              id="post-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as CommunityChannelId)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="post-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Post Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {title.length} / {maxTitleLength}
              </span>
            </div>
            <input
              id="post-title"
              type="text"
              required
              maxLength={maxTitleLength}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Managing study burnout before finals week"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
            />
          </div>

          {/* Content (<= 2,000 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="post-content" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Content / Message <span className="text-rose-500">*</span>
              </label>
              <span
                data-testid="post-content-counter"
                className={`text-xs tabular-nums font-medium ${
                  content.length >= maxContentLength
                    ? 'text-rose-600 font-bold'
                    : content.length >= 1800
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {content.length.toLocaleString()} / {maxContentLength.toLocaleString()}
              </span>
            </div>
            <textarea
              id="post-content"
              rows={6}
              required
              maxLength={maxContentLength}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here. You are in a compassionate, judgment-free space..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition resize-none leading-relaxed"
            />
          </div>

          {/* Pseudonym Privacy Notice */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Pseudonym-Only Privacy (BR-7):</strong> Your post will be published anonymously under your system-generated pseudonym. Your email, real name, and user ID are strictly never exposed.
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              data-testid="submit-create-post-btn"
              className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
