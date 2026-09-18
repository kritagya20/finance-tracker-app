import React from 'react';
import { Transaction } from '../../domain/models/types';
import { TransactionItem } from '../../components/common/TransactionItem';

interface RecentActivityProps {
  transactions: Transaction[];
  hideBalances: boolean;
  onSeeAll: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  hideBalances,
  onSeeAll,
  onSelectTransaction,
}) => {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-theme-primary">Recent Activity</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[44px] flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400 active:text-violet-500 hover:underline"
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
            onClick={(clickedTx) => {
              if (onSelectTransaction) {
                onSelectTransaction(clickedTx);
              } else {
                onSeeAll();
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
};
