import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  key: string;
  label: string;
  badge?: string | number;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  size = 'md',
  className,
}) => {
  const isSm = size === 'sm';

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn(
        'flex rounded-2xl bg-theme-card-subtle p-1 border border-theme-border select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200 outline-none',
              isSm ? 'py-1.5 text-xs min-h-[36px]' : 'py-2.5 text-sm min-h-[44px]',
              isActive
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover/40'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-none font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-theme-card text-theme-muted'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
