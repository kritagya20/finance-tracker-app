import React, { useMemo } from 'react';
import { AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { Budget, Category } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategorySpendItem } from './CategoryDonutDial';

interface BudgetEnvelopesSectionProps {
  categorySpending: CategorySpendItem[];
  categories: Category[];
  budgets: Budget[];
  hideBalances: boolean;
}

interface EnvelopeItem {
  categoryId: string;
  categoryName: string;
  spent: number;
  limit: number;
  percent: number;
  status: 'HEALTHY' | 'NEAR_LIMIT' | 'OVER_BUDGET';
  overAmount: number;
}

export const BudgetEnvelopesSection: React.FC<BudgetEnvelopesSectionProps> = ({
  categorySpending,
  categories,
  budgets,
  hideBalances,
}) => {
  // Compute envelope progress for each category
  const envelopes = useMemo<EnvelopeItem[]>(() => {
    // Map existing budgets by categoryId
    const budgetMap = new Map<string, Budget>();
    budgets.forEach((b) => budgetMap.set(b.categoryId, b));

    // Derive envelopes for all expense categories that either have a budget or have spending
    const expenseCategories = categories.filter((c) => !c.isIncome);

    const items: EnvelopeItem[] = expenseCategories
      .map((cat) => {
        const spendRecord = categorySpending.find((s) => s.id === cat.id);
        const spent = spendRecord ? spendRecord.total : 0;
        const configuredBudget = budgetMap.get(cat.id);

        // Limit in paise (e.g. from configured budget, or fallback default based on category type)
        let limit = configuredBudget ? configuredBudget.limitAmount : 0;
        if (!limit) {
          // Dynamic sensible fallbacks matching reference
          if (cat.id === 'cat_dining' || cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('food')) {
            limit = 1500000; // ₹15,000
          } else if (cat.id === 'cat_shopping' || cat.name.toLowerCase().includes('shopping')) {
            limit = 500000; // ₹5,000
          } else if (cat.id === 'cat_fuel' || cat.name.toLowerCase().includes('transport')) {
            limit = 800000; // ₹8,000
          } else if (cat.id === 'cat_bills' || cat.name.toLowerCase().includes('bills')) {
            limit = 600000; // ₹6,000
          } else {
            limit = Math.max(spent * 1.2, 500000); // 120% of spend or ₹5,000
          }
        }

        const percent = Math.round((spent / limit) * 100);
        const overAmount = Math.max(0, spent - limit);

        let status: 'HEALTHY' | 'NEAR_LIMIT' | 'OVER_BUDGET' = 'HEALTHY';
        if (spent > limit) {
          status = 'OVER_BUDGET';
        } else if (percent >= 75) {
          status = 'NEAR_LIMIT';
        }

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          spent,
          limit,
          percent,
          status,
          overAmount,
        };
      })
      .filter((env) => env.spent > 0 || budgetMap.has(env.categoryId))
      .sort((a, b) => b.percent - a.percent); // Sort by highest usage first

    return items;
  }, [categorySpending, categories, budgets]);

  return (
    <section className="space-y-3 select-none">
      {/* 1. Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold tracking-tight text-theme-primary">
          Budget Envelopes
        </h2>
        <span className="text-xs text-theme-muted font-medium">
          {envelopes.length} active
        </span>
      </div>

      {/* 2. Stack of Envelope Cards */}
      {envelopes.length === 0 ? (
        <div className="rounded-2xl border border-theme-border bg-theme-card p-6 text-center text-xs text-theme-muted">
          No budget envelopes configured yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {envelopes.map((env) => {
            const isOver = env.status === 'OVER_BUDGET';
            const isNear = env.status === 'NEAR_LIMIT';

            return (
              <div
                key={env.categoryId}
                className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm space-y-2.5 transition-colors"
              >
                {/* Top Row: Title, Status Badge & Percentage */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-semibold text-theme-primary truncate">
                      {env.categoryName}
                    </span>

                    {/* Contextual Status Badge matching reference image 3 */}
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 shrink-0">
                        <AlertTriangle className="size-3 shrink-0" />
                        <span>{formatCurrency(env.overAmount)} over</span>
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shrink-0">
                        <TrendingUp className="size-3 shrink-0" />
                        <span>Near limit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                        <Check className="size-3 shrink-0" />
                        <span>Healthy</span>
                      </span>
                    )}
                  </div>

                  {/* Percentage on Right */}
                  <span
                    className={`text-sm font-bold font-mono tabular-nums shrink-0 ${
                      isOver
                        ? 'text-rose-500 dark:text-rose-400'
                        : isNear
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-emerald-500 dark:text-emerald-400'
                    }`}
                  >
                    {env.percent}%
                  </span>
                </div>

                {/* Middle Row: Progress Bar Track */}
                <div className="h-2 w-full rounded-full bg-theme-card-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isOver
                        ? 'bg-rose-500'
                        : isNear
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, env.percent))}%` }}
                  />
                </div>

                {/* Bottom Row: Monospace Spent of Limit */}
                <div className="flex items-center justify-between text-xs text-theme-muted font-medium">
                  <span className="font-mono">
                    {hideBalances ? '••••••' : formatCurrency(env.spent)}{' '}
                    <span className="text-theme-muted/70 font-sans">
                      of {formatCurrency(env.limit)} limit
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
