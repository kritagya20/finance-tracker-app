import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';

interface SpendingPaceCardProps {
  monthlyBudget: IntegerMoney;
  monthToDateSpending: IntegerMoney;
  remainingDays: number;
  totalDaysInPeriod: number;
  hideBalances: boolean;
  timeframeLabel?: string;
  onConfigureBudget?: () => void;
}

export const SpendingPaceCard: React.FC<SpendingPaceCardProps> = ({
  monthlyBudget,
  monthToDateSpending,
  remainingDays,
  totalDaysInPeriod,
  hideBalances,
  timeframeLabel = 'this period',
  onConfigureBudget,
}) => {
  // Edge Case 1: No budget set or invalid
  const hasBudget = monthlyBudget > 0;

  if (!hasBudget) {
    return (
      <div className="relative rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm select-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-theme-primary">Daily Spending Pace</h3>
              <p className="text-[11px] text-theme-muted">Set a budget to calculate your daily allowance</p>
            </div>
          </div>
          {onConfigureBudget && (
            <button
              type="button"
              onClick={onConfigureBudget}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <span>Set Budget</span>
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Safe Math Computations
  const safeRemainingDays = Math.max(1, remainingDays);
  const budgetRemaining = monthlyBudget - monthToDateSpending;
  const isOverBudget = budgetRemaining < 0;
  const isLastDay = safeRemainingDays === 1;

  // Daily Pace (Safe to Spend per day)
  const dailyPace = isOverBudget ? 0 : Math.round(budgetRemaining / safeRemainingDays);
  const baselineDailyPace = Math.round(monthlyBudget / Math.max(1, totalDaysInPeriod));

  // Determine Pace Health
  let status: 'on_track' | 'elevated' | 'over_budget' = 'on_track';
  if (isOverBudget) {
    status = 'over_budget';
  } else if (dailyPace < baselineDailyPace * 0.75) {
    status = 'elevated';
  }

  const formattedPace = hideBalances
    ? '••••••'
    : formatAdaptiveCardCurrency(dailyPace, true, '₹', true);

  const formattedRemaining = hideBalances
    ? '••••••'
    : formatAdaptiveCardCurrency(Math.abs(budgetRemaining), true, '₹', true);

  return (
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 sm:p-5 shadow-sm select-none overflow-hidden">
      {/* Top Meta Line: Title + Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-theme-secondary">
          {isLastDay ? 'Left for Today' : 'Safe to Spend'}
        </span>

        {status === 'on_track' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="size-3 shrink-0" />
            <span>On Track</span>
          </div>
        )}

        {status === 'elevated' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
            <AlertTriangle className="size-3 shrink-0" />
            <span>Pacing High</span>
          </div>
        )}

        {status === 'over_budget' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-[11px] font-semibold">
            <AlertCircle className="size-3 shrink-0" />
            <span>Over Budget</span>
          </div>
        )}
      </div>

      {/* Main KPI Display */}
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="font-mono text-3xl sm:text-[34px] font-bold tracking-tight text-slate-900 dark:text-white">
          {formattedPace}
        </span>
        {!hideBalances && !isLastDay && (
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            / day
          </span>
        )}
      </div>

      {/* Context Summary Line */}
      <div className="mt-2 flex items-center justify-between text-xs text-theme-muted font-medium pt-2 border-t border-theme-border/50">
        <span>
          {isOverBudget ? (
            <span className="text-rose-500 font-semibold">
              Exceeded by {formattedRemaining}
            </span>
          ) : (
            <span>
              <strong className="font-mono font-semibold text-theme-secondary">
                {formattedRemaining}
              </strong>{' '}
              remaining
            </span>
          )}
        </span>
        <span className="font-mono text-[11px]">
          {isLastDay
            ? 'Final day'
            : `${safeRemainingDays} days left in ${timeframeLabel}`}
        </span>
      </div>
    </div>
  );
};
