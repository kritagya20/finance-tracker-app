import React from 'react';
import { House, Activity, Plus, ChartColumn, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export type NavTab = 'home' | 'activity' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[390px] border-t border-white/10 bg-slate-950/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)] pt-2">
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
            activeTab === 'home' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <House className="size-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('activity')}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
            activeTab === 'activity' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Activity className="size-5" />
          <span className="text-[10px] font-medium">Activity</span>
        </button>

        {/* Floating Raised Add Button */}
        <div className="relative -mt-8">
          <button
            type="button"
            onClick={onOpenAddModal}
            aria-label="Add transaction"
            className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-xl shadow-violet-900/50 ring-4 ring-slate-950 transition-transform active:scale-95"
          >
            <Plus className="size-7" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onTabChange('analytics')}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
            activeTab === 'analytics' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <ChartColumn className="size-5" />
          <span className="text-[10px] font-medium">Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
            activeTab === 'settings' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Settings className="size-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
      <div className="h-1" />
    </nav>
  );
};
