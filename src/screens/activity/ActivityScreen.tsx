import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
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
import { SwipeableTransactionItem } from './SwipeableTransactionItem';
import { Dropdown } from '../../components/ui/Dropdown';
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

  // Total income in filtered set
  const totalIncome = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'INCOME')
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

  // Static option sets for filter dropdowns
  const TYPE_OPTIONS = [
    { label: 'All Types', value: 'ALL' },
    { label: 'Debit (Expenses)', value: 'EXPENSE' },
    { label: 'Credit (Income)', value: 'INCOME' },
    { label: 'Transfer', value: 'TRANSFER' },
  ];

  const DATE_OPTIONS = [
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
    { label: 'All Time', value: 'ALL' },
  ];

  const SOURCE_OPTIONS = [
    { label: 'All Sources', value: 'ALL' },
    { label: 'Source: Auto-SMS', value: 'AUTO_SMS' },
    { label: 'Source: Manual', value: 'MANUAL' },
  ];

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

  const categoryOptions = useMemo(
    () => [
      { label: 'All Categories', value: 'ALL' },
      ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categories]
  );

  const isIncomeView = typeFilter === 'INCOME';
  const displayTotal = isIncomeView ? totalIncome : totalSpent;
  const displayLabel = isIncomeView ? 'Total Income' : 'Total Spent';

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

        {/* Clean Single-Row Filter Chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Dropdown
            label={typeLabel}
            options={TYPE_OPTIONS}
            selectedValue={typeFilter}
            onSelect={(val) => setTypeFilter(val as TypeFilter)}
            isActive={typeFilter !== 'ALL'}
            isOpen={activeDropdown === 'type'}
            onOpenChange={(open) => setActiveDropdown(open ? 'type' : null)}
            align="left"
            ariaLabel="Filter by transaction type"
          />

          <Dropdown
            label={dateLabel}
            options={DATE_OPTIONS}
            selectedValue={dateFilter}
            onSelect={(val) => setDateFilter(val as DateFilter)}
            isActive={dateFilter !== 'ALL'}
            isOpen={activeDropdown === 'date'}
            onOpenChange={(open) => setActiveDropdown(open ? 'date' : null)}
            align="left"
            ariaLabel="Filter by date range"
          />

          <Dropdown
            label={sourceLabel}
            options={SOURCE_OPTIONS}
            selectedValue={sourceFilter}
            onSelect={(val) => setSourceFilter(val as SourceFilter)}
            isActive={sourceFilter !== 'ALL'}
            isOpen={activeDropdown === 'source'}
            onOpenChange={(open) => setActiveDropdown(open ? 'source' : null)}
            align="right"
            ariaLabel="Filter by source"
          />

          <Dropdown
            label={categoryLabel}
            options={categoryOptions}
            selectedValue={categoryFilter}
            onSelect={(val) => setCategoryFilter(val)}
            isActive={categoryFilter !== 'ALL'}
            isOpen={activeDropdown === 'category'}
            onOpenChange={(open) => setActiveDropdown(open ? 'category' : null)}
            align="right"
            ariaLabel="Filter by category"
          />
        </div>
      </div>

      {/* Enhanced Activity Summary & Gesture Card */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          {/* Left: Transaction Count Metric */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15 text-violet-400">
              <Receipt className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Transactions
              </span>
              <span className="text-sm font-bold text-zinc-100 tabular-nums">
                {filtered.length}{' '}
                <span className="text-xs font-normal text-zinc-400">
                  {filtered.length === 1 ? 'record' : 'records'}
                </span>
              </span>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-white/10" />

          {/* Right: Total Amount Metric */}
          <div className="flex items-center gap-2.5 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {displayLabel}
              </span>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isIncomeView ? 'text-emerald-400' : 'text-zinc-100'
                )}
              >
                {hideBalances ? '••••••' : formatCurrency(displayTotal)}
              </span>
            </div>
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl border',
                isIncomeView
                  ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/15 text-rose-400'
              )}
            >
              {isIncomeView ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </div>
          </div>
        </div>

        {/* Integrated Gesture Hint Footer */}
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-white/5 pt-2.5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded bg-blue-500/20 text-blue-300">
              <ArrowLeftRight className="size-2.5" />
            </span>
            Swipe right to edit
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="flex items-center gap-1.5">
            Swipe left to delete
            <span className="flex size-4 items-center justify-center rounded bg-rose-500/20 text-rose-300">
              <ArrowLeftRight className="size-2.5" />
            </span>
          </span>
        </div>
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
                      id: 'cat_general',
                      name: 'General',
                      iconName: 'CircleDollarSign',
                      colorHex: '#94a3b8',
                      bgClass: 'bg-zinc-800 text-zinc-400',
                      textClass: 'text-zinc-400',
                    };

                    const IconComp = ICON_MAP[category.iconName] || CircleDollarSign;

                    return (
                      <SwipeableTransactionItem
                        key={tx.id}
                        tx={tx}
                        category={category}
                        iconComp={IconComp}
                        hideBalances={hideBalances}
                        onDelete={onDeleteTransaction}
                        onEdit={(t) => {
                          console.log('Edit transaction:', t);
                        }}
                      />
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
