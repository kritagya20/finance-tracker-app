import React from 'react';
import { FinanceSummary } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';

interface BudgetProgressBarProps {
  summary: FinanceSummary | null;
  hideBalances: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  summary,
  hideBalances,
}) => {
  const percent = summary?.budgetUsedPercent ?? 64;
  const remaining = summary?.budgetRemaining ?? 1785000;

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm transition-colors">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-theme-muted">Monthly Budget</p>
          <p className="text-sm font-semibold font-mono text-theme-primary">{percent}% used</p>
        </div>
        <p className="text-xs font-medium font-mono text-theme-secondary tabular-nums">
          {hideBalances ? '•••• left' : `${formatCurrency(remaining, undefined, false)} left`}
        </p>

      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-theme-card-subtle"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-500"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
};
