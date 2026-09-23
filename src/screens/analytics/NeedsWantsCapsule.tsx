import React from 'react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface NeedsWantsCapsuleProps {
  needsAmount: IntegerMoney;
  wantsAmount: IntegerMoney;
  savingsAmount: IntegerMoney;
  totalSpending: IntegerMoney;
  hideBalances: boolean;
  className?: string;
}

export const NeedsWantsCapsule: React.FC<NeedsWantsCapsuleProps> = ({
  needsAmount,
  wantsAmount,
  savingsAmount,
  totalSpending,
  hideBalances,
  className,
}) => {
  const totalOutflowAndSavings = needsAmount + wantsAmount + savingsAmount;

  // Edge case: No data
  if (totalOutflowAndSavings === 0 || totalSpending === 0) {
    return null;
  }

  // Calculate percentages (rounded to whole integers)
  const needsPct = Math.round((needsAmount / totalOutflowAndSavings) * 100);
  const wantsPct = Math.round((wantsAmount / totalOutflowAndSavings) * 100);
  // Ensure sum equals 100%
  const savingsPct = Math.max(0, 100 - needsPct - wantsPct);

  // Formatting helper
  const formatAmt = (amt: IntegerMoney) =>
    hideBalances ? '••••' : formatAdaptiveCardCurrency(amt, true, '₹', true);

  // Behavioral verdict generator based on 50/30/20 standard
  let verdict = 'Balanced cash allocation across essentials and lifestyle.';
  if (needsPct > 60) {
    verdict = `Essentials take up ${needsPct}% — ${needsPct - 50}% above the standard 50% benchmark.`;
  } else if (wantsPct > 40) {
    verdict = `Lifestyle spending is high at ${wantsPct}% (recommended benchmark is 30%).`;
  } else if (savingsPct >= 20) {
    verdict = `Great savings discipline! Retaining ${savingsPct}% meets the 20% benchmark.`;
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 sm:p-5 shadow-sm select-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-theme-primary">
          50 / 30 / 20 Rule Allocation
        </h3>
        <span className="text-[11px] font-mono text-theme-muted">
          Target: 50% · 30% · 20%
        </span>
      </div>

      {/* Segmented Horizontal Pill Bar */}
      <div className="relative mt-3 h-3 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden flex">
        {needsPct > 0 && (
          <div
            style={{ width: `${needsPct}%` }}
            className="h-full bg-sky-500 transition-all duration-300"
            title={`Needs: ${needsPct}%`}
          />
        )}
        {wantsPct > 0 && (
          <div
            style={{ width: `${wantsPct}%` }}
            className="h-full bg-violet-500 transition-all duration-300"
            title={`Wants: ${wantsPct}%`}
          />
        )}
        {savingsPct > 0 && (
          <div
            style={{ width: `${savingsPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
            title={`Savings: ${savingsPct}%`}
          />
        )}
      </div>

      {/* Legend Rows */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 pt-2 border-t border-theme-border/50 text-xs">
        {/* Needs Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-500 shrink-0" />
            <span className="text-theme-secondary text-[11px] font-medium">Needs</span>
          </div>
          <span className="mt-1 font-mono text-xs font-bold text-theme-primary">
            {needsPct}%
          </span>
          <span className="font-mono text-[10px] text-theme-muted">
            {formatAmt(needsAmount)}
          </span>
        </div>

        {/* Wants Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-violet-500 shrink-0" />
            <span className="text-theme-secondary text-[11px] font-medium">Wants</span>
          </div>
          <span className="mt-1 font-mono text-xs font-bold text-theme-primary">
            {wantsPct}%
          </span>
          <span className="font-mono text-[10px] text-theme-muted">
            {formatAmt(wantsAmount)}
          </span>
        </div>

        {/* Savings Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-theme-secondary text-[11px] font-medium">Savings</span>
          </div>
          <span className="mt-1 font-mono text-xs font-bold text-theme-primary">
            {savingsPct}%
          </span>
          <span className="font-mono text-[10px] text-theme-muted">
            {formatAmt(savingsAmount)}
          </span>
        </div>
      </div>

      {/* Behavioral Benchmark Verdict */}
      <div className="mt-3 rounded-xl bg-theme-card-subtle px-3 py-2 border border-theme-border/50">
        <p className="text-[11px] text-theme-secondary leading-relaxed">
          {verdict}
        </p>
      </div>
    </div>
  );
};
