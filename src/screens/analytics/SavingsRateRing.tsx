import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface SavingsRateRingProps {
  totalIncome: IntegerMoney;
  totalExpense: IntegerMoney;
  savingsTargetPercent?: number | null;
  previousPeriodRate?: number | null;
  hideBalances: boolean;
  className?: string;
}

export const SavingsRateRing: React.FC<SavingsRateRingProps> = ({
  totalIncome,
  totalExpense,
  savingsTargetPercent = 20,
  previousPeriodRate,
  hideBalances,
  className,
}) => {
  // Edge Case 1: Division by zero (no income logged)
  const hasIncome = totalIncome > 0;

  if (!hasIncome) {
    return (
      <div
        className={cn(
          'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-5 shadow-sm select-none',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Savings Rate</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Log income transactions for this period to see how much of your earnings you retained.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Savings Math
  const netSaved = totalIncome - totalExpense;
  const isNetNegative = netSaved < 0;

  // Rate calculation (clamped between 0 and 100 for the SVG ring)
  const rawRate = (netSaved / totalIncome) * 100;
  const savingsRate = Math.round(rawRate);
  const ringRate = Math.max(0, Math.min(100, savingsRate));

  // Ring Geometry (SVG)
  const size = 110;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringRate / 100) * circumference;

  // Target Marker Angle on Ring (0° starts at top = -90° in standard Cartesian)
  const targetPct = savingsTargetPercent || 20;
  const targetAngle = (targetPct / 100) * 360 - 90;
  const targetRad = (targetAngle * Math.PI) / 180;
  const targetMarkerX = size / 2 + radius * Math.cos(targetRad);
  const targetMarkerY = size / 2 + radius * Math.sin(targetRad);

  // Status Coloring
  let ringStrokeColor = '#8b5cf6'; // Violet default
  if (isNetNegative) {
    ringStrokeColor = '#f59e0b'; // Amber for 0%/negative
  } else if (savingsRate >= targetPct) {
    ringStrokeColor = '#10b981'; // Emerald for meeting target
  }

  // Trend Delta vs previous period
  const hasTrend = previousPeriodRate !== null && previousPeriodRate !== undefined;
  const trendDiff = hasTrend ? savingsRate - (previousPeriodRate as number) : 0;
  const isImproving = trendDiff > 0;

  const formattedSaved = hideBalances
    ? '••••••'
    : formatAdaptiveCardCurrency(Math.abs(netSaved), true, '₹', true);

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-5 shadow-sm select-none',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-theme-primary">
          Savings Rate & Retention
        </h3>
        {savingsTargetPercent && (
          <span className="text-[11px] font-mono text-theme-muted">
            Target: {savingsTargetPercent}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {/* Left: Interactive SVG Progress Ring */}
        <div className="relative size-[110px] shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100 dark:text-white/[0.06]"
            />
            {/* Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringStrokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Target Milestone Indicator Dot */}
          {targetPct > 0 && targetPct <= 100 && (
            <div
              style={{
                left: `${targetMarkerX}px`,
                top: `${targetMarkerY}px`,
              }}
              title={`Target: ${targetPct}%`}
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-slate-900 border-2 border-violet-500 shadow-xs"
            />
          )}

          {/* Center Monospace Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {savingsRate}%
            </span>
            <span className="text-[10px] text-theme-muted font-medium mt-0.5">
              retained
            </span>
          </div>
        </div>

        {/* Right: Analytical Metrics & Trends */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
          <div>
            <div className="text-[11px] font-medium text-theme-muted">
              {isNetNegative ? 'Net Outflow Deficit' : 'Net Surplus Saved'}
            </div>
            <div className="font-mono text-xl font-bold text-theme-primary tracking-tight">
              {isNetNegative ? `- ${formattedSaved}` : `+ ${formattedSaved}`}
            </div>
          </div>

          {/* Contextual Trend Arrow */}
          {hasTrend && Math.abs(trendDiff) >= 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              {isImproving ? (
                <div className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <TrendingUp className="size-3.5" />
                  <span className="font-mono">+{trendDiff}% vs last period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <TrendingDown className="size-3.5" />
                  <span className="font-mono">{trendDiff}% vs last period</span>
                </div>
              )}
            </div>
          )}

          {/* Behavioral Status */}
          <div className="text-[11px] text-theme-secondary">
            {isNetNegative ? (
              <span className="text-amber-500 font-medium">Spending exceeded inflows this period.</span>
            ) : savingsRate >= targetPct ? (
              <span className="text-emerald-500 font-medium">You reached your savings target!</span>
            ) : (
              <span>Approaching your {targetPct}% savings benchmark.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
