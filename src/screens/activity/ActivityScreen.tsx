import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Check,
  Coffee,
  Car,
  Box,
  DollarSign,
  Receipt,
  Briefcase,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';
import { Transaction, Category } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

// Icon Map matching exact visual icons from live reference
const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed: Coffee,
  ShoppingCart: Box,
  Fuel: Car,
  Receipt: Receipt,
  Film: Box,
  ShoppingBag: Box,
  Briefcase: Briefcase,
  DollarSign: DollarSign,
  CircleDollarSign: CircleDollarSign,
};

interface ActivityScreenProps {
  transactions: Transaction[];
  categories: Category[];
  hideBalances: boolean;
  onDeleteTransaction: (id: string) => void;
}

type TypeFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';
type DateFilter = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'ALL';
type SourceFilter = 'ALL' | 'AUTO_SMS' | 'MANUAL';

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  transactions,
  categories,
  hideBalances,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('THIS_MONTH');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('AUTO_SMS');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Active Dropdown Popover
  const [activeDropdown, setActiveDropdown] = useState<'type' | 'date' | 'source' | 'category' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Swipe offset state per transaction item { [txId]: number }
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered transactions
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return transactions.filter((tx) => {
      // Search
      if (q) {
        const matchMerchant = tx.merchantName.toLowerCase().includes(q);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchMerchant && !matchNotes) return false;
      }

      // Type
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Source
      if (sourceFilter !== 'ALL' && tx.source !== sourceFilter) return false;

      // Category
      if (categoryFilter !== 'ALL' && tx.categoryId !== categoryFilter) return false;

      // Date
      const txDate = new Date(tx.date);
      if (dateFilter === 'THIS_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'LAST_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < thirtyDaysAgo || txDate > now) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, dateFilter, sourceFilter, categoryFilter]);

  // Total spent in filtered set
  const totalSpent = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filtered]);

  // Group transactions by date section
  const groupedSections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today.getTime() - 86400000);

    const groups: { title: string; items: Transaction[]; totalSpent: number }[] = [];
    const map = new Map<string, { title: string; items: Transaction[]; totalSpent: number }>();

    filtered.forEach((tx) => {
      const d = new Date(tx.date);
      d.setHours(0, 0, 0, 0);

      let groupKey: string;
      let groupTitle: string;

      if (d.getTime() === today.getTime()) {
        groupKey = 'today';
        groupTitle = 'Today';
      } else if (d.getTime() === yesterday.getTime()) {
        groupKey = 'yesterday';
        groupTitle = 'Yesterday';
      } else {
        groupKey = d.toISOString();
        groupTitle = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, { title: groupTitle, items: [], totalSpent: 0 });
      }

      const grp = map.get(groupKey)!;
      grp.items.push(tx);
      if (tx.type === 'EXPENSE') {
        grp.totalSpent += tx.amount;
      }
    });

    map.forEach((val) => groups.push(val));
    return groups;
  }, [filtered]);

  // Touch handlers for swipe gesture
  const handleTouchStart = (_txId: string, clientX: number) => {
    touchStartX.current = clientX;
  };

  const handleTouchMove = (txId: string, clientX: number) => {
    if (touchStartX.current === null) return;
    const diff = clientX - touchStartX.current;
    // Limit swipe offset between -80px (delete) and +80px (edit)
    const clamped = Math.max(-80, Math.min(80, diff));
    setSwipeOffsets((prev) => ({ ...prev, [txId]: clamped }));
  };

  const handleTouchEnd = (txId: string) => {
    touchStartX.current = null;
    const current = swipeOffsets[txId] || 0;
    if (current > 40) {
      setSwipeOffsets((prev) => ({ ...prev, [txId]: 76 }));
    } else if (current < -40) {
      setSwipeOffsets((prev) => ({ ...prev, [txId]: -76 }));
    } else {
      setSwipeOffsets((prev) => ({ ...prev, [txId]: 0 }));
    }
  };

  // Human readable labels
  const typeLabel =
    typeFilter === 'EXPENSE'
      ? 'Type: Debit'
      : typeFilter === 'INCOME'
      ? 'Type: Credit'
      : typeFilter === 'TRANSFER'
      ? 'Type: Transfer'
      : 'All Types';

  const dateLabel =
    dateFilter === 'THIS_MONTH'
      ? 'This Month'
      : dateFilter === 'LAST_MONTH'
      ? 'Last Month'
      : dateFilter === 'LAST_30_DAYS'
      ? 'Last 30 Days'
      : 'All Time';

  const sourceLabel =
    sourceFilter === 'AUTO_SMS'
      ? 'Source: Auto-SMS'
      : sourceFilter === 'MANUAL'
      ? 'Source: Manual'
      : 'All Sources';

  const categoryLabel =
    categoryFilter === 'ALL'
      ? 'Category'
      : categories.find((c) => c.id === categoryFilter)?.name || 'Category';

  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Activity</h1>
        <button
          type="button"
          aria-label="Export as CSV"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-300 transition-colors active:bg-zinc-800"
        >
          <Download className="size-5" />
        </button>
      </header>

      {/* Search Bar & Horizontal Filters */}
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            inputMode="search"
            placeholder="Search merchant, category, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
          />
        </div>

        {/* Clean Single-Row Filter Chips (Matching Screenshot Exactly) */}
        <div className="relative" ref={dropdownRef}>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 1. All Types Pill */}
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                typeFilter !== 'ALL'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 active:bg-zinc-800'
              )}
            >
              <span>{typeLabel}</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>

            {/* 2. This Month Pill */}
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                dateFilter !== 'ALL'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 active:bg-zinc-800'
              )}
            >
              <span>{dateLabel}</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>

            {/* 3. Source Pill */}
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'source' ? null : 'source')}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                sourceFilter !== 'ALL'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 active:bg-zinc-800'
              )}
            >
              <span>{sourceLabel}</span>
              {sourceFilter === 'ALL' && <ChevronDown className="size-3.5 opacity-70" />}
            </button>

            {/* 4. Category Pill */}
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter !== 'ALL'
                  ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-300 active:bg-zinc-800'
              )}
            >
              <span>{categoryLabel}</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>
          </div>

          {/* Sleek Popover Menu for Active Filter */}
          {activeDropdown && (
            <div className="absolute left-0 top-11 z-30 w-56 rounded-2xl border border-white/10 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {activeDropdown === 'type' && (
                <div className="flex flex-col gap-0.5 text-xs font-medium text-zinc-300">
                  {[
                    { label: 'All Types', val: 'ALL' },
                    { label: 'Debit (Expenses)', val: 'EXPENSE' },
                    { label: 'Credit (Income)', val: 'INCOME' },
                    { label: 'Transfer', val: 'TRANSFER' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setTypeFilter(opt.val as TypeFilter);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors',
                        typeFilter === opt.val
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      <span>{opt.label}</span>
                      {typeFilter === opt.val && <Check className="size-3.5 text-violet-400" />}
                    </button>
                  ))}
                </div>
              )}

              {activeDropdown === 'date' && (
                <div className="flex flex-col gap-0.5 text-xs font-medium text-zinc-300">
                  {[
                    { label: 'This Month', val: 'THIS_MONTH' },
                    { label: 'Last Month', val: 'LAST_MONTH' },
                    { label: 'Last 30 Days', val: 'LAST_30_DAYS' },
                    { label: 'All Time', val: 'ALL' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setDateFilter(opt.val as DateFilter);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors',
                        dateFilter === opt.val
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      <span>{opt.label}</span>
                      {dateFilter === opt.val && <Check className="size-3.5 text-violet-400" />}
                    </button>
                  ))}
                </div>
              )}

              {activeDropdown === 'source' && (
                <div className="flex flex-col gap-0.5 text-xs font-medium text-zinc-300">
                  {[
                    { label: 'Source: Auto-SMS', val: 'AUTO_SMS' },
                    { label: 'Source: Manual', val: 'MANUAL' },
                    { label: 'All Sources', val: 'ALL' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setSourceFilter(opt.val as SourceFilter);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors',
                        sourceFilter === opt.val
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      <span>{opt.label}</span>
                      {sourceFilter === opt.val && <Check className="size-3.5 text-violet-400" />}
                    </button>
                  ))}
                </div>
              )}

              {activeDropdown === 'category' && (
                <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto text-xs font-medium text-zinc-300 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('ALL');
                      setActiveDropdown(null);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors',
                      categoryFilter === 'ALL'
                        ? 'bg-violet-600/20 text-violet-300'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    )}
                  >
                    <span>All Categories</span>
                    {categoryFilter === 'ALL' && <Check className="size-3.5 text-violet-400" />}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors',
                        categoryFilter === cat.id
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      <span>{cat.name}</span>
                      {categoryFilter === cat.id && <Check className="size-3.5 text-violet-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subtle Transaction Count & Total Spent */}
      <p className="pt-2 text-xs text-zinc-500">
        Showing <span className="font-medium text-zinc-300">{filtered.length} transactions</span> • Total spent{' '}
        <span className="font-medium text-zinc-300">
          {hideBalances ? '••••••' : formatCurrency(totalSpent)}
        </span>
      </p>

      {/* Swipe Hint Banner */}
      <div className="mt-1 flex items-center justify-center gap-4 rounded-xl border border-white/5 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-blue-500/20 text-blue-300">
            <ArrowLeftRight className="size-3" />
          </span>
          Swipe right to edit
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5">
          Swipe left to delete
          <span className="flex size-5 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
            <ArrowLeftRight className="size-3" />
          </span>
        </span>
      </div>

      {/* Grouped Transaction Lists */}
      <div className="flex flex-col gap-5 pt-1">
        {groupedSections.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            No transactions match your search.
          </div>
        ) : (
          groupedSections.map((group) => {
            const groupHeader =
              group.totalSpent > 0
                ? `${group.title} • ${hideBalances ? '••••' : formatCurrency(group.totalSpent)}`
                : group.title;

            return (
              <section key={group.title}>
                <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {groupHeader}
                </h2>

                <ul className="flex flex-col gap-2">
                  {group.items.map((tx) => {
                    const category = categories.find((c) => c.id === tx.categoryId) || {
                      name: 'General',
                      iconName: 'CircleDollarSign',
                      bgClass: 'bg-zinc-800 text-zinc-400',
                      textClass: 'text-zinc-400',
                    };

                    const IconComp = ICON_MAP[category.iconName] || CircleDollarSign;
                    const isIncome = tx.type === 'INCOME';
                    const offset = swipeOffsets[tx.id] || 0;

                    const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <li key={tx.id} className="relative overflow-hidden rounded-2xl">
                        {/* Action Reveal Background: Edit on Left */}
                        <div className="absolute inset-y-0 left-0 flex w-[76px] items-center justify-center bg-blue-500/20">
                          <button
                            type="button"
                            aria-label={`Edit ${tx.merchantName}`}
                            className="flex flex-col items-center gap-1 text-blue-300"
                          >
                            <Pencil className="size-5" />
                            <span className="text-[10px] font-medium">Edit</span>
                          </button>
                        </div>

                        {/* Action Reveal Background: Delete on Right */}
                        <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-rose-500/20">
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            aria-label={`Delete ${tx.merchantName}`}
                            className="flex flex-col items-center gap-1 text-rose-300"
                          >
                            <Trash2 className="size-5" />
                            <span className="text-[10px] font-medium">Delete</span>
                          </button>
                        </div>

                        {/* Draggable Card Surface */}
                        <div
                          style={{ transform: `translateX(${offset}px)` }}
                          onTouchStart={(e) => handleTouchStart(tx.id, e.touches[0].clientX)}
                          onTouchMove={(e) => handleTouchMove(tx.id, e.touches[0].clientX)}
                          onTouchEnd={() => handleTouchEnd(tx.id)}
                          onMouseDown={(e) => handleTouchStart(tx.id, e.clientX)}
                          onMouseMove={(e) => {
                            if (touchStartX.current !== null) {
                              handleTouchMove(tx.id, e.clientX);
                            }
                          }}
                          onMouseUp={() => handleTouchEnd(tx.id)}
                          onMouseLeave={() => {
                            if (touchStartX.current !== null) {
                              handleTouchEnd(tx.id);
                            }
                          }}
                          className="relative flex touch-pan-y cursor-grab items-center gap-3 border border-white/10 bg-zinc-900 p-3 transition-transform duration-200 active:cursor-grabbing"
                        >
                          {/* Category Circle Icon */}
                          <span
                            className={cn(
                              'flex size-11 shrink-0 items-center justify-center rounded-full',
                              category.bgClass,
                              category.textClass
                            )}
                          >
                            <IconComp className="size-5" />
                          </span>

                          {/* Merchant & Metadata */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-100">
                              {tx.merchantName}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="truncate text-[11px] text-zinc-500">
                                {category.name}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  tx.source === 'AUTO_SMS'
                                    ? 'bg-violet-500/15 text-violet-300'
                                    : 'bg-zinc-800 text-zinc-400'
                                )}
                              >
                                {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
                              </span>
                              {tx.notes && tx.notes.includes('items') && (
                                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                                  2 items
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount & Time */}
                          <div className="shrink-0 text-right">
                            <p
                              className={cn(
                                'text-sm font-semibold tabular-nums',
                                isIncome ? 'text-emerald-400' : 'text-zinc-200'
                              )}
                            >
                              {hideBalances
                                ? '••••••'
                                : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">{timeStr}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
