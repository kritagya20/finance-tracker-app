import React from 'react';
import { Eye, EyeOff, Bell } from 'lucide-react';

interface TopHeaderProps {
  userName?: string;
  hideBalances: boolean;
  onToggleHideBalances: () => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  unreadCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  userName = 'User',
  hideBalances,
  onToggleHideBalances,
  onProfileClick,
  onNotificationsClick,
  unreadCount = 0,
}) => {
  return (
    <header className="flex h-14 items-center justify-between">
      <button
        type="button"
        onClick={onProfileClick}
        className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 active:scale-[0.98]"
        title="View financial profile & settings"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-semibold text-white shadow-md shadow-violet-900/30">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium text-theme-muted leading-none">Namaste,</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-theme-primary leading-none truncate max-w-[170px]">
            {userName}
          </h1>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleHideBalances}
          aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
          className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary transition-all hover:bg-theme-card-hover active:scale-[0.92] duration-100 shadow-sm"
        >
          {hideBalances ? (
            <EyeOff className="size-5 text-theme-muted" />
          ) : (
            <Eye className="size-5 text-theme-secondary" />
          )}
        </button>

        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          className="relative flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary transition-all hover:bg-theme-card-hover active:scale-[0.92] duration-100 shadow-sm"
        >
          <Bell className="size-5 text-theme-secondary" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-theme-app">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
};
