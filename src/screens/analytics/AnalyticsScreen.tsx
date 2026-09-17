import React, { useState } from 'react';
import { FinanceSummary, Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { cn } from '../../lib/utils';

interface AnalyticsScreenProps {
  summary: FinanceSummary | null;
  transactions: Transaction[];
  hideBalances: boolean;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  summary,
  transactions,
  hideBalances,
}) => {
  const [timeframe, setTimeframe] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');

  // Compute category totals
  const categorySpending = DEFAULT_CATEGORIES.map((cat) => {
    const total = transactions
      .filter((t) => t.categoryId === cat.id && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, total };
  }).filter((c) => c.total > 0);

  const totalExpense = summary?.monthlySpent ?? 3215000;

  return (
    <div className="flex flex-col gap-5">
      {/* Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        <button
          type="button"
          className="flex h-10 items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 px-3.5 text-xs font-medium text-zinc-300 hover:text-white active:bg-zinc-800 transition-colors"
        >
          <span>Sep 2026</span>
          <span className="text-[10px] text-zinc-500">▾</span>
        </button>
      </header>

      {/* Timeframe Segment */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-white/5">
        {(['WEEK', 'MONTH', 'YEAR'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTimeframe(t)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-medium transition-all capitalize',
              timeframe === t
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {t.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Spending Velocity Card */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
        <p className="text-xs font-medium text-slate-400">Total Outflow</p>
        <p className="mt-1 text-3xl font-bold text-white tabular-nums">
          {hideBalances ? '••••••' : formatCurrency(totalExpense)}
        </p>
        <p className="mt-1 text-xs text-emerald-400">
          ↓ 12% lower than previous month
        </p>

        {/* Visual Bar Distribution */}
        <div className="mt-5 space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-amber-400" style={{ width: '45%' }} />
            <div className="h-full bg-emerald-400" style={{ width: '30%' }} />
            <div className="h-full bg-sky-400" style={{ width: '15%' }} />
            <div className="h-full bg-violet-400" style={{ width: '10%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Dining (45%)</span>
            <span>Bills (30%)</span>
            <span>Fuel (15%)</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Category Envelopes
        </h2>

        <div className="flex flex-col gap-2.5">
          {categorySpending.map((cat) => {
            const percent = Math.round((cat.total / totalExpense) * 100) || 0;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      cat.bgClass,
                      cat.textClass
                    )}
                  >
                    <CategoryIcon name={cat.iconName} size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{cat.name}</p>
                    <p className="text-[11px] text-slate-400">{percent}% of total</p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-white tabular-nums">
                  {hideBalances ? '••••••' : formatCurrency(cat.total)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
