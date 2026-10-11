import React, { useState, useEffect, useCallback } from 'react';
import type {
  ModerationQueueItem,
  ModerationQueueResponse,
} from '../../types/community.types';
import { moderationApi } from '../../api/moderationApi';
import { formatApiError } from '../../api/apiClient';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import { ModerationItemCard } from '../../components/moderation/ModerationItemCard';
import { ModerationActionDialog } from '../../components/moderation/ModerationActionDialog';
import {
  ShieldAlert,
  FileText,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type QueueTab = 'hiddenPosts' | 'hiddenComments' | 'reportedPosts' | 'reportedComments';

export const ModerationPage: React.FC = () => {
  const [queue, setQueue] = useState<ModerationQueueResponse['queue']>({
    hiddenPosts: [],
    hiddenComments: [],
    reportedPosts: [],
    reportedComments: [],
  });

  const [activeTab, setActiveTab] = useState<QueueTab>('hiddenPosts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Action Dialog state
  const [selectedActionItem, setSelectedActionItem] = useState<{
    item: ModerationQueueItem;
    itemType: 'post' | 'comment';
  } | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await moderationApi.getModerationQueue();
      if (res && res.queue) {
        setQueue(res.queue);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleActionSuccess = (result: {
    actionId: string;
    actionType: string;
    message: string;
  }) => {
    if (!selectedActionItem) return;
    const removedId = selectedActionItem.item.id;

    // Remove the moderated item from all lists
    setQueue((prev) => ({
      hiddenPosts: prev.hiddenPosts.filter((i) => i.id !== removedId),
      hiddenComments: prev.hiddenComments.filter((i) => i.id !== removedId),
      reportedPosts: prev.reportedPosts.filter((i) => i.id !== removedId),
      reportedComments: prev.reportedComments.filter((i) => i.id !== removedId),
    }));

    setFeedback(result.message || `Action ${result.actionType} executed successfully.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const getItemsForCurrentTab = (): ModerationQueueItem[] => {
    return queue[activeTab] || [];
  };

  const currentItemType: 'post' | 'comment' =
    activeTab === 'hiddenPosts' || activeTab === 'reportedPosts' ? 'post' : 'comment';

  const totalPending =
    queue.hiddenPosts.length +
    queue.hiddenComments.length +
    queue.reportedPosts.length +
    queue.reportedComments.length;

  return (
    <div className="space-y-6" data-testid="moderation-page">
      {/* 1. Persistent Crisis Resource Banner */}
      <CrisisResourceBanner />

      {/* 2. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Community Integrity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Moderator Safety Queue
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Review reported items and auto-hidden community content (&ge;3 reports). Authorized
            moderator actions are strictly validated and logged by the authoritative backend.
          </p>
        </div>

        <button
          type="button"
          data-testid="refresh-queue-btn"
          onClick={fetchQueue}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({totalPending})</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          data-testid="moderation-feedback-banner"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          data-testid="queue-error-alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchQueue}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Hidden Posts (&ge;3)</span>
          </div>
          <div
            data-testid="hidden-posts-metric"
            className="text-2xl font-black text-slate-900 mt-1"
          >
            {queue.hiddenPosts.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Hidden Comments (&ge;3)</span>
          </div>
          <div
            data-testid="hidden-comments-metric"
            className="text-2xl font-black text-slate-900 mt-1"
          >
            {queue.hiddenComments.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Reported Posts</span>
          </div>
          <div
            data-testid="reported-posts-metric"
            className="text-2xl font-black text-slate-900 mt-1"
          >
            {queue.reportedPosts.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Reported Comments</span>
          </div>
          <div
            data-testid="reported-comments-metric"
            className="text-2xl font-black text-slate-900 mt-1"
          >
            {queue.reportedComments.length}
          </div>
        </div>
      </div>

      {/* 4. Queue Filter Tabs */}
      <div
        role="tablist"
        aria-label="Moderation Queue Categories"
        className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hiddenPosts'}
          data-testid="tab-hidden-posts"
          onClick={() => setActiveTab('hiddenPosts')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
            activeTab === 'hiddenPosts'
              ? 'bg-purple-700 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Hidden Posts ({queue.hiddenPosts.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hiddenComments'}
          data-testid="tab-hidden-comments"
          onClick={() => setActiveTab('hiddenComments')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
            activeTab === 'hiddenComments'
              ? 'bg-purple-700 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Hidden Comments ({queue.hiddenComments.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reportedPosts'}
          data-testid="tab-reported-posts"
          onClick={() => setActiveTab('reportedPosts')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
            activeTab === 'reportedPosts'
              ? 'bg-purple-700 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Reported Posts ({queue.reportedPosts.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reportedComments'}
          data-testid="tab-reported-comments"
          onClick={() => setActiveTab('reportedComments')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
            activeTab === 'reportedComments'
              ? 'bg-purple-700 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Reported Comments ({queue.reportedComments.length})
        </button>
      </div>

      {/* 5. Items Feed */}
      {isLoading ? (
        <div
          data-testid="queue-loading-state"
          className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
          <p className="text-sm font-medium">Fetching safety queue items...</p>
        </div>
      ) : getItemsForCurrentTab().length === 0 ? (
        <div
          data-testid="queue-empty-state"
          className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">All clear in this section!</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no items pending moderator review in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="queue-items-container">
          {getItemsForCurrentTab().map((item) => (
            <ModerationItemCard
              key={item.id}
              item={item}
              itemType={currentItemType}
              onTakeAction={(selectedItem, itemType) =>
                setSelectedActionItem({ item: selectedItem, itemType })
              }
            />
          ))}
        </div>
      )}

      {/* 6. Action Execution Dialog */}
      {selectedActionItem && (
        <ModerationActionDialog
          isOpen={!!selectedActionItem}
          item={selectedActionItem.item}
          itemType={selectedActionItem.itemType}
          onClose={() => setSelectedActionItem(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};
