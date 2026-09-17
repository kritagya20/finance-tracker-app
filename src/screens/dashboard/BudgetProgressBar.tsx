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
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Budget</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{percent}% used</p>
        </div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
          {hideBalances ? '•••• left' : `${formatCurrency(remaining, 'INR', false)} left`}
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
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
