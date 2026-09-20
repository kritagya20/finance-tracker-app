import React from 'react';
import { FinanceSummary, Transaction } from '../../domain/models/types';
import { BalanceCard } from './BalanceCard';
import { BudgetProgressBar } from './BudgetProgressBar';
import { RecentActivity } from './RecentActivity';
import { NavTab } from '../../components/layout/BottomNav';

interface DashboardScreenProps {
  summary: FinanceSummary | null;
  transactions: Transaction[];
  hideBalances: boolean;
  onOpenAddModal?: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  summary,
  transactions,
  hideBalances,
  onOpenAddModal,
  onNavigate,
  onSelectTransaction,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <BalanceCard summary={summary} hideBalances={hideBalances} />
      <BudgetProgressBar summary={summary} hideBalances={hideBalances} />
      <RecentActivity
        transactions={transactions}
        hideBalances={hideBalances}
        onSeeAll={() => onNavigate('activity')}
        onSelectTransaction={onSelectTransaction}
        onOpenAddModal={onOpenAddModal}
      />
    </div>
  );
};
