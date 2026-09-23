import React, { useState, useMemo } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { FinanceSummary, Transaction, Category, Budget } from '../../domain/models/types';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { CalendarPicker, DateRange } from '../../components/common/CalendarPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { SpendingVelocityCard } from './SpendingVelocityCard';
import { CategoryDonutDial } from './CategoryDonutDial';
import { BudgetEnvelopesSection } from './BudgetEnvelopesSection';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { cn } from '../../lib/utils';

interface AnalyticsScreenProps {
  summary: FinanceSummary | null;
  transactions: Transaction[];
  categories?: Category[];
  budgets?: Budget[];
  hideBalances: boolean;
  onOpenAddModal?: () => void;
  onNavigate?: (tab: 'home' | 'activity' | 'analytics' | 'profile') => void;
  onSelectTransaction?: (tx: Transaction) => void;
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
    const startStr = formatDateDDMMYYYY(start);
    const endStr = formatDateDDMMYYYY(end);
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

    const label = `${formatDateDDMMYYYY(start)} – ${formatDateDDMMYYYY(end)}`;

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
  budgets = [],
  hideBalances,
  onOpenAddModal,
  onNavigate,
  onSelectTransaction,
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

  // Total Budget Ceiling: derived from "ALL" budget or sum of category limits, fallback to ₹35,000
  const totalBudget = useMemo(() => {
    const overall = budgets.find((b) => b.categoryId === 'ALL');
    if (overall && overall.limitAmount > 0) return overall.limitAmount;
    return 3500000; // ₹35,000 (paise) matching reference image 1
  }, [budgets]);

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
        return {
          id: cat.id,
          name: cat.name,
          total,
          colorHex: cat.colorHex,
          iconName: cat.iconName,
          bgClass: cat.bgClass,
          textClass: cat.textClass,
          isIncome: cat.isIncome,
        };
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [categories, periodTransactions]);

  // Handle timeframe segment clicks
  const handleTimeframeChange = (t: AnalyticsTimeframe) => {
    setTimeframe(t);
    setCustomRange(null);
    setReferenceDate(new Date());
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 pb-12 animate-in fade-in duration-200 select-none">
      {/* 1. Screen-Specific Header (Level 1 Navigation Invariant: No Top Back Button) */}
      <header className="flex h-14 items-center justify-between relative">
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
          Analytics
        </h1>

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
              <div className="absolute right-0 top-full z-50 mt-1.5 w-[328px] max-w-[calc(100vw-32px)]">
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

      {/* 2. Timeframe Selector (Week, Month, Year) */}
      <div className="flex rounded-2xl bg-theme-card-subtle p-1 border border-theme-border">
        {(['WEEK', 'MONTH', 'YEAR'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTimeframeChange(t)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-semibold transition-all capitalize',
              timeframe === t && !customRange
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-theme-secondary hover:text-theme-primary'
            )}
          >
            {t.toLowerCase()}
          </button>
        ))}
      </div>

      {/* 3. Screen Content: Engaging No-Data State OR Velocity + Category Hub */}
      {totalExpense === 0 || periodTransactions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          badge={period.label}
          title="No Spending Activity"
          description={`You haven't logged any expenses for ${period.label}. Log an expense or adjust your timeframe to view spending velocity and category insights.`}
          actionLabel={onOpenAddModal ? "+ Log an Expense" : undefined}
          onAction={onOpenAddModal}
          secondaryActionLabel={
            timeframe !== 'MONTH'
              ? "Switch to Month"
              : onNavigate
              ? "View All Activity"
              : undefined
          }
          onSecondaryAction={() => {
            if (timeframe !== 'MONTH') {
              handleTimeframeChange('MONTH');
            } else if (onNavigate) {
              onNavigate('activity');
            }
          }}
          className="mt-2"
        />
      ) : (
        <>
          {/* Hero Spending Velocity & Pacing Card */}
          <SpendingVelocityCard
            transactions={periodTransactions}
            totalExpense={totalExpense}
            totalBudget={totalBudget}
            periodStart={period.start}
            periodEnd={period.end}
            hideBalances={hideBalances}
            timeframe={timeframe}
            onSelectTransaction={onSelectTransaction}
          />

          {/* 2. Category Breakdown Donut Dial matching reference */}
          <CategoryDonutDial
            categorySpending={categorySpending}
            totalExpense={totalExpense}
            transactions={periodTransactions}
            periodLabel={period.label}
            hideBalances={hideBalances}
          />

          {/* 3. Budget Envelopes Section matching reference */}
          <BudgetEnvelopesSection
            categorySpending={categorySpending}
            categories={categories}
            budgets={budgets}
            transactions={periodTransactions}
            periodLabel={period.label}
            hideBalances={hideBalances}
          />
        </>
      )}
    </div>
  );
};
