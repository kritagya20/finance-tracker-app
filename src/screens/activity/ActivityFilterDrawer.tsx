import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, RotateCcw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ActivityFilterState, Category, DatePreset } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { INITIAL_FILTER_STATE } from '../../domain/engine/filterEngine';
import { cn } from '../../lib/utils';

interface ActivityFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: ActivityFilterState;
  categories: Category[];
  totalMatches: number;
  onApply: (filter: ActivityFilterState) => void;
}

export const ActivityFilterDrawer: React.FC<ActivityFilterDrawerProps> = ({
  isOpen,
  onClose,
  currentFilter,
  categories,
  totalMatches,
  onApply,
}) => {
  const [draft, setDraft] = useState<ActivityFilterState>(currentFilter);

  useEffect(() => {
    if (isOpen) {
      setDraft(currentFilter);
    }
  }, [isOpen, currentFilter]);

  if (!isOpen) return null;

  const handleToggleCategory = (catId: string) => {
    setDraft((prev) => {
      const exists = prev.categoryIds.includes(catId);
      const next = exists
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: next };
    });
  };

  const handleReset = () => {
    setDraft(INITIAL_FILTER_STATE);
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const datePresets: { label: string; value: DatePreset }[] = [
    { label: 'All Time', value: 'ALL' },
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
    { label: 'Custom Range', value: 'CUSTOM' },
  ];

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[390px] flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-h-[90dvh] flex-col rounded-t-3xl border-t border-white/10 bg-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="relative shrink-0 px-4 pt-3 pb-2 border-b border-white/5">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-700" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Filter Transactions</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
          {/* 1. Transaction Type (Debit vs Credit) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: 'ALL' })}
                className={cn(
                  'rounded-xl py-2.5 text-xs font-medium transition-all border',
                  draft.type === 'ALL'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/40'
                    : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
                )}
              >
                All Types
              </button>

              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: 'EXPENSE' })}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all border',
                  draft.type === 'EXPENSE'
                    ? 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-900/40'
                    : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
                )}
              >
                <ArrowUpRight className="size-3.5 text-rose-300" />
                <span>Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: 'INCOME' })}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-all border',
                  draft.type === 'INCOME'
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-900/40'
                    : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
                )}
              >
                <ArrowDownLeft className="size-3.5 text-emerald-300" />
                <span>Credit</span>
              </button>
            </div>
          </div>

          {/* 2. Date-Wise Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date Period
              </label>
              <Calendar className="size-3.5 text-slate-500" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {datePresets.map((p) => {
                const isActive = draft.datePreset === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, datePreset: p.value })}
                    className={cn(
                      'rounded-xl px-3 py-2 text-xs font-medium transition-colors border',
                      isActive
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            {draft.datePreset === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={draft.startDate || ''}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-slate-800/60 p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">End Date</label>
                  <input
                    type="date"
                    value={draft.endDate || ''}
                    onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-white/10 bg-slate-800/60 p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Categories (Multi-select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Categories
              </label>
              {draft.categoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, categoryIds: [] })}
                  className="text-[11px] text-violet-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = draft.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all border',
                      isSelected
                        ? 'bg-slate-800 border-violet-400 text-white ring-1 ring-violet-400'
                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <CategoryIcon name={cat.iconName} size={14} />
                    <span>{cat.name}</span>
                    {isSelected && <Check className="size-3 text-violet-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ingestion Source */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ALL', 'AUTO_SMS', 'MANUAL'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft({ ...draft, source: s })}
                  className={cn(
                    'rounded-xl py-2 text-xs font-medium transition-all border capitalize',
                    draft.source === s
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  {s === 'AUTO_SMS' ? 'Auto-SMS' : s.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 border-t border-white/5 flex gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-white/10 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-750 active:scale-95 transition-all"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 active:scale-[0.98] transition-transform"
          >
            Apply Filters ({totalMatches})
          </button>
        </div>
      </div>
    </div>
  );
};
