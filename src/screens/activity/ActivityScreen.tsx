import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  ArrowRight,
  ArrowLeft,
  Receipt,
} from 'lucide-react';
import { Transaction, Category, Account, DatePreset } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { TransactionItem } from '../../components/common/TransactionItem';
import { Dropdown } from '../../components/ui/Dropdown';
import { CalendarPicker, DateRange } from '../../components/common/CalendarPicker';
import { EditTransactionDrawer } from './EditTransactionDrawer';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { EmptyState } from '../../components/common/EmptyState';

interface ActivityScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  hideBalances: boolean;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => Promise<unknown>;
  initialEditingTransaction?: Transaction | null;
  initialInspectingTransaction?: Transaction | null;
  onClearInitialEditing?: () => void;
  onClearInitialInspecting?: () => void;
  onOpenAddModal?: () => void;
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
  initialInspectingTransaction,
  onClearInitialEditing,
  onClearInitialInspecting,
  onOpenAddModal,
}) => {
  const [inspectingTransaction, setInspectingTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [openedFromDetail, setOpenedFromDetail] = useState(false);

  useEffect(() => {
    if (initialInspectingTransaction) {
      setInspectingTransaction(initialInspectingTransaction);
      onClearInitialInspecting?.();
    }
  }, [initialInspectingTransaction, onClearInitialInspecting]);

  useEffect(() => {
    if (initialEditingTransaction) {
      setInspectingTransaction(initialEditingTransaction);
      onClearInitialEditing?.();
    }
  }, [initialEditingTransaction, onClearInitialEditing]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('LAST_7_DAYS');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Active Dropdown Popover
  const [activeDropdown, setActiveDropdown] = useState<'type' | 'date' | 'source' | 'category' | null>(null);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'ALL' ||
    dateFilter !== 'LAST_7_DAYS' ||
    customRange !== null ||
    sourceFilter !== 'ALL' ||
    categoryFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setDateFilter('LAST_7_DAYS');
    setCustomRange(null);
    setSourceFilter('ALL');
    setCategoryFilter('ALL');
  };

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
      if (dateFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (txDate < sevenDaysAgo || txDate > endToday) return false;
      } else if (dateFilter === 'LAST_15_DAYS') {
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        fifteenDaysAgo.setHours(0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (txDate < fifteenDaysAgo || txDate > endToday) return false;
      } else if (dateFilter === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (txDate < thirtyDaysAgo || txDate > endToday) return false;
      } else if (dateFilter === 'THIS_WEEK') {
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
    { label: 'All', value: 'ALL' },
    { label: 'Credit', value: 'INCOME' },
    { label: 'Debit', value: 'EXPENSE' },
    { label: 'Transfer', value: 'TRANSFER' },
  ];

  const DATE_OPTIONS = [
    { label: '7 Days', value: 'LAST_7_DAYS' },
    { label: '15 Days', value: 'LAST_15_DAYS' },
    { label: '30 Days', value: 'LAST_30_DAYS' },
    { label: 'Custom Range...', value: 'CUSTOM' },
  ];

  const SOURCE_OPTIONS = [
    { label: 'All', value: 'ALL' },
    { label: 'Manual', value: 'MANUAL' },
    { label: 'SMS', value: 'AUTO_SMS' },
  ];

  // Human readable labels with clean Key: Value prefixes
  const typeLabel =
    typeFilter === 'EXPENSE'
      ? 'Type: Debit'
      : typeFilter === 'INCOME'
      ? 'Type: Credit'
      : typeFilter === 'TRANSFER'
      ? 'Type: Transfer'
      : 'Type: All';

  const dateLabel =
    dateFilter === 'CUSTOM' && customRange
      ? `Last: ${new Date(customRange.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(customRange.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : dateFilter === 'LAST_7_DAYS'
      ? 'Last: 7 Days'
      : dateFilter === 'LAST_15_DAYS'
      ? 'Last: 15 Days'
      : dateFilter === 'LAST_30_DAYS'
      ? 'Last: 30 Days'
      : dateFilter === 'CUSTOM'
      ? 'Last: Custom Range'
      : 'Last: 7 Days';

  const sourceLabel =
    sourceFilter === 'AUTO_SMS'
      ? 'Source: SMS'
      : sourceFilter === 'MANUAL'
      ? 'Source: Manual'
      : 'Source: All';

  const categoryLabel =
    categoryFilter === 'ALL'
      ? 'Category: All'
      : `Category: ${categories.find((c) => c.id === categoryFilter)?.name || 'Other'}`;

  const categoryOptions = useMemo(
    () => [
      { label: 'All', value: 'ALL' },
      ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categories]
  );

  const isIncomeView = typeFilter === 'INCOME';
  const displayTotal = isIncomeView ? totalIncome : totalSpent;

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
            isActive={dateFilter !== 'LAST_7_DAYS' || customRange !== null}
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

      {/* Understated Metadata & Swipe Gesture Hint matching reference */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2.5 select-none pt-1">
          {/* Calm, non-focusable metadata line */}
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 px-1 font-normal tracking-tight">
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className="mx-1.5 text-slate-400 dark:text-slate-600">•</span>
            {isIncomeView ? 'Total received' : 'Total spent'}{' '}
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-100">
              {hideBalances ? '••••••' : formatCurrency(displayTotal, undefined, true)}
            </span>
          </p>

          {/* Symmetrical Swipe Gesture Hint Pill */}
          <div className="flex items-center justify-between rounded-full border border-slate-200/90 dark:border-white/10 bg-slate-100/80 dark:bg-[#13151f]/80 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 shadow-sm">
            {/* Left: Swipe Right to Edit */}
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                <ArrowRight className="size-3" />
              </span>
              <span className="font-medium whitespace-nowrap">Swipe right to edit</span>
            </div>

            {/* Vertical Divider */}
            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-2" />

            {/* Right: Swipe Left to Delete */}
            <div className="flex items-center gap-2">
              <span className="font-medium whitespace-nowrap">Swipe left to delete</span>
              <span className="flex size-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <ArrowLeft className="size-3" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Transaction Lists */}
      <div className="flex flex-col gap-5 pt-1">
        {groupedSections.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasActiveFilters ? "No matching transactions" : "No transactions recorded"}
            description={
              hasActiveFilters
                ? "No transactions match your search query or active filters. Reset your filters to view all records."
                : "You haven't recorded any transactions yet. Tap below to log your first expense or income."
            }
            actionLabel={hasActiveFilters ? "Reset Filters" : onOpenAddModal ? "+ Add Transaction" : undefined}
            onAction={hasActiveFilters ? handleResetFilters : onOpenAddModal}
            secondaryActionLabel={hasActiveFilters && onOpenAddModal ? "+ Add Transaction" : undefined}
            onSecondaryAction={onOpenAddModal}
            className="mt-2"
          />
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
                        onClick={(t) => setInspectingTransaction(t)}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {/* Intermediate Transaction Detail & Lifecycle Drawer */}
      <TransactionDetailDrawer
        isOpen={!!inspectingTransaction}
        transaction={
          inspectingTransaction
            ? transactions.find((t) => t.id === inspectingTransaction.id) || inspectingTransaction
            : null
        }
        categories={categories}
        accounts={accounts}
        hideBalances={hideBalances}
        onEdit={(t) => {
          setEditingTransaction(t);
          setOpenedFromDetail(true);
          setInspectingTransaction(null);
        }}
        onDelete={(t) => {
          setDeletingTransaction(t);
          setInspectingTransaction(null);
        }}
        onClose={() => setInspectingTransaction(null)}
      />

      {/* Edit Transaction Drawer (Bottom Sheet) */}
      <EditTransactionDrawer
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        categories={categories}
        accounts={accounts}
        onSave={async (updates) => {
          if (editingTransaction && onUpdateTransaction) {
            await onUpdateTransaction(editingTransaction.id, updates);
          }
          if (openedFromDetail && editingTransaction) {
            const updated = {
              ...editingTransaction,
              ...updates,
              updatedAt: Date.now(),
            };
            setInspectingTransaction(updated);
            setOpenedFromDetail(false);
          }
          setEditingTransaction(null);
        }}
        onClose={() => {
          if (openedFromDetail && editingTransaction) {
            setInspectingTransaction(editingTransaction);
            setOpenedFromDetail(false);
          }
          setEditingTransaction(null);
        }}
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
      )}
    </div>
  );
};
