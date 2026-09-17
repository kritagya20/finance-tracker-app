import React from 'react';
import { TransactionItem } from '../../components/common/TransactionItem';
import { Transaction, Category } from '../../domain/models/types';
import { type LucideIcon } from 'lucide-react';

export interface SwipeableTransactionItemProps {
  tx: Transaction;
  category?: Category;
  iconComp?: LucideIcon;
  hideBalances: boolean;
  onDelete: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

/**
 * Backwards-compatible wrapper delegating directly to the unified TransactionItem component
 */
export const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({
  tx,
  category,
  hideBalances,
  onDelete,
  onEdit,
}) => {
  return (
    <TransactionItem
      transaction={tx}
      category={category}
      hideBalances={hideBalances}
      variant="activity"
      onDelete={onDelete}
      onEdit={onEdit}
    />
  );
};

export default SwipeableTransactionItem;
