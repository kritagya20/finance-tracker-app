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
    <div className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl transition-colors">
      <p className="text-xs font-medium uppercase tracking-wider text-theme-muted">
        Total Balance
      </p>

      <p className="mt-1.5 text-3xl font-bold tracking-tight text-theme-primary font-mono tabular-nums">
        {hideBalances ? (
          <span className="text-theme-muted">₹ ••••••</span>
        ) : (
          formatCurrency(total)
        )}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* Income Sub-Card */}
        <div className="flex flex-col justify-between rounded-xl bg-theme-card-subtle/70 border border-theme-border/50 p-3.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">
              Income
            </span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
              <ArrowDownLeft className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-base font-bold font-mono text-emerald-500 dark:text-emerald-400 tabular-nums">
            {hideBalances ? '••••••' : formatCurrency(income)}
          </p>
        </div>

        {/* Spent Sub-Card */}
        <div className="flex flex-col justify-between rounded-xl bg-theme-card-subtle/70 border border-theme-border/50 p-3.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">
              Spent
            </span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400">
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-base font-bold font-mono text-rose-500 dark:text-rose-400 tabular-nums">
            {hideBalances ? '••••••' : formatCurrency(spent)}
          </p>
        </div>
      </div>
    </div>
  );
};
