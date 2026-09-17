import React from 'react';
import { Eye, EyeOff, Bell } from 'lucide-react';

interface TopHeaderProps {
  userName?: string;
  hideBalances: boolean;
  onToggleHideBalances: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  userName = 'User',
  hideBalances,
  onToggleHideBalances,
}) => {
  return (
    <header className="flex items-center justify-between pt-2 pb-1">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-semibold text-white shadow-md shadow-violet-900/30">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-xs text-slate-400">Namaste,</p>
          <p className="text-base font-semibold text-slate-100">{userName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleHideBalances}
          aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 transition-all hover:bg-slate-800 active:scale-95"
        >
          {hideBalances ? (
            <EyeOff className="size-5 text-slate-400" />
          ) : (
            <Eye className="size-5 text-slate-300" />
          )}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 transition-all hover:bg-slate-800 active:scale-95"
        >
          <Bell className="size-5 text-slate-300" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
        </button>
      </div>
    </header>
  );
};
