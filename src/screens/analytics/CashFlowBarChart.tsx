import React, { useState } from 'react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

export interface MonthlyCashFlowPoint {
  label: string; // e.g. "Apr", "May", or "01-09 – 07-09"
  income: IntegerMoney;
  expense: IntegerMoney;
}

interface CashFlowBarChartProps {
  data: MonthlyCashFlowPoint[];
  hideBalances: boolean;
  timeframeLabel?: string;
  className?: string;
}

export const CashFlowBarChart: React.FC<CashFlowBarChartProps> = ({
  data,
  hideBalances,
  timeframeLabel = 'Monthly Cash Flow',
  className,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  // Find max value across all income and expense points to calibrate Y-axis
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    100000 // minimum 1,000 INR
  );

  // SVG Dimensions & Padding
  const height = 180;
  const paddingTop = 26;
  const paddingBottom = 28;
  const plotHeight = height - paddingTop - paddingBottom;

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 sm:p-5 shadow-sm select-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-theme-primary">
            {timeframeLabel}
          </h3>
          <p className="text-[11px] text-theme-muted mt-0.5">
            Income vs Expense side-by-side comparison
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-medium text-theme-secondary">In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-[11px] font-medium text-theme-secondary">Out</span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Canvas */}
      <div className="relative mt-4 w-full">
        {/* Active Inspection Popover / Metric Readout */}
        <div className="h-6 flex items-center justify-between text-xs font-mono px-1">
          {activeIdx !== null && data[activeIdx] ? (
            (() => {
              const item = data[activeIdx];
              const net = item.income - item.expense;
              const isPositive = net >= 0;
              return (
                <>
                  <span className="text-theme-secondary font-semibold">
                    {item.label}:
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      +{hideBalances ? '••••' : formatAdaptiveCardCurrency(item.income, true, undefined, true)}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      -{hideBalances ? '••••' : formatAdaptiveCardCurrency(item.expense, true, undefined, true)}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded font-bold',
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {hideBalances ? '••••' : formatAdaptiveCardCurrency(net, true, undefined, true)}
                    </span>
                  </div>
                </>
              );
            })()
          ) : (
            <span className="text-[11px] text-theme-muted font-sans">
              Tap any column to inspect net flow
            </span>
          )}
        </div>

        {/* CSS Flexbox Bar Grid (Clean, responsive, no pixel cutoff) */}
        <div className="mt-2 flex items-end justify-between gap-2 h-[140px] pt-4 pb-6 border-b border-theme-border/60 relative">
          {/* Subtle baseline zero guideline */}
          <div className="absolute left-0 right-0 bottom-6 h-px bg-theme-border/40 pointer-events-none" />

          {data.map((item, idx) => {
            const isHovered = activeIdx === idx;
            // Heights clamped to plotHeight
            const incomeHeight = Math.max(4, Math.round((item.income / maxValue) * plotHeight));
            const expenseHeight = Math.max(4, Math.round((item.expense / maxValue) * plotHeight));
            const net = item.income - item.expense;

            return (
              <div
                key={item.label + idx}
                onClick={() => setActiveIdx((prev) => (prev === idx ? null : idx))}
                className={cn(
                  'flex-1 flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-200 group relative',
                  activeIdx !== null && !isHovered && 'opacity-40'
                )}
              >
                {/* Net indicator dot above bar group */}
                {isHovered && (
                  <div
                    className={cn(
                      'absolute -top-3 size-1.5 rounded-full ring-2',
                      net >= 0
                        ? 'bg-emerald-500 ring-emerald-500/30'
                        : 'bg-amber-500 ring-amber-500/30'
                    )}
                  />
                )}

                {/* Bars Pair Container */}
                <div className="flex items-end gap-1 w-full max-w-[28px] justify-center">
                  {/* Income Bar (Emerald) */}
                  <div
                    style={{ height: `${incomeHeight}px` }}
                    className={cn(
                      'flex-1 min-w-[6px] max-w-[12px] rounded-t-sm bg-emerald-500 transition-all duration-300',
                      isHovered && 'brightness-110 shadow-xs'
                    )}
                    title={`Income: ${item.income}`}
                  />
                  {/* Expense Bar (Rose) */}
                  <div
                    style={{ height: `${expenseHeight}px` }}
                    className={cn(
                      'flex-1 min-w-[6px] max-w-[12px] rounded-t-sm bg-rose-400 transition-all duration-300',
                      isHovered && 'brightness-110 shadow-xs'
                    )}
                    title={`Expense: ${item.expense}`}
                  />
                </div>

                {/* X-Axis Label */}
                <span
                  className={cn(
                    'absolute -bottom-5 text-[10px] font-mono transition-colors',
                    isHovered
                      ? 'text-theme-primary font-bold'
                      : 'text-theme-muted'
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
