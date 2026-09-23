import React, { useState, useMemo } from 'react';
import { ChevronDown, BarChart3, TrendingUp, Calendar, Wallet } from 'lucide-react';
import { FinanceSummary, Transaction, Category, Budget, IntegerMoney } from '../../domain/models/types';
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
  const [activeTab, setActiveTab] = useState<DomainTab>('spending');
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('MONTH');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  // Period details (start, end, label, and previous period bounds)
  const period = useMemo(
    () => getPeriodDetails(timeframe, customRange, referenceDate),
    [timeframe, customRange, referenceDate]
  );

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

  // Total Budget Ceiling: derived from "ALL" budget or sum of category limits, fallback to ₹35,000
  const totalBudget = useMemo(() => {
    const overall = budgets.find((b) => b.categoryId === 'ALL');
    if (overall && overall.limitAmount > 0) return overall.limitAmount;
    return 3500000; // ₹35,000 (paise)
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
    let savings = 0;

    for (const t of periodTransactions) {
      if (t.type === 'TRANSFER') {
        savings += t.amount;
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
        savings += t.amount;
      } else {
        wants += t.amount;
      }
    }

    // Also account for positive net savings from income
    if (totalIncome > totalExpense) {
      savings += (totalIncome - totalExpense);
    }

    return {
      needsAmount: needs,
      wantsAmount: wants,
      savingsAmount: savings,
    };
  }, [periodTransactions, categories, totalIncome, totalExpense]);

  // Top Merchants Calculation
  const topMerchants = useMemo<MerchantSpendItem[]>(() => {
    const merchantMap = new Map<string, { amount: IntegerMoney; count: number }>();

    for (const t of periodTransactions) {
      if (t.type !== 'EXPENSE') continue;
      const rawName = (t.merchantName || 'Unnamed').trim();
      const name = rawName.length > 22 ? rawName.slice(0, 20) + '…' : rawName;

      const current = merchantMap.get(name) || { amount: 0, count: 0 };
      current.amount += t.amount;
      current.count += 1;
      merchantMap.set(name, current);
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
      // Last 6 weeks
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
        points.push({
          label: `W${6 - i}`,
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

      {/* 3. Global Timeframe Selector (Week, Month, Year) */}
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
          {periodTransactions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              badge={period.label}
              title="No Activity Logged"
              description={`Start logging your daily purchases to build your spending heatmap and discover weekly rhythm patterns.`}
              actionLabel={onOpenAddModal ? "+ Log an Expense" : undefined}
              onAction={onOpenAddModal}
              className="mt-2"
            />
          ) : (
            <>
              {/* Monthly Spending Heatmap Calendar */}
              <SpendingCalendar
                year={period.start.getFullYear()}
                month={period.start.getMonth()}
                dailySpending={dailySpendingMap}
                hideBalances={hideBalances}
              />

              {/* Behavioral Insights Banner */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 shadow-sm select-none">
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
