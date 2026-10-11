import React from 'react';
import type { ModerationQueueItem } from '../../types/community.types';
import {
  ShieldAlert,
  User,
  Flag,
  FileText,
  MessageSquare,
  ArrowRight,
  Tag,
} from 'lucide-react';

export interface ModerationItemCardProps {
  item: ModerationQueueItem;
  itemType: 'post' | 'comment';
  onTakeAction: (item: ModerationQueueItem, itemType: 'post' | 'comment') => void;
}

export const ModerationItemCard: React.FC<ModerationItemCardProps> = ({
  item,
  itemType,
  onTakeAction,
}) => {
  const isComment = itemType === 'comment';

  return (
    <div
      data-testid={`moderation-item-${item.id}`}
      className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
    >
      {/* Header Badges & Author Pseudonym (ONLY Pseudonym!) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Badge */}
          <span
            data-testid={`item-type-badge-${itemType}`}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isComment
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            {isComment ? (
              <MessageSquare className="w-3 h-3" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            <span>{isComment ? 'Comment' : 'Post'}</span>
          </span>

          {/* Channel badge if present */}
          {item.channel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              <Tag className="w-3 h-3" />
              <span>{item.channel}</span>
            </span>
          )}

          {/* Anonymous Pseudonym ONLY (BR-7, REQ-AC-5) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            <User className="w-3 h-3 text-slate-500" />
            <span data-testid="queue-item-pseudonym">{item.authorPseudonym}</span>
          </div>
        </div>

        {/* Report Count Flag */}
        <div
          data-testid="queue-item-report-count"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold"
        >
          <Flag className="w-3.5 h-3.5 text-rose-600" />
          <span>{item.reportCount} Reports</span>
        </div>
      </div>

      {/* Title if post */}
      {item.title && (
        <h3
          data-testid="queue-item-title"
          className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
        >
          {item.title}
        </h3>
      )}

      {/* Flagged Content Body */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
        {item.content}
      </div>

      {/* Reported Reasons Badges */}
      {item.reasons && item.reasons.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Reported Reasons:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.reasons.map((reason, idx) => (
              <span
                key={`${reason}-${idx}`}
                data-testid={`reason-badge-${reason}`}
                className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          Status:{' '}
          <strong
            className={
              item.status === 'HIDDEN' ? 'text-amber-700' : 'text-slate-700'
            }
          >
            {item.status}
          </strong>
        </span>

        <button
          type="button"
          data-testid={`take-action-btn-${item.id}`}
          onClick={() => onTakeAction(item, itemType)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Review & Take Action</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
