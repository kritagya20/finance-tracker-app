import React, { useState, useMemo } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { DrawerShell } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { SortBar, SortOption } from '../../components/ui/SortBar';
import { TransactionRow } from '../../components/common/TransactionRow';

export interface DateSpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null; // YYYY-MM-DD
  transactions: Transaction[];
  hideBalances: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

type SortField = 'date' | 'amount';

const SORT_OPTIONS: SortOption<SortField>[] = [
  { key: 'date', label: 'Time', icon: Calendar },
  { key: 'amount', label: 'Amount' },
];

/**
 * Standardized DateSpendDrawer triggered by long-pressing a calendar date cell.
 * Product Directive: Keeps clean 'Daily Activity' header title and displays the date strictly ONCE on the top-right hero badge.
 */
export const DateSpendDrawer: React.FC<DateSpendDrawerProps> = ({
  isOpen,
  onClose,
  dateStr,
  transactions,
  hideBalances,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter transactions strictly belonging to this date (YYYY-MM-DD)
  const dayTransactions = useMemo(() => {
    if (!isOpen || !dateStr) return [];
    const targetYMD = dateStr.slice(0, 10);
    return transactions.filter((t) => t.date.slice(0, 10) === targetYMD);
  }, [isOpen, dateStr, transactions]);

  // Outflow total for hero card
  const totalExpense = useMemo(() => {
    return dayTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [dayTransactions]);

  const totalIncome = useMemo(() => {
    return dayTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [dayTransactions]);

  // Search Filter
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return dayTransactions;
    const q = searchQuery.toLowerCase().trim();
    return dayTransactions.filter(
      (tx) =>
        tx.merchantName.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q))
    );
  }, [dayTransactions, searchQuery]);

  // Sort Filter
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return sorted;
  }, [filteredTransactions, sortField, sortOrder]);

  const formattedDate = dateStr ? formatDateDDMMYYYY(dateStr) : '';

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="date-drawer-title"
      defaultSnap="full"
      header={
        <DrawerHeader
          title="Daily Activity"
          titleId="date-drawer-title"
          onBack={onClose}
        />
      }
    >
      <div className="space-y-4">
        {/* Date Hero Summary Card */}
        <div className="rounded-2xl border border-theme-border/60 bg-theme-card p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                Total Outflow
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-theme-primary tracking-tight mt-0.5">
                {hideBalances
                  ? '••••••'
                  : formatAdaptiveCardCurrency(totalExpense, true, undefined, true)}
              </p>
              {totalIncome > 0 && (
                <p className="text-xs font-mono font-medium text-emerald-500 dark:text-emerald-400 mt-1">
                  + {hideBalances ? '••••••' : formatAdaptiveCardCurrency(totalIncome, true, undefined, true)} Inflow
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {formattedDate}
              </span>
              <p className="text-[11px] text-theme-muted mt-1.5 font-mono">
                {dayTransactions.length} {dayTransactions.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Sort Bar */}
        {dayTransactions.length > 0 && (
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
        {sortedTransactions.length > 0 ? (
          <div className="space-y-2">
            {sortedTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                item={{
                  id: tx.id,
                  merchantName: tx.merchantName,
                  amount: tx.amount,
                  date: tx.date,
                  categoryId: tx.categoryId,
                  isSplit: tx.isSplit,
                  splits: tx.splits,
                  originalTx: tx,
                }}
                hideBalances={hideBalances}
                onClick={() => {
                  onSelectTransaction?.(tx);
                }}
              />
            ))}
          </div>
        ) : dayTransactions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4 rounded-2xl border border-dashed border-theme-border/60 bg-theme-card/30">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-theme-primary">Zero Spend Day</h3>
            <p className="text-xs text-theme-muted max-w-[240px] mt-1 leading-relaxed">
              No transactions were recorded for {formattedDate}.
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
