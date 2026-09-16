import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  SlidersHorizontal,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Transaction, Category, ActivityFilterState } from '../../domain/models/types';
import { getCategoryById } from '../../domain/engine/categories';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { ActivityFilterDrawer } from './ActivityFilterDrawer';
import {
  INITIAL_FILTER_STATE,
  filterTransactions,
  getActiveFilterCount,
} from '../../domain/engine/filterEngine';
import { cn } from '../../lib/utils';

interface ActivityScreenProps {
  transactions: Transaction[];
  categories: Category[];
  hideBalances: boolean;
  onDeleteTransaction: (id: string) => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  transactions,
  categories,
  hideBalances,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<ActivityFilterState>(INITIAL_FILTER_STATE);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Apply filters via pure engine
  const filtered = useMemo(() => {
    return filterTransactions(transactions, filterState, searchQuery);
  }, [transactions, filterState, searchQuery]);

  // Aggregate stats for filtered result
  const { totalDebited, totalCredited } = useMemo(() => {
    let debited = 0;
    let credited = 0;
    for (const t of filtered) {
      if (t.type === 'EXPENSE') debited += t.amount;
      else if (t.type === 'INCOME') credited += t.amount;
    }
    return { totalDebited: debited, totalCredited: credited };
  }, [filtered]);

  const activeFilterCount = useMemo(() => {
    return getActiveFilterCount(filterState);
  }, [filterState]);

  // Fast Tier-1 Date Cycle
  const handleQuickDateCycle = () => {
    setFilterState((prev) => {
      const order: ActivityFilterState['datePreset'][] = [
        'ALL',
        'THIS_MONTH',
        'LAST_MONTH',
        'LAST_30_DAYS',
      ];
      const nextIdx = (order.indexOf(prev.datePreset) + 1) % order.length;
      return { ...prev, datePreset: order[nextIdx] };
    });
  };

  const getDatePresetLabel = (preset: ActivityFilterState['datePreset']) => {
    switch (preset) {
      case 'THIS_MONTH':
        return 'This Month';
      case 'LAST_MONTH':
        return 'Last Month';
      case 'LAST_30_DAYS':
        return 'Last 30 Days';
      case 'CUSTOM':
        return 'Custom Date';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Activity</h1>
        <button
          type="button"
          aria-label="Export CSV"
          className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-400 hover:text-white"
        >
          <Download className="size-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 size-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search merchant, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      {/* Tier-1 Instant Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {/* Type Segment: All / Debit / Credit */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setFilterState((prev) => ({ ...prev, type: 'ALL' }))}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
              filterState.type === 'ALL'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterState((prev) => ({ ...prev, type: 'EXPENSE' }))}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
              filterState.type === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <ArrowUpRight className="size-3" />
            <span>Debit</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterState((prev) => ({ ...prev, type: 'INCOME' }))}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
              filterState.type === 'INCOME'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <ArrowDownLeft className="size-3" />
            <span>Credit</span>
          </button>
        </div>

        {/* Quick Date Chip */}
        <button
          type="button"
          onClick={handleQuickDateCycle}
          className={cn(
            'flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium shrink-0 transition-colors',
            filterState.datePreset !== 'ALL'
              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
          )}
        >
          <span>{getDatePresetLabel(filterState.datePreset)}</span>
          <span className="text-[10px] text-slate-500">▾</span>
        </button>

        {/* Filter Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shrink-0 transition-all ml-auto',
            activeFilterCount > 0
              ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/30'
              : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-800'
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-violet-700">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Badges Row (Dismissible) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filterState.type !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
              {filterState.type === 'EXPENSE' ? 'Debited' : 'Credited'}
              <button
                type="button"
                onClick={() => setFilterState((p) => ({ ...p, type: 'ALL' }))}
              >
                <X className="size-3 text-slate-400 hover:text-white" />
              </button>
            </span>
          )}

          {filterState.datePreset !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
              {getDatePresetLabel(filterState.datePreset)}
              <button
                type="button"
                onClick={() => setFilterState((p) => ({ ...p, datePreset: 'ALL' }))}
              >
                <X className="size-3 text-violet-400 hover:text-white" />
              </button>
            </span>
          )}

          {filterState.categoryIds.map((catId) => {
            const cat = getCategoryById(catId);
            return (
              <span
                key={catId}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
              >
                {cat.name}
                <button
                  type="button"
                  onClick={() =>
                    setFilterState((p) => ({
                      ...p,
                      categoryIds: p.categoryIds.filter((id) => id !== catId),
                    }))
                  }
                >
                  <X className="size-3 text-slate-400 hover:text-white" />
                </button>
              </span>
            );
          })}

          {filterState.source !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
              {filterState.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
              <button
                type="button"
                onClick={() => setFilterState((p) => ({ ...p, source: 'ALL' }))}
              >
                <X className="size-3 text-slate-400 hover:text-white" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => setFilterState(INITIAL_FILTER_STATE)}
            className="text-[11px] text-violet-400 hover:underline px-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Cashflow Summary Pill */}
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/90 px-3.5 py-2 text-xs">
        <span className="text-slate-400">{filtered.length} transactions</span>
        <div className="flex items-center gap-3">
          {totalDebited > 0 && (
            <span className="text-rose-400 font-semibold tabular-nums">
              ↓ {hideBalances ? '••••' : formatCurrency(totalDebited)}
            </span>
          )}
          {totalCredited > 0 && (
            <span className="text-emerald-400 font-semibold tabular-nums">
              ↑ {hideBalances ? '••••' : formatCurrency(totalCredited)}
            </span>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <ul className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <li className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-900 border border-white/10 text-slate-500">
              <Filter className="size-5" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No matching transactions</p>
            <p className="text-xs text-slate-500 max-w-[220px]">
              Try clearing some filters or searching for another term.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterState(INITIAL_FILTER_STATE);
                setSearchQuery('');
              }}
              className="mt-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-slate-750"
            >
              Reset all filters
            </button>
          </li>
        ) : (
          filtered.map((tx) => {
            const category = getCategoryById(tx.categoryId);
            const isIncome = tx.type === 'INCOME';
            const dateFormatted = new Date(tx.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <li
                key={tx.id}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-3.5 transition-colors hover:bg-slate-850"
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full',
                    category.bgClass,
                    category.textClass
                  )}
                >
                  <CategoryIcon name={category.iconName} size={20} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {tx.merchantName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        tx.source === 'AUTO_SMS'
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
                    </span>
                    <span className="truncate text-[11px] text-slate-400">
                      {dateFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    )}
                  >
                    {hideBalances
                      ? '••••••'
                      : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-400 hover:underline transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Filter Bottom Sheet Drawer */}
      <ActivityFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        currentFilter={filterState}
        categories={categories}
        totalMatches={filtered.length}
        onApply={(newFilter) => setFilterState(newFilter)}
      />
    </div>
  );
};
