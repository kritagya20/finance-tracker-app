import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { DrawerShell } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { SortBar, SortOption } from '../../components/ui/SortBar';
import { TransactionRow } from '../../components/common/TransactionRow';

export interface VelocitySpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dayPoint: {
    day: number;
    dateStr: string;
    cumulative: number;
    daily: number;
  } | null;
  transactions: Transaction[];
  periodStart: Date;
  periodEnd: Date;
  totalExpense?: number;
  totalBudget?: number;
  hideBalances: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

type SortField = 'date' | 'amount';

interface ContributingItem {
  id: string;
  transaction: Transaction;
  merchantName: string;
  amount: number;
  dateStr: string;
  categoryId: string;
  isSplit: boolean;
  splits?: Array<{ id?: string; categoryId: string; amount: number; note?: string }>;
}

const SORT_OPTIONS: SortOption<SortField>[] = [
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'amount', label: 'Amount' },
];

/**
 * Standardized VelocitySpendDrawer composed cleanly from reusable primitives:
 * DrawerShell, DrawerHeader, SearchInput, SortBar, and TransactionRow.
 */
export const VelocitySpendDrawer: React.FC<VelocitySpendDrawerProps> = ({
  isOpen,
  onClose,
  dayPoint,
  transactions,
  periodStart,
  periodEnd,
  totalExpense = 0,
  hideBalances,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and extract transactions
  const allItems = useMemo<ContributingItem[]>(() => {
    if (!isOpen) return [];

    return transactions
      .filter((tx) => {
        if (tx.type !== 'EXPENSE') return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;

        if (dayPoint) {
          // Filter strictly for this specific day
          return (
            txDate.getDate() === dayPoint.day &&
            txDate >= periodStart &&
            txDate <= periodEnd
          );
        } else {
          // Whole timeframe
          return txDate >= periodStart && txDate <= periodEnd;
        }
      })
      .map((tx) => ({
        id: tx.id,
        transaction: tx,
        merchantName: tx.merchantName,
        amount: tx.amount,
        dateStr: tx.date,
        categoryId: tx.categoryId,
        isSplit: !!tx.isSplit,
        splits: tx.splits,
      }));
  }, [isOpen, transactions, dayPoint, periodStart, periodEnd]);

  // Search filter
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.merchantName.toLowerCase().includes(q) ||
        (item.transaction.notes && item.transaction.notes.toLowerCase().includes(q))
    );
  }, [allItems, searchQuery]);

  // Sort
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

  const totalSpentInView = allItems.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="velocity-drawer-title"
      defaultSnap="full"
      header={
        <DrawerHeader
          title={dayPoint ? `Expenses on ${dayPoint.dateStr}` : 'Spending Velocity'}
          titleId="velocity-drawer-title"
          onBack={onClose}
        />
      }
    >
      <div className="space-y-4">
        {/* Summary Hero Card */}
        <div className="rounded-2xl border border-theme-border/60 bg-theme-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                {dayPoint ? `Spent on ${dayPoint.dateStr}` : 'Total Velocity Expense'}
              </p>
              <p className="text-2xl font-bold font-mono text-theme-primary mt-0.5">
                {hideBalances
                  ? '••••••'
                  : formatAdaptiveCardCurrency(
                      dayPoint ? dayPoint.daily : totalExpense || totalSpentInView,
                      true,
                      undefined,
                      true
                    )}
              </p>
            </div>
            {dayPoint && (
              <div className="text-right">
                <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                  Cumulative
                </p>
                <p className="text-lg font-bold font-mono text-theme-secondary mt-0.5">
                  {hideBalances ? '••••••' : formatAdaptiveCardCurrency(dayPoint.cumulative, true, undefined, true)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-theme-border/40 flex items-center justify-between text-xs text-theme-muted">
            <span>
              {allItems.length} {allItems.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className="font-mono">
              {dayPoint ? `Day ${dayPoint.day}` : 'Active Period'}
            </span>
          </div>
        </div>

        {/* Search & Sort Controls */}
        {allItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search merchant or note..."
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
        )}

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
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-theme-primary">Zero Spend Day</h3>
            <p className="text-xs text-theme-muted max-w-[240px] mt-1">
              No expenses were recorded for {dayPoint ? dayPoint.dateStr : 'this timeframe'}.
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
