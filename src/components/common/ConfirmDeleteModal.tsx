import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative z-10 w-full rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Header Alert Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-lg shadow-rose-950/40">
            <AlertTriangle className="size-7" />
          </div>

          <h3
            id="delete-dialog-title"
            className="mt-3.5 text-lg font-bold tracking-tight text-white"
          >
            Delete Transaction?
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-[260px] leading-relaxed">
            This transaction will be permanently removed and balances will be recalculated.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-850 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                category.bgClass,
                category.textClass
              )}
            >
              <CategoryIcon name={category.iconName} size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-100">
                {transaction.merchantName}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {category.name}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'text-sm font-bold tabular-nums shrink-0 ml-2',
              isIncome ? 'text-emerald-400' : 'text-zinc-100'
            )}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/10 bg-zinc-800 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-xs font-semibold text-white shadow-lg shadow-rose-950/50 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Trash2 className="size-3.5" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
