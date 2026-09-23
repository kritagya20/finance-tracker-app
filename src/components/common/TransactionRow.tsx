import React from 'react';
import { ChevronRight, Split } from 'lucide-react';
import { Category, Transaction } from '../../domain/models/types';
import { getCategoryById } from '../../domain/engine/categories';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { formatDateTimeDDMMYYYY } from '../../domain/engine/dateUtils';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '../../lib/utils';

export interface TransactionRowItem {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  categoryId: string;
  isSplit?: boolean;
  splits?: Array<{ id?: string; categoryId: string; amount: number; note?: string }>;
  originalTx?: Transaction;
}

export interface TransactionRowProps {
  item: TransactionRowItem;
  category?: Category;
  hideBalances?: boolean;
  onClick?: (item: TransactionRowItem) => void;
  className?: string;
  showDate?: boolean;
}

/**
 * Standardized itemized transaction row for inspection drawers (CategorySpendDrawer,
 * VelocitySpendDrawer) and drill-down views.
 */
export const TransactionRow: React.FC<TransactionRowProps> = ({
  item,
  category: propCategory,
  hideBalances = false,
  onClick,
  className,
  showDate = true,
}) => {
  const cat = propCategory || getCategoryById(item.categoryId);

  const formattedDate = React.useMemo(() => {
    return formatDateTimeDDMMYYYY(item.date);
  }, [item.date]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(item);
        }
      }}
      className={cn(
        'group flex items-center justify-between p-3 rounded-2xl bg-theme-card border border-theme-border/60 hover:border-violet-500/40 hover:bg-theme-card-subtle/70 active:scale-[0.99] transition-all cursor-pointer shadow-xs select-none',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'flex size-9 sm:size-10 items-center justify-center rounded-xl shrink-0 border shadow-xs',
            cat?.bgClass || 'bg-violet-500/15',
            cat?.textClass || 'text-violet-400',
            'border-current/20'
          )}
        >
          {cat?.iconName ? (
            <CategoryIcon name={cat.iconName} className="size-4 sm:size-5 text-current" />
          ) : (
            <span className="text-xs">💳</span>
          )}
        </div>

        <div className="flex flex-col min-w-0 text-left">
          <span className="text-xs font-semibold text-theme-primary truncate max-w-[180px] sm:max-w-[220px]">
            {item.merchantName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {showDate && (
              <span className="text-[11px] font-mono text-theme-muted truncate">
                {formattedDate}
              </span>
            )}
            {item.isSplit && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/25">
                <Split className="size-2 shrink-0" />
                SPLIT
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pl-2">
        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-theme-primary">
          {hideBalances ? '••••••' : formatCurrency(item.amount, undefined, false)}
        </span>
        <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
