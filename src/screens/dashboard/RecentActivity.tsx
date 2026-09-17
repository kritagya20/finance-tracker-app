import React from 'react';
import { Transaction } from '../../domain/models/types';
import { TransactionItem } from '../../components/common/TransactionItem';

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
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Recent Activity</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-medium text-violet-600 dark:text-violet-400 active:text-violet-500 hover:underline"
        >
          See All
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {transactions.slice(0, 5).map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            variant="home"
            hideBalances={hideBalances}
            onClick={onSeeAll}
          />
        ))}
      </ul>
    </section>
  );
};
