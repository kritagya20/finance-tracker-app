import React, { useState, useMemo } from 'react';
import { Calendar, Receipt } from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { DrawerShell } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { SortBar, SortOption } from '../../components/ui/SortBar';
import { TransactionRow } from '../../components/common/TransactionRow';
import { cn } from '../../lib/utils';

export interface CategorySpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | string[];
  categoryName: string;
  categoryColor?: string;
  totalSpent: number;
  budgetLimit?: number;
  periodLabel?: string;
  transactions: Transaction[];
  hideBalances: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

type SortField = 'date' | 'amount';

interface ContributingItem {
  id: string;
  transaction: Transaction;
  merchantName: string;
  amount: number;
  originalAmount: number;
  dateStr: string;
  isSplit: boolean;
  categoryId: string;
  note?: string;
  splits?: Array<{ id?: string; categoryId: string; amount: number; note?: string }>;
}

const SORT_OPTIONS: SortOption<SortField>[] = [
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'amount', label: 'Amount' },
];

/**
 * Standardized CategorySpendDrawer composed cleanly from reusable UI primitives:
 * DrawerShell, DrawerHeader, SearchInput, SortBar, and TransactionRow.
 */
export const CategorySpendDrawer: React.FC<CategorySpendDrawerProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryColor = '#8b5cf6',
  totalSpent,
  budgetLimit,
  periodLabel,
  transactions,
  hideBalances,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const targetCategoryIds = useMemo(() => {
    return Array.isArray(categoryId) ? categoryId : [categoryId];
  }, [categoryId]);

  // Filter & Extract Transactions Contributing to this Category
  const allItems = useMemo<ContributingItem[]>(() => {
    if (!isOpen) return [];

    const items: ContributingItem[] = [];

    for (const tx of transactions) {
      if (tx.type !== 'EXPENSE') continue;

      if (tx.isSplit && tx.splits && tx.splits.length > 0) {
        for (const s of tx.splits) {
          if (targetCategoryIds.includes(s.categoryId)) {
            items.push({
              id: `${tx.id}-split-${s.id || s.categoryId}`,
              transaction: tx,
              merchantName: tx.merchantName || 'Unnamed Expense',
              amount: s.amount,
              originalAmount: tx.amount,
              dateStr: tx.date,
              isSplit: true,
              categoryId: s.categoryId,
              note: s.note || tx.notes,
              splits: tx.splits,
            });
          }
        }
      } else if (targetCategoryIds.includes(tx.categoryId)) {
        items.push({
          id: tx.id,
          transaction: tx,
          merchantName: tx.merchantName || 'Unnamed Expense',
          amount: tx.amount,
          originalAmount: tx.amount,
          dateStr: tx.date,
          isSplit: false,
          categoryId: tx.categoryId,
          note: tx.notes,
          splits: tx.splits,
        });
      }
    }

    return items;
  }, [isOpen, transactions, targetCategoryIds]);

  // Search Filter
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.merchantName.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
    );
  }, [allItems, searchQuery]);

  // Sort Filter
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      const timeA = new Date(a.dateStr).getTime();
      const timeB = new Date(b.dateStr).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return sorted;
  }, [filteredItems, sortField, sortOrder]);

  const computedTotal = totalSpent > 0 ? totalSpent : allItems.reduce((acc, curr) => acc + curr.amount, 0);
  const budgetUsagePercent = budgetLimit && budgetLimit > 0 ? (computedTotal / budgetLimit) * 100 : null;
  const isOverBudget = budgetUsagePercent !== null && budgetUsagePercent > 100;
  const isNearLimit = budgetUsagePercent !== null && budgetUsagePercent >= 80 && !isOverBudget;

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="category-drawer-title"
      defaultSnap="full"
      header={
        <DrawerHeader
          title={categoryName}
          titleId="category-drawer-title"
          onBack={onClose}
          rightElement={
            periodLabel ? (
              <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-theme-card-subtle text-theme-secondary border border-theme-border/60">
                {periodLabel}
              </span>
            ) : undefined
          }
        />
      }
    >
      <div className="space-y-4">
        {/* Category Hero Summary Card */}
        <div className="rounded-2xl border border-theme-border/60 bg-theme-card p-4 shadow-sm relative overflow-hidden">
          <div
            className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-10 pointer-events-none"
            style={{ backgroundColor: categoryColor }}
          />

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                Total Category Outflow
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-theme-primary tracking-tight mt-0.5">
                {hideBalances ? '••••••' : formatCurrency(computedTotal, undefined, false)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-theme-card-subtle text-theme-secondary border border-theme-border/60">
                {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
              </span>
              <p className="text-[11px] text-theme-muted mt-1">
                {allItems.length} {allItems.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>

          {/* Budget Pacing Bar (if budget exists) */}
          {budgetLimit && budgetLimit > 0 && budgetUsagePercent !== null && (
            <div className="mt-3.5 pt-3 border-t border-theme-border/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted font-medium">Budget Pacing</span>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    isOverBudget
                      ? 'text-rose-500 dark:text-rose-400'
                      : isNearLimit
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-emerald-500 dark:text-emerald-400'
                  )}
                >
                  {budgetUsagePercent.toFixed(0)}% of {formatCurrency(budgetLimit, undefined, false)}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isOverBudget
                      ? 'bg-rose-500'
                      : isNearLimit
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search input + Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search transactions..."
            className="flex-1"
          />

          <SortBar
            options={SORT_OPTIONS}
            activeField={sortField}
            activeOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortField(field);
              setSortOrder(order);
            }}
          />
        </div>

        {/* Transaction List */}
        {sortedItems.length > 0 ? (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <TransactionRow
                key={item.id}
                item={{
                  id: item.id,
                  merchantName: item.merchantName,
                  amount: item.amount,
                  date: item.dateStr,
                  categoryId: item.categoryId,
                  isSplit: item.isSplit,
                  splits: item.splits,
                  originalTx: item.transaction,
                }}
                hideBalances={hideBalances}
                onClick={() => onSelectTransaction?.(item.transaction)}
              />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4 rounded-2xl border border-dashed border-theme-border/60 bg-theme-card/30">
            <Receipt className="size-10 text-theme-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-theme-primary">No expenses logged</p>
            <p className="text-xs text-theme-muted max-w-[240px] mt-0.5">
              No expenses recorded for {categoryName} in {periodLabel || 'this timeframe'}.
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-theme-muted">
            No transactions match "{searchQuery}".
          </div>
        )}
      </div>
    </DrawerShell>
  );
};
