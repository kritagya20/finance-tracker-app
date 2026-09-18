import React from 'react';
import { Plus, Activity, ChartColumn, User } from 'lucide-react';
import { NavTab } from '../../components/layout/BottomNav';

interface QuickActionsProps {
  onOpenAddModal: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenAddModal,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        type="button"
        onClick={onOpenAddModal}
        className="flex flex-col items-center gap-2 rounded-2xl py-1 transition-transform duration-150 active:scale-[0.93]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-900/40">
          <Plus className="size-6" />
        </span>
        <span className="text-[11px] font-medium text-theme-secondary">Add</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('activity')}
        className="flex flex-col items-center gap-2 rounded-2xl py-1 transition-transform duration-150 active:scale-[0.93]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-theme-card-subtle text-theme-primary border border-theme-border shadow-sm">
          <Activity className="size-6" />
        </span>
        <span className="text-[11px] font-medium text-theme-secondary">Activity</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('analytics')}
        className="flex flex-col items-center gap-2 rounded-2xl py-1 transition-transform duration-150 active:scale-[0.93]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-theme-card-subtle text-theme-primary border border-theme-border shadow-sm">
          <ChartColumn className="size-6" />
        </span>
        <span className="text-[11px] font-medium text-theme-secondary">Analytics</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('profile')}
        className="flex flex-col items-center gap-2 rounded-2xl py-1 transition-transform duration-150 active:scale-[0.93]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-theme-card-subtle text-theme-primary border border-theme-border shadow-sm">
          <User className="size-6" />
        </span>
        <span className="text-[11px] font-medium text-theme-secondary">Profile</span>
      </button>
    </div>
  );
};
