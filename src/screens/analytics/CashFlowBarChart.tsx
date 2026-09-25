import React, { useState } from 'react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';
import { CardShell } from '../../components/ui/CardShell';
import { CardHeader } from '../../components/ui/CardHeader';

export interface MonthlyCashFlowPoint {
  label: string; // Short tick label for X-axis (e.g. "17/08" or "Sep")
  fullLabel?: string; // Full range label for inspection readout (e.g. "17/08–23/08")
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

  const plotHeight = 100;

  return (
    <CardShell padding="p-4 sm:p-5" className={cn('select-none', className)}>
      {/* Header with legend action */}
      <CardHeader
        title={timeframeLabel}
        subtitle="Income vs Expense side-by-side comparison"
        action={
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
        }
      />

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
                    {item.fullLabel || item.label}:
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

        {/* CSS Flexbox Bar Grid */}
        <div className="mt-2 flex items-end justify-between gap-2 h-[115px] pt-4 pb-1 border-b border-theme-border/60 relative">
          {/* Baseline zero guideline */}
          <div className="absolute left-0 right-0 bottom-0 h-px bg-theme-border/40 pointer-events-none" />

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
                      'absolute -top-2.5 size-1.5 rounded-full ring-2',
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
              </div>
            );
          })}
        </div>

        {/* Separate X-Axis Label Strip (No overlap with bars) */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {data.map((item, idx) => {
            const isHovered = activeIdx === idx;
            return (
              <div
                key={item.label + idx + '-lbl'}
                onClick={() => setActiveIdx((prev) => (prev === idx ? null : idx))}
                className="flex-1 text-center cursor-pointer"
              >
                <span
                  className={cn(
                    'text-[10px] font-mono whitespace-nowrap transition-colors block truncate',
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
    </CardShell>
  );
};
