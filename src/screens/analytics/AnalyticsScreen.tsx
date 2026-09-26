import React, { useState, useMemo } from 'react';
import { ChevronDown, BarChart3, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { FinanceSummary, Transaction, Category, Budget, IntegerMoney, Account } from '../../domain/models/types';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { CalendarPicker, DateRange } from '../../components/common/CalendarPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import { SpendingPaceCard } from './SpendingPaceCard';
import { SpendingVelocityCard } from './SpendingVelocityCard';
import { NeedsWantsCapsule } from './NeedsWantsCapsule';
import { CategoryDonutDial } from './CategoryDonutDial';
import { BudgetEnvelopesSection } from './BudgetEnvelopesSection';
import { SavingsRateRing } from './SavingsRateRing';
import { CashFlowBarChart, MonthlyCashFlowPoint } from './CashFlowBarChart';
import { TopMerchantsCard, MerchantSpendItem } from './TopMerchantsCard';
import { SpendingCalendar } from './SpendingCalendar';
import { DateSpendDrawer } from './DateSpendDrawer';
import { TransactionDetailDrawer } from '../activity/TransactionDetailDrawer';
import { EditTransactionDrawer } from '../activity/EditTransactionDrawer';
import { formatDateRangeDDMMYYYY } from '../../domain/engine/dateUtils';
import { CardShell } from '../../components/ui/CardShell';
import { cn } from '../../lib/utils';

interface AnalyticsScreenProps {
  summary: FinanceSummary | null;
  transactions: Transaction[];
  categories?: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  hideBalances: boolean;
  onOpenAddModal?: () => void;
  onNavigate?: (tab: 'home' | 'activity' | 'analytics' | 'profile') => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => Promise<unknown>;
}

export type AnalyticsTimeframe = 'WEEK' | 'MONTH' | 'YEAR';
export type DomainTab = 'spending' | 'income' | 'habits';

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
    const duration = end.getTime() - start.getTime();

    // Compact date label (e.g. '01/06 – 25/09')
    const sDDMM = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
    const eDDMM = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`;
    const label = `${sDDMM} – ${eDDMM}`;

    return {
      start,
      end,
      label,
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

    const sDDMM = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
    const eDDMM = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`;
    const label = `${sDDMM} – ${eDDMM}`;

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

  // MONTH: E.g., 'Sep 2026'
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
  accounts = [],
  budgets = [],
  hideBalances,
  onOpenAddModal,
  onNavigate,
  onSelectTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<DomainTab>('spending');
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('MONTH');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);

  // Nested Drawer Stack States: Inspecting and Editing a transaction directly within Analytics drawers
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Period details (start, end, label, and previous period bounds)
  const period = useMemo(
    () => getPeriodDetails(timeframe, customRange, referenceDate),
    [timeframe, customRange, referenceDate]
  );

  // Active preset key computation for CalendarPicker active highlight
  const activePresetKey = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (customRange) {
      const ninetyDaysAgoStr = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      if (customRange.endDate === todayStr && customRange.startDate === ninetyDaysAgoStr) {
        return 'LAST_90_DAYS';
      }
      return 'CUSTOM';
    }

    const now = new Date();
    const refMonth = referenceDate.getMonth();
    const refYear = referenceDate.getFullYear();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    if (timeframe === 'WEEK') return 'THIS_WEEK';
    if (timeframe === 'YEAR') return 'THIS_YEAR';
    if (timeframe === 'MONTH') {
      if (refYear === nowYear && refMonth === nowMonth) return 'THIS_MONTH';
      const lastMonthDate = new Date(nowYear, nowMonth - 1, 1);
      if (refYear === lastMonthDate.getFullYear() && refMonth === lastMonthDate.getMonth()) {
        return 'LAST_MONTH';
      }
    }

    return null;
  }, [timeframe, customRange, referenceDate]);

  // Transactions belonging to active period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= period.start && txDate <= period.end;
    });
  }, [transactions, period]);

  // Previous period transactions for comparative metrics
  const prevPeriodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= period.prevStart && txDate <= period.prevEnd;
    });
  }, [transactions, period]);

  // Outflow (Expenses) & Inflow (Income) for active period
  const totalExpense = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const totalIncome = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  // Previous Period Rates
  const prevTotalExpense = useMemo(() => {
    return prevPeriodTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevPeriodTransactions]);

  const prevTotalIncome = useMemo(() => {
    return prevPeriodTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevPeriodTransactions]);

  const prevSavingsRate = useMemo(() => {
    if (prevTotalIncome <= 0) return null;
    return Math.round(((prevTotalIncome - prevTotalExpense) / prevTotalIncome) * 100);
  }, [prevTotalIncome, prevTotalExpense]);

  // Total Budget Ceiling: derived from "ALL" budget or sum of category limits (returns 0 if unset)
  const totalBudget = useMemo(() => {
    const overall = budgets.find((b) => b.categoryId === 'ALL');
    if (overall && overall.limitAmount > 0) return overall.limitAmount;
    const categoryTotal = budgets
      .filter((b) => b.categoryId !== 'ALL' && b.limitAmount > 0)
      .reduce((sum, b) => sum + b.limitAmount, 0);
    return categoryTotal;
  }, [budgets]);

  // Days Calculation for Daily Pace Card
  const now = new Date();
  const isPeriodCurrent = now >= period.start && now <= period.end;
  const totalDaysInPeriod = Math.max(1, Math.round((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingDays = isPeriodCurrent
    ? Math.max(1, Math.round((period.end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : totalDaysInPeriod;

  // Category breakdown for active period (handles multi-category bill splits)
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

  // Month-over-Month Category Deltas vs 3-month trailing average
  const categoryDeltas = useMemo(() => {
    const deltas = new Map<string, { deltaAmount: number; deltaPercent: number; isIncrease: boolean; isNew?: boolean }>();

    // Compute previous 3 months spending per category
    const threeMonthsAgo = new Date(period.start);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const pastTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= threeMonthsAgo && d < period.start && t.type === 'EXPENSE';
    });

    categorySpending.forEach((curCat) => {
      let pastSum = 0;
      let pastMonthsWithSpend = new Set<string>();

      for (const t of pastTransactions) {
        let amt = 0;
        if (t.isSplit && t.splits) {
          const split = t.splits.find((s) => s.categoryId === curCat.id);
          if (split) amt = split.amount;
        } else if (t.categoryId === curCat.id) {
          amt = t.amount;
        }

        if (amt > 0) {
          pastSum += amt;
          const monthKey = t.date.slice(0, 7);
          pastMonthsWithSpend.add(monthKey);
        }
      }

      if (pastSum === 0) {
        deltas.set(curCat.id, { deltaAmount: curCat.total, deltaPercent: 100, isIncrease: true, isNew: true });
        return;
      }

      const denominatorMonths = Math.max(1, pastMonthsWithSpend.size);
      const monthlyAvg = Math.round(pastSum / denominatorMonths);
      const deltaAmount = curCat.total - monthlyAvg;
      const deltaPercent = Math.round((deltaAmount / monthlyAvg) * 100);

      deltas.set(curCat.id, {
        deltaAmount,
        deltaPercent,
        isIncrease: deltaAmount >= 0,
      });
    });

    return deltas;
  }, [categorySpending, transactions, period.start]);

  // 50/30/20 Needs vs Wants vs Savings Breakdown
  const { needsAmount, wantsAmount, savingsAmount } = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let explicitSavings = 0;

    for (const t of periodTransactions) {
      if (t.type === 'TRANSFER') {
        explicitSavings += t.amount;
        continue;
      }
      if (t.type !== 'EXPENSE') continue;

      const catName = categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() || '';

      // Classification heuristics
      if (
        t.categoryId === 'cat_groceries' ||
        t.categoryId === 'cat_bills' ||
        t.categoryId === 'cat_fuel' ||
        catName.includes('rent') ||
        catName.includes('bill') ||
        catName.includes('utility') ||
        catName.includes('grocery') ||
        catName.includes('fuel') ||
        catName.includes('emi')
      ) {
        needs += t.amount;
      } else if (
        catName.includes('invest') ||
        catName.includes('saving') ||
        catName.includes('deposit')
      ) {
        explicitSavings += t.amount;
      } else {
        wants += t.amount;
      }
    }

    // Unspent income surplus retained in current period
    const netRetainedIncome = totalIncome > totalExpense ? (totalIncome - totalExpense) : 0;
    const totalSavings = explicitSavings + netRetainedIncome;

    return {
      needsAmount: needs,
      wantsAmount: wants,
      savingsAmount: totalSavings,
    };
  }, [periodTransactions, categories, totalIncome, totalExpense]);

  // Top Merchants Calculation (Clean merchant names without manual pre-truncation)
  const topMerchants = useMemo<MerchantSpendItem[]>(() => {
    const merchantMap = new Map<string, { amount: IntegerMoney; count: number }>();

    for (const t of periodTransactions) {
      if (t.type !== 'EXPENSE') continue;
      const rawName = (t.merchantName || 'Unnamed Expense').trim();
      const current = merchantMap.get(rawName) || { amount: 0, count: 0 };
      current.amount += t.amount;
      current.count += 1;
      merchantMap.set(rawName, current);
    }

    return Array.from(merchantMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodTransactions]);

  // Historical Cash Flow Points (6 months trailing or 6 weeks depending on timeframe)
  const cashFlowData = useMemo<MonthlyCashFlowPoint[]>(() => {
    const points: MonthlyCashFlowPoint[] = [];

    if (timeframe === 'WEEK') {
      // Last 6 weeks with DD-MM – DD-MM date ranges
      const ref = new Date(period.start);
      for (let i = 5; i >= 0; i--) {
        const wStart = new Date(ref);
        wStart.setDate(ref.getDate() - i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 6);
        wEnd.setHours(23, 59, 59, 999);

        let income = 0;
        let expense = 0;
        for (const t of transactions) {
          const d = new Date(t.date);
          if (d >= wStart && d <= wEnd) {
            if (t.type === 'INCOME') income += t.amount;
            if (t.type === 'EXPENSE') expense += t.amount;
          }
        }
        const sDay = String(wStart.getDate()).padStart(2, '0');
        const sMonth = String(wStart.getMonth() + 1).padStart(2, '0');
        const eDay = String(wEnd.getDate()).padStart(2, '0');
        const eMonth = String(wEnd.getMonth() + 1).padStart(2, '0');
        points.push({
          label: `${sDay}/${sMonth}`,
          fullLabel: `${sDay}/${sMonth}–${eDay}/${eMonth}`,
          income,
          expense,
        });
      }
    } else if (timeframe === 'YEAR') {
      // 12 months of the selected year
      const yearNum = period.start.getFullYear();
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(yearNum, m, 1, 0, 0, 0);
        const mEnd = new Date(yearNum, m + 1, 0, 23, 59, 59);

        let income = 0;
        let expense = 0;
        for (const t of transactions) {
          const d = new Date(t.date);
          if (d >= mStart && d <= mEnd) {
            if (t.type === 'INCOME') income += t.amount;
            if (t.type === 'EXPENSE') expense += t.amount;
          }
        }
        points.push({
          label: mStart.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: formatDateRangeDDMMYYYY(mStart, mEnd),
          income,
          expense,
        });
      }
    } else {
      // Last 6 months
      const ref = new Date(period.start);
      for (let i = 5; i >= 0; i--) {
        const mDate = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
        const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1, 0, 0, 0);
        const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59);

        let income = 0;
        let expense = 0;
        for (const t of transactions) {
          const d = new Date(t.date);
          if (d >= mStart && d <= mEnd) {
            if (t.type === 'INCOME') income += t.amount;
            if (t.type === 'EXPENSE') expense += t.amount;
          }
        }
        points.push({
          label: mStart.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: formatDateRangeDDMMYYYY(mStart, mEnd),
          income,
          expense,
        });
      }
    }

    return points;
  }, [transactions, period.start, timeframe]);

  // Daily Spending Map for Calendar Grid
  const dailySpendingMap = useMemo(() => {
    const map = new Map<string, IntegerMoney>();
    for (const t of periodTransactions) {
      if (t.type !== 'EXPENSE') continue;
      const dateKey = t.date.slice(0, 10);
      map.set(dateKey, (map.get(dateKey) || 0) + t.amount);
    }
    return map;
  }, [periodTransactions]);

  // Handle timeframe segment clicks
  const handleTimeframeChange = (t: AnalyticsTimeframe) => {
    setTimeframe(t);
    setCustomRange(null);
    setReferenceDate(new Date());
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200 select-none">
      {/* 1. Screen-Specific Header (Level 1 Navigation Invariant: No Top Back Button) */}
      <header className="flex h-14 items-center justify-between relative">
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
          Analytics
        </h1>

        {activeTab !== 'habits' ? (
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
                    activePreset={activePresetKey || undefined}
                    onSelectRange={(range) => {
                      setCustomRange(range);
                      setIsDatePickerOpen(false);
                    }}
                    onPresetSelect={(preset) => {
                      const now = new Date();
                      if (preset === 'THIS_WEEK') {
                        setTimeframe('WEEK');
                        setCustomRange(null);
                        setReferenceDate(now);
                      } else if (preset === 'THIS_MONTH') {
                        setTimeframe('MONTH');
                        setCustomRange(null);
                        setReferenceDate(now);
                      } else if (preset === 'LAST_MONTH') {
                        setTimeframe('MONTH');
                        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        setReferenceDate(lastM);
                        setCustomRange(null);
                      } else if (preset === 'THIS_YEAR') {
                        setTimeframe('YEAR');
                        setCustomRange(null);
                        setReferenceDate(now);
                      } else if (preset === 'LAST_90_DAYS') {
                        setTimeframe('MONTH');
                        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        setCustomRange({
                          startDate: ninetyDaysAgo.toISOString().slice(0, 10),
                          endDate: now.toISOString().slice(0, 10),
                        });
                      } else if (preset === 'ALL') {
                        setTimeframe('MONTH');
                        let earliestDate = '2026-01-01';
                        if (transactions && transactions.length > 0) {
                          const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
                          const firstTxDate = sorted[0].date.slice(0, 10);
                          if (firstTxDate > earliestDate) {
                            earliestDate = firstTxDate;
                          }
                        }
                        setCustomRange({
                          startDate: earliestDate,
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
        ) : (
          <div className="flex h-10 items-center gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 text-xs font-semibold text-emerald-500 dark:text-emerald-400 shadow-sm">
            <Calendar className="size-3.5" />
            <span>Habit Heatmap</span>
          </div>
        )}
      </header>

      {/* 2. In-Page Domain Segmented Tabs (Spending | Income | Habits) */}
      <SegmentedTabs
        tabs={[
          { key: 'spending', label: 'Spending' },
          { key: 'income', label: 'Income' },
          { key: 'habits', label: 'Habits' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DomainTab)}
        size="md"
      />

      {/* 4. Tab 1: SPENDING DOMAIN */}
      {activeTab === 'spending' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
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
              {/* Daily Safe to Spend Hero Pace Card */}
              <SpendingPaceCard
                monthlyBudget={totalBudget}
                monthToDateSpending={totalExpense}
                remainingDays={remainingDays}
                totalDaysInPeriod={totalDaysInPeriod}
                hideBalances={hideBalances}
                timeframeLabel={period.label}
                onConfigureBudget={() => onNavigate?.('profile')}
              />

              {/* Spending Velocity Spline Curve */}
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

              {/* 50 / 30 / 20 Rule Allocation Capsule */}
              <NeedsWantsCapsule
                needsAmount={needsAmount}
                wantsAmount={wantsAmount}
                savingsAmount={savingsAmount}
                totalSpending={totalExpense}
                hideBalances={hideBalances}
              />

              {/* Category Breakdown Donut Dial with MoM Deltas */}
              <CategoryDonutDial
                categorySpending={categorySpending}
                totalExpense={totalExpense}
                transactions={periodTransactions}
                periodLabel={period.label}
                hideBalances={hideBalances}
                categoryDeltas={categoryDeltas}
              />

              {/* Budget Envelopes Section with MoM Deltas */}
              <BudgetEnvelopesSection
                categorySpending={categorySpending}
                categories={categories}
                budgets={budgets}
                transactions={periodTransactions}
                periodLabel={period.label}
                hideBalances={hideBalances}
                categoryDeltas={categoryDeltas}
              />
            </>
          )}
        </div>
      )}

      {/* 5. Tab 2: INCOME & SAVINGS DOMAIN */}
      {activeTab === 'income' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {totalIncome === 0 && totalExpense === 0 ? (
            <EmptyState
              icon={Wallet}
              badge={period.label}
              title="No Inflow Activity"
              description={`No income or expense records found for ${period.label}. Add income transactions to unlock cash flow retention analysis.`}
              actionLabel={onOpenAddModal ? "+ Add Income" : undefined}
              onAction={onOpenAddModal}
              className="mt-2"
            />
          ) : (
            <>
              {/* Savings Rate Progress Ring */}
              <SavingsRateRing
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                previousPeriodRate={prevSavingsRate}
                hideBalances={hideBalances}
              />

              {/* Side-by-Side Monthly Cash Flow Bar Chart */}
              <CashFlowBarChart
                data={cashFlowData}
                hideBalances={hideBalances}
                timeframeLabel={timeframe === 'WEEK' ? 'Weekly Cash Flow' : 'Monthly Cash Flow'}
              />

              {/* Top Spending Destinations Ranking */}
              <TopMerchantsCard
                merchants={topMerchants}
                hideBalances={hideBalances}
                onSelectMerchant={(_merchantName) => {
                  onNavigate?.('activity');
                }}
              />
            </>
          )}
        </div>
      )}

      {/* 6. Tab 3: HABITS & PATTERNS DOMAIN */}
      {activeTab === 'habits' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Monthly Spending Heatmap Calendar */}
          <SpendingCalendar
            year={period.start.getFullYear()}
            month={period.start.getMonth()}
            dailySpending={dailySpendingMap}
            hideBalances={hideBalances}
            onLongPressDate={(dateStr) => {
              setSelectedCalendarDate(dateStr);
              setIsDateDrawerOpen(true);
            }}
            onPrevMonth={() =>
              setReferenceDate((prev) => {
                const target = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                return target.getFullYear() < 2026 ? prev : target;
              })
            }
            onNextMonth={() =>
              setReferenceDate((prev) => {
                const now = new Date();
                const target = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                if (
                  target.getFullYear() > now.getFullYear() ||
                  (target.getFullYear() === now.getFullYear() && target.getMonth() > now.getMonth())
                ) {
                  return prev;
                }
                return target;
              })
            }
          />

          {/* Behavioral Insights Banner */}
          <CardShell padding="p-4" className="select-none">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-theme-primary">Financial Habit Rhythm</h4>
                <p className="text-[11px] text-theme-muted mt-0.5 leading-relaxed">
                  Maintaining zero-spend days allows your daily spending pace to adjust higher on weekends.
                </p>
              </div>
            </div>
          </CardShell>
        </div>
      )}

      {/* 7. Level 1 Sub-Drawer: Date Spend Detail Drawer (Triggered by Long-Pressing any Calendar Date) */}
      <DateSpendDrawer
        isOpen={isDateDrawerOpen}
        onClose={() => setIsDateDrawerOpen(false)}
        dateStr={selectedCalendarDate}
        transactions={transactions}
        hideBalances={hideBalances}
        onSelectTransaction={(tx) => {
          setInspectingTx(tx);
        }}
      />

      {/* 8. Level 2 Stacked Drawer: Transaction Detail Drawer (Opens on top of active drawer) */}
      <TransactionDetailDrawer
        isOpen={!!inspectingTx}
        transaction={inspectingTx}
        categories={categories}
        accounts={accounts}
        hideBalances={hideBalances}
        onEdit={(tx) => setEditingTx(tx)}
        onDelete={async (tx) => {
          if (onDeleteTransaction) {
            await onDeleteTransaction(tx.id);
          }
          setInspectingTx(null);
        }}
        onClose={() => setInspectingTx(null)}
      />

      {/* 9. Level 3 Stacked Drawer: Edit Transaction Drawer (Opens on top of Transaction Detail) */}
      <EditTransactionDrawer
        isOpen={!!editingTx}
        transaction={editingTx}
        categories={categories}
        accounts={accounts}
        onSave={async (updates) => {
          if (editingTx && onUpdateTransaction) {
            await onUpdateTransaction(editingTx.id, updates);
            setEditingTx(null);
            setInspectingTx((prev) => (prev ? { ...prev, ...updates } : null));
          }
        }}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};
