import React, { useState, useMemo } from 'react';
import { AlertTriangle, Check, ChevronRight, TrendingUp } from 'lucide-react';
import { Budget, Category, Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategorySpendItem } from './CategoryDonutDial';
import { CategorySpendDrawer } from './CategorySpendDrawer';

interface BudgetEnvelopesSectionProps {
  categorySpending: CategorySpendItem[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  periodLabel?: string;
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
  transactions,
  periodLabel,
  hideBalances,
}) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<EnvelopeItem | null>(null);

  const envelopes = useMemo<EnvelopeItem[]>(() => {
    const budgetMap = new Map<string, Budget>();
    budgets.forEach((b) => mapBudget(budgetMap, b));

    function mapBudget(map: Map<string, Budget>, b: Budget) {
      map.set(b.categoryId, b);
    }

    const expenseCategories = categories.filter((c) => !c.isIncome);

    const items: EnvelopeItem[] = expenseCategories
      .map((cat) => {
        const spendRecord = categorySpending.find((s) => s.id === cat.id);
        const spent = spendRecord ? spendRecord.total : 0;
        const configuredBudget = budgetMap.get(cat.id);

        let limit = configuredBudget ? configuredBudget.limitAmount : 0;
        if (!limit) {
          if (cat.id === 'cat_dining' || cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('food')) {
            limit = 1500000; // ₹15,000
          } else if (cat.id === 'cat_shopping' || cat.name.toLowerCase().includes('shopping')) {
            limit = 500000; // ₹5,000
          } else if (cat.id === 'cat_fuel' || cat.name.toLowerCase().includes('transport') || cat.name.toLowerCase().includes('travel')) {
            limit = 800000; // ₹8,000
          } else if (cat.id === 'cat_bills' || cat.name.toLowerCase().includes('bills')) {
            limit = 600000; // ₹6,000
          } else {
            limit = Math.max(spent * 1.25, 500000);
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
      .sort((a, b) => b.percent - a.percent);

    return items;
  }, [categorySpending, categories, budgets]);

  if (envelopes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 select-none">
      {/* 1. Section Title matching budget_envelopes_reference.png */}
      <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white px-1">
        Budget Envelopes
      </h2>

      {/* 2. Distinct Envelope Cards */}
      <div className="flex flex-col gap-2.5">
        {envelopes.map((env) => {
          const isOver = env.status === 'OVER_BUDGET';
          const isNear = env.status === 'NEAR_LIMIT';

          return (
            <div
              key={env.categoryId}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedEnvelope(env)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedEnvelope(env);
                }
              }}
              className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] shadow-md overflow-hidden transition-all cursor-pointer hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              {/* Card Body (2 Compact Tiers) */}
              <div className="p-3.5 sm:p-4 space-y-2">
                {/* Top Row: Category Title & Percentage */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                    {env.categoryName}
                  </span>

                  {/* Percentage & Chevron on Right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-bold font-mono ${
                        isOver
                          ? 'text-rose-400'
                          : isNear
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {env.percent}%
                    </span>
                    <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Bottom Row: Spent of Limit & Compressed Status Tag */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
                  <div className="truncate">
                    <span className="font-mono text-slate-900 dark:text-slate-200 font-medium">
                      {hideBalances ? '••••••' : formatCurrency(env.spent, undefined, false)}
                    </span>{' '}
                    <span>of </span>
                    <span className="font-mono">
                      {formatCurrency(env.limit, undefined, false)}
                    </span>{' '}
                    <span>limit</span>
                  </div>

                  {/* Compressed Status Badge */}
                  {isOver ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                      <AlertTriangle className="size-2.5 shrink-0" />
                      <span>
                        <span className="font-mono">{formatCurrency(env.overAmount, undefined, false)}</span> over
                      </span>
                    </span>
                  ) : isNear ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                      <TrendingUp className="size-2.5 shrink-0" />
                      <span>Near limit</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                      <Check className="size-2.5 shrink-0" />
                      <span>Healthy</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Full-Width Flush Bottom Rail (Option A) */}
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/80">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isOver
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : isNear
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                      : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, env.percent))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Deep Inspection Category Spend Drawer */}
      {selectedEnvelope && (
        <CategorySpendDrawer
          isOpen={!!selectedEnvelope}
          onClose={() => setSelectedEnvelope(null)}
          categoryId={selectedEnvelope.categoryId}
          categoryName={selectedEnvelope.categoryName}
          totalSpent={selectedEnvelope.spent}
          budgetLimit={selectedEnvelope.limit}
          periodLabel={periodLabel}
          transactions={transactions}
          hideBalances={hideBalances}
        />
      )}
    </section>
  );
};
