import React from 'react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { CardShell } from '../../components/ui/CardShell';
import { CardHeader } from '../../components/ui/CardHeader';
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
    hideBalances ? '••••' : formatAdaptiveCardCurrency(amt, true, undefined, true);

  // Behavioral verdict generator based on flexible allocation benchmarks
  interface VerdictInfo {
    title: string;
    benchmark: string;
    bgClass: string;
    titleClass: string;
  }

  let verdict: VerdictInfo = {
    title: 'Balanced cash allocation across essentials & lifestyle',
    benchmark: 'Recommended benchmark: ~50% Needs · ~30% Wants · ~20% Savings',
    bgClass: 'bg-slate-100/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.08]',
    titleClass: 'text-theme-primary',
  };

  if (needsPct > 60) {
    verdict = {
      title: `Essentials take up ${needsPct}% of your cash allocation`,
      benchmark: `Recommended benchmark: ~50% for essential needs`,
      bgClass: 'bg-amber-500/[0.08] dark:bg-amber-500/10 border-amber-500/20',
      titleClass: 'text-amber-700 dark:text-amber-300',
    };
  } else if (wantsPct > 40) {
    verdict = {
      title: `Lifestyle spending accounts for ${wantsPct}% of cash flow`,
      benchmark: `Recommended benchmark: ~30% for lifestyle & wants`,
      bgClass: 'bg-rose-500/[0.08] dark:bg-rose-500/10 border-rose-500/20',
      titleClass: 'text-rose-700 dark:text-rose-300',
    };
  } else if (savingsPct >= 20) {
    verdict = {
      title: `Great savings discipline! Retaining ${savingsPct}%`,
      benchmark: `Recommended benchmark: ~20% retained for savings`,
      bgClass: 'bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/20',
      titleClass: 'text-emerald-700 dark:text-emerald-300',
    };
  }

  return (
    <CardShell className={className}>
      {/* Header Primitive */}
      <CardHeader title="Needs, Wants & Savings Breakdown" />

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

      {/* Legend Columns */}
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

      {/* Behavioral Benchmark Verdict Callout Banner */}
      <div className={cn('mt-3.5 rounded-xl p-3 border flex flex-col gap-1 transition-colors', verdict.bgClass)}>
        <p className={cn('text-xs font-semibold leading-tight', verdict.titleClass)}>
          {verdict.title}
        </p>
        <p className="text-[11px] font-mono text-theme-muted flex items-center gap-1.5 mt-0.5">
          <span className="inline-block size-1 rounded-full bg-current opacity-70 shrink-0" />
          <span>{verdict.benchmark}</span>
        </p>
      </div>
    </CardShell>
  );
};
