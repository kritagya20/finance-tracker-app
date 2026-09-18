import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { getCategoryById } from '../../domain/engine/categories';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '../../lib/utils';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !transaction) return null;

  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'INCOME';

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[390px] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative z-10 w-full rounded-3xl border border-theme-border/80 bg-theme-elevated p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors"
      >
        {/* Header Alert Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-400 shadow-inner">
            <AlertTriangle className="size-7" />
          </div>

          <h3
            id="delete-dialog-title"
            className="mt-4 text-lg font-bold tracking-tight text-theme-primary"
          >
            Delete Transaction?
          </h3>
          <p className="mt-1 text-xs text-theme-muted max-w-[270px] leading-relaxed">
            This transaction will be permanently removed from your private ledger. This action cannot be undone.
          </p>
        </div>

        {/* Transaction Summary Card (Generous layout preventing title clipping) */}
        <div className="mt-5 rounded-2xl border border-theme-border/60 bg-theme-card-subtle/70 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl border border-theme-border',
                category.bgClass,
                category.textClass
              )}
            >
              <CategoryIcon name={category.iconName} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-theme-primary break-words line-clamp-2 leading-snug">
                {transaction.merchantName}
              </p>
              <p className="text-xs text-theme-muted mt-0.5">
                {category.name}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'text-base font-bold font-mono tabular-nums shrink-0 pl-2',
              isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-theme-primary'
            )}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* Actions (Spacious 48px Buttons with M3 Active Scale) */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl border border-theme-border bg-theme-card-subtle text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.97] transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            <Trash2 className="size-4" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
