import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FinanceSummary } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';

interface BalanceCardProps {
  summary: FinanceSummary | null;
  hideBalances: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  hideBalances,
}) => {
  const total = summary?.totalBalance ?? 14285000;
  const income = summary?.monthlyIncome ?? 8500000;
  const spent = summary?.monthlySpent ?? 3215000;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-violet-600/60 via-violet-500/20 to-emerald-500/30 p-px shadow-xl shadow-violet-950/20 dark:shadow-violet-950/40">
      <div className="rounded-[calc(1.5rem-1px)] bg-theme-card p-5 transition-colors">
        <p className="text-xs font-medium uppercase tracking-wide text-theme-muted">
          Total Balance
        </p>

        <p className="mt-1.5 text-4xl font-bold tracking-tight text-theme-primary tabular-nums">
          {hideBalances ? '••••••••' : formatCurrency(total)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* Income Pill */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 px-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="size-4" />
            </span>
            <div className="leading-tight min-w-0">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/70">Income</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums truncate">
                {hideBalances ? '••••••' : formatCurrency(income)}
              </p>
            </div>
          </div>

          {/* Spent Pill */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-500/10 px-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="size-4" />
            </span>
            <div className="leading-tight min-w-0">
              <p className="text-[11px] text-rose-700 dark:text-rose-300/70">Spent</p>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 tabular-nums truncate">
                {hideBalances ? '••••••' : formatCurrency(spent)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
