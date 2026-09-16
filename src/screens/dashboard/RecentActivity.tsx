import React from 'react';
import { Transaction } from '../../domain/models/types';
import { getCategoryById } from '../../domain/engine/categories';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { cn } from '../../lib/utils';

interface RecentActivityProps {
  transactions: Transaction[];
  hideBalances: boolean;
  onSeeAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  hideBalances,
  onSeeAll,
}) => {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-100">Recent Activity</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-medium text-violet-400 active:text-violet-300 hover:underline"
        >
          See All
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {transactions.slice(0, 5).map((tx) => {
          const category = getCategoryById(tx.categoryId);
          const isIncome = tx.type === 'INCOME';

          // Format relative or standard timestamp
          const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <li
              key={tx.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-3 hover:bg-slate-850/80 transition-colors"
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  category.bgClass,
                  category.textClass
                )}
              >
                <CategoryIcon name={category.iconName} size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {tx.merchantName}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      tx.source === 'AUTO_SMS'
                        ? 'bg-violet-500/15 text-violet-300'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
                  </span>
                  <span className="truncate text-[11px] text-slate-400">
                    {dateStr}
                  </span>
                </div>
              </div>

              <p
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  isIncome ? 'text-emerald-400' : 'text-slate-100'
                )}
              >
                {hideBalances
                  ? '••••••'
                  : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
