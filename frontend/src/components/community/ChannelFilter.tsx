import React from 'react';
import type { ChannelInfo, CommunityChannelId } from '../../types/community.types';

interface ChannelFilterProps {
  channels: ChannelInfo[];
  selectedChannel: CommunityChannelId | 'ALL';
  onSelect: (channelId: CommunityChannelId | 'ALL') => void;
  disabled?: boolean;
}

export const ChannelFilter: React.FC<ChannelFilterProps> = ({
  channels,
  selectedChannel,
  onSelect,
  disabled = false,
}) => {
  const allTabs: { id: CommunityChannelId | 'ALL'; name: string }[] = [
    { id: 'ALL', name: 'All Topics' },
    ...channels,
  ];

  return (
    <div
      role="tablist"
      aria-label="Community Topic Channels"
      className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar"
    >
      {allTabs.map((tab) => {
        const isSelected = selectedChannel === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={disabled}
            data-testid={`channel-tab-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 ${
              isSelected
                ? 'bg-brand-600 text-white shadow-sm font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-slate-900'
            }`}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
};
