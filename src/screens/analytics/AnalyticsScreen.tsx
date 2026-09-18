import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { FinanceSummary, Transaction, Category } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CalendarPicker, DateRange } from '../../components/common/CalendarPicker';
import { cn } from '../../lib/utils';

interface AnalyticsScreenProps {
  summary: FinanceSummary | null;
  transactions: Transaction[];
  categories?: Category[];
  hideBalances: boolean;
}

export type AnalyticsTimeframe = 'WEEK' | 'MONTH' | 'YEAR';

interface PeriodDetails {
  start: Date;
  end: Date;
  label: string;
  prevStart: Date;
  prevEnd: Date;
}

function getPeriodDetails(
  timeframe: AnalyticsTimeframe,
  customRange: DateRange | null,
  referenceDate: Date = new Date()
): PeriodDetails {
  if (customRange) {
    const start = new Date(customRange.startDate + 'T00:00:00');
    const end = new Date(customRange.endDate + 'T23:59:59.999');
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
    });
    const duration = end.getTime() - start.getTime();
    return {
      start,
      end,
      label: `${startStr} – ${endStr}`,
      prevStart: new Date(start.getTime() - duration),
      prevEnd: new Date(start.getTime() - 1),
    };
  }

  const d = new Date(referenceDate);

  if (timeframe === 'WEEK') {
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMon);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const label =
      startMonth === endMonth
        ? `${startMonth} ${start.getDate()} – ${end.getDate()}`
        : `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;

    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 7);
    const prevEnd = new Date(end);
    prevEnd.setDate(end.getDate() - 7);

    return { start, end, label, prevStart, prevEnd };
  }

  if (timeframe === 'YEAR') {
    const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    const label = `${d.getFullYear()}`;

    const prevStart = new Date(d.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    const prevEnd = new Date(d.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    return { start, end, label, prevStart, prevEnd };
  }

  // MONTH
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);

  return { start, end, label, prevStart, prevEnd };
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  summary: _summary,
  transactions,
  categories = DEFAULT_CATEGORIES,
  hideBalances,
}) => {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('MONTH');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  // Period details (start, end, label, and previous period bounds)
  const period = useMemo(
    () => getPeriodDetails(timeframe, customRange, referenceDate),
    [timeframe, customRange, referenceDate]
  );

  // Transactions belonging to the active timeframe
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= period.start && txDate <= period.end;
    });
  }, [transactions, period]);

  // Total Outflow (Expenses) for active period
  const totalExpense = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  // Total Outflow for previous period for comparison
  const previousExpense = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
        return d >= period.prevStart && d <= period.prevEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, period]);

  // Category breakdown for active period (handles multi-category bill splits accurately)
  const categorySpending = useMemo(() => {
    return categories
      .map((cat) => {
        let total = 0;
        for (const t of periodTransactions) {
          if (t.type !== 'EXPENSE') continue;
          if (t.isSplit && t.splits && t.splits.length > 0) {
            for (const s of t.splits) {
              if (s.categoryId === cat.id) {
                total += s.amount;
              }
            }
          } else if (t.categoryId === cat.id) {
            total += t.amount;
          }
        }
        return { ...cat, total };
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [categories, periodTransactions]);

  // Velocity comparison subtext
  const comparison = useMemo(() => {
    if (customRange) {
      const count = periodTransactions.filter((t) => t.type === 'EXPENSE').length;
      return {
        text: `${count} expense ${count === 1 ? 'record' : 'records'} in selected range`,
        className: 'text-theme-muted',
      };
    }
    const unit = timeframe === 'WEEK' ? 'week' : timeframe === 'MONTH' ? 'month' : 'year';

    if (previousExpense > 0 && totalExpense > 0) {
      const diff = totalExpense - previousExpense;
      const pct = Math.abs(Math.round((diff / previousExpense) * 100));
      if (diff < 0) {
        return {
          text: `↓ ${pct}% lower than previous ${unit}`,
          className: 'text-emerald-600 dark:text-emerald-400',
        };
      }
      if (diff > 0) {
        return {
          text: `↑ ${pct}% higher than previous ${unit}`,
          className: 'text-amber-600 dark:text-amber-400',
        };
      }
      return {
        text: `Consistent with previous ${unit}`,
        className: 'text-theme-muted',
      };
    }

    const count = periodTransactions.filter((t) => t.type === 'EXPENSE').length;
    return {
      text: `${count} expense ${count === 1 ? 'record' : 'records'} in this ${unit}`,
      className: 'text-theme-muted',
    };
  }, [customRange, timeframe, totalExpense, previousExpense, periodTransactions]);

  // Visual Bar Distribution segments
  const distribution = useMemo(() => {
    if (totalExpense === 0) return [];
    const top = categorySpending.slice(0, 3);
    const restTotal = categorySpending.slice(3).reduce((sum, c) => sum + c.total, 0);

    const segments = top.map((cat) => ({
      name: cat.name,
      percent: Math.max(2, Math.round((cat.total / totalExpense) * 100)),
      color: cat.colorHex,
    }));

    if (restTotal > 0) {
      segments.push({
        name: 'Other',
        percent: Math.max(2, Math.round((restTotal / totalExpense) * 100)),
        color: '#94a3b8',
      });
    }

    return segments;
  }, [categorySpending, totalExpense]);

  // Handle timeframe segment clicks
  const handleTimeframeChange = (t: AnalyticsTimeframe) => {
    setTimeframe(t);
    setCustomRange(null);
    setReferenceDate(new Date());
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between relative">
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">Analytics</h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen((prev) => !prev)}
            aria-label="Select date range"
            className="flex h-10 items-center gap-1.5 rounded-2xl border border-theme-border bg-theme-card px-3.5 text-xs font-medium text-theme-secondary hover:bg-theme-card-hover transition-colors shadow-sm"
          >
            <span>{period.label}</span>
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200 text-theme-muted',
                isDatePickerOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Date Picker Popover */}
          {isDatePickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDatePickerOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1.5">
                <CalendarPicker
                  mode="range"
                  selectedRange={customRange || undefined}
                  onSelectRange={(range) => {
                    setCustomRange(range);
                    setIsDatePickerOpen(false);
                  }}
                  onPresetSelect={(preset) => {
                    if (preset === 'THIS_MONTH') {
                      setTimeframe('MONTH');
                      setCustomRange(null);
                      setReferenceDate(new Date());
                    } else if (preset === 'LAST_MONTH') {
                      setTimeframe('MONTH');
                      const lastM = new Date();
                      lastM.setMonth(lastM.getMonth() - 1);
                      setReferenceDate(lastM);
                      setCustomRange(null);
                    } else if (preset === 'LAST_30_DAYS') {
                      const now = new Date();
                      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setCustomRange({
                        startDate: thirtyDaysAgo.toISOString().slice(0, 10),
                        endDate: now.toISOString().slice(0, 10),
                      });
                    }
                    setIsDatePickerOpen(false);
                  }}
                  showPresets={true}
                  onClose={() => setIsDatePickerOpen(false)}
                />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Timeframe Segment (Week, Month, Year) */}
      <div className="flex rounded-2xl bg-theme-card-subtle p-1 border border-theme-border">
        {(['WEEK', 'MONTH', 'YEAR'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTimeframeChange(t)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-medium transition-all capitalize',
              timeframe === t && !customRange
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-theme-secondary hover:text-theme-primary'
            )}
          >
            {t.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Spending Velocity Card */}
      <div className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-sm transition-colors">
        <p className="text-xs font-medium uppercase tracking-wider text-theme-muted">Total Outflow</p>
        <p className="mt-1 text-3xl font-bold font-mono text-theme-primary tabular-nums">
          {hideBalances ? '••••••' : formatCurrency(totalExpense)}
        </p>
        <p className={cn('mt-1 text-xs font-medium', comparison.className)}>
          {comparison.text}
        </p>

        {/* Dynamic Visual Bar Distribution */}
        <div className="mt-5 space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-theme-card-subtle">
            {totalExpense > 0 ? (
              distribution.map((seg, idx) => (
                <div
                  key={idx}
                  className="h-full transition-all duration-300"
                  style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
                  title={`${seg.name}: ${seg.percent}%`}
                />
              ))
            ) : (
              <div className="h-full w-full bg-theme-card-subtle" />
            )}
          </div>

          {totalExpense > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-theme-muted">
              {distribution.map((seg, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>
                    {seg.name} ({seg.percent}%)
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-center text-[11px] text-theme-muted">
              No outflow recorded for this {timeframe.toLowerCase()}
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-theme-primary">
            Category Envelopes
          </h2>
          <span className="text-xs text-theme-muted">
            {categorySpending.length} {categorySpending.length === 1 ? 'envelope' : 'envelopes'}
          </span>
        </div>

        {categorySpending.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {categorySpending.map((cat) => {
              const percent = Math.round((cat.total / totalExpense) * 100) || 0;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card p-3.5 shadow-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        cat.bgClass,
                        cat.textClass
                      )}
                    >
                      <CategoryIcon name={cat.iconName} size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-theme-primary">{cat.name}</p>
                      <p className="text-[11px] text-theme-muted">{percent}% of total</p>
                    </div>
                  </div>

                  <p className="text-sm font-semibold font-mono text-theme-primary tabular-nums">
                    {hideBalances ? '••••••' : formatCurrency(cat.total)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-theme-border bg-theme-card p-6 text-center text-xs text-theme-muted">
            No categorized spending recorded for this {timeframe.toLowerCase()}.
          </div>
        )}
      </section>
    </div>
  );
};
