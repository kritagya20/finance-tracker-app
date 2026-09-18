import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { Transaction, Category, Account, DatePreset } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { TransactionItem } from '../../components/common/TransactionItem';
import { Dropdown } from '../../components/ui/Dropdown';
import { CalendarPicker, DateRange } from '../../components/common/CalendarPicker';
import { EditTransactionDrawer } from './EditTransactionDrawer';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { cn } from '../../lib/utils';

interface ActivityScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  hideBalances: boolean;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => Promise<unknown>;
  initialEditingTransaction?: Transaction | null;
  onClearInitialEditing?: () => void;
}

type TypeFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';
type DateFilter = DatePreset;
type SourceFilter = 'ALL' | 'AUTO_SMS' | 'MANUAL';

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  transactions,
  categories,
  accounts = [],
  hideBalances,
  onDeleteTransaction,
  onUpdateTransaction,
  initialEditingTransaction,
  onClearInitialEditing,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (initialEditingTransaction) {
      setEditingTransaction(initialEditingTransaction);
      onClearInitialEditing?.();
    }
  }, [initialEditingTransaction, onClearInitialEditing]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('THIS_MONTH');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
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

      // Date Filtering
      const txDate = new Date(tx.date);
      if (dateFilter === 'THIS_WEEK') {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'LAST_WEEK') {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        const startThis = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
        const start = new Date(startThis.getTime() - 7 * 24 * 60 * 60 * 1000);
        const end = new Date(startThis.getTime() - 1);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'LAST_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'LAST_60_DAYS') {
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        sixtyDaysAgo.setHours(0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (txDate < sixtyDaysAgo || txDate > endToday) return false;
      } else if (dateFilter === 'LAST_90_DAYS') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        ninetyDaysAgo.setHours(0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (txDate < ninetyDaysAgo || txDate > endToday) return false;
      } else if (dateFilter === 'THIS_YEAR') {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      } else if (dateFilter === 'CUSTOM' && customRange) {
        const [sy, sm, sd] = customRange.startDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        const [ey, em, ed] = customRange.endDate.split('-').map(Number);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        if (txDate < start || txDate > end) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, dateFilter, customRange, sourceFilter, categoryFilter]);

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
    { label: 'This Week', value: 'THIS_WEEK' },
    { label: 'Last Week', value: 'LAST_WEEK' },
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'Last 60 Days', value: 'LAST_60_DAYS' },
    { label: 'Last 90 Days', value: 'LAST_90_DAYS' },
    { label: 'This Year', value: 'THIS_YEAR' },
    { label: 'All Time', value: 'ALL' },
    { label: 'Custom Range...', value: 'CUSTOM' },
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
    dateFilter === 'CUSTOM' && customRange
      ? `${new Date(customRange.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(customRange.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : dateFilter === 'THIS_WEEK'
      ? 'This Week'
      : dateFilter === 'LAST_WEEK'
      ? 'Last Week'
      : dateFilter === 'THIS_MONTH'
      ? 'This Month'
      : dateFilter === 'LAST_MONTH'
      ? 'Last Month'
      : dateFilter === 'LAST_60_DAYS'
      ? 'Last 60 Days'
      : dateFilter === 'LAST_90_DAYS'
      ? 'Last 90 Days'
      : dateFilter === 'THIS_YEAR'
      ? 'This Year'
      : dateFilter === 'CUSTOM'
      ? 'Custom Range'
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

  const handleExportCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Type', 'Amount (INR)', 'Source', 'Notes'];
    const rows = filtered.map((tx) => [
      new Date(tx.date).toLocaleDateString('en-IN'),
      `"${tx.merchantName.replace(/"/g, '""')}"`,
      `"${categories.find((c) => c.id === tx.categoryId)?.name || 'Other'}"`,
      tx.type,
      (tx.amount / 100).toFixed(2),
      tx.source,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">Activity</h1>
        <button
          type="button"
          onClick={handleExportCSV}
          aria-label="Export as CSV"
          className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary transition-all hover:bg-theme-card-hover hover:text-theme-primary active:scale-[0.92] duration-100 shadow-sm"
        >
          <Download className="size-5" />
        </button>
      </header>

      {/* Search Bar & Horizontal Filters */}
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            inputMode="search"
            placeholder="Search merchant, category, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-xl border border-theme-border bg-theme-input pl-10 pr-4 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:border-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all outline-none"
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

          {/* Date Filter Dropdown */}
          <Dropdown
            label={dateLabel}
            options={DATE_OPTIONS}
            selectedValue={dateFilter}
            onSelect={(val) => {
              if (val === 'CUSTOM') {
                setShowCustomCalendar(true);
              } else {
                setDateFilter(val as DateFilter);
                setCustomRange(null);
              }
            }}
            isActive={dateFilter !== 'ALL'}
            isOpen={activeDropdown === 'date'}
            onOpenChange={(open) => setActiveDropdown(open ? 'date' : null)}
            align="auto"
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
      <div className="rounded-2xl border border-theme-border bg-theme-card p-3.5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          {/* Left: Transaction Count Metric */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15 text-violet-500 dark:text-violet-400">
              <Receipt className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
                Transactions
              </span>
              <span className="text-sm font-bold text-theme-primary tabular-nums">
                {filtered.length}{' '}
                <span className="text-xs font-normal text-theme-muted">
                  {filtered.length === 1 ? 'record' : 'records'}
                </span>
              </span>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-theme-border" />

          {/* Right: Total Amount Metric */}
          <div className="flex items-center gap-2.5 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
                {displayLabel}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold font-mono tabular-nums',
                  isIncomeView ? 'text-emerald-500 dark:text-emerald-400' : 'text-theme-primary'
                )}
              >
                {hideBalances ? '••••••' : formatCurrency(displayTotal)}
              </span>
            </div>
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl border',
                isIncomeView
                  ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/25 bg-rose-500/15 text-rose-500 dark:text-rose-400'
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
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-theme-divider pt-2.5 text-[11px] text-theme-muted">
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded bg-blue-500/15 text-blue-600 dark:text-blue-300">
              <ArrowLeftRight className="size-2.5" />
            </span>
            Swipe right to edit
          </span>
          <span className="h-3 w-px bg-theme-border" />
          <span className="flex items-center gap-1.5">
            Swipe left to delete
            <span className="flex size-4 items-center justify-center rounded bg-rose-500/15 text-rose-600 dark:text-rose-300">
              <ArrowLeftRight className="size-2.5" />
            </span>
          </span>
        </div>
      </div>

      {/* Grouped Transaction Lists */}
      <div className="flex flex-col gap-5 pt-1">
        {groupedSections.length === 0 ? (
          <div className="py-16 text-center text-sm text-theme-muted">
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
                <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                  {groupHeader}
                </h2>

                <ul className="flex flex-col gap-2.5">
                  {group.items.map((tx) => {
                    const category = categories.find((c) => c.id === tx.categoryId);

                    return (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        category={category}
                        variant="activity"
                        hideBalances={hideBalances}
                        onDelete={() => setDeletingTransaction(tx)}
                        onEdit={(t) => setEditingTransaction(t)}
                        onClick={(t) => setEditingTransaction(t)}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {/* Edit Transaction Drawer */}
      <EditTransactionDrawer
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        categories={categories}
        accounts={accounts}
        onSave={async (updates) => {
          if (editingTransaction && onUpdateTransaction) {
            await onUpdateTransaction(editingTransaction.id, updates);
          }
          setEditingTransaction(null);
        }}
        onDelete={(id) => {
          const target = transactions.find((t) => t.id === id) || editingTransaction;
          setEditingTransaction(null);
          setDeletingTransaction(target);
        }}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Confirm Delete Pop-Up Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deletingTransaction}
        transaction={deletingTransaction}
        onConfirm={() => {
          if (deletingTransaction) {
            onDeleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
          }
        }}
        onCancel={() => setDeletingTransaction(null)}
      />

      {/* Custom Date Range Picker Modal */}
      {showCustomCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-theme-border bg-theme-card p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
              <h3 className="text-sm font-semibold text-theme-primary">Custom Date Range</h3>
              <button
                type="button"
                onClick={() => setShowCustomCalendar(false)}
                className="text-xs text-theme-muted hover:text-theme-primary font-medium"
              >
                Close
              </button>
            </div>
            <CalendarPicker
              mode="range"
              selectedRange={customRange || undefined}
              onSelectRange={(range) => {
                setCustomRange(range);
                setDateFilter('CUSTOM');
                setShowCustomCalendar(false);
              }}
              showPresets={false}
              onClose={() => setShowCustomCalendar(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
