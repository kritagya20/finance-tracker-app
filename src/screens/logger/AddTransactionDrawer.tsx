import React, { useState } from 'react';
import { X, Delete, ChevronDown } from 'lucide-react';
import { Category, TransactionType } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { parseKeypadToPaise } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface AddTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (tx: {
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    merchantName: string;
    date: string;
    source: 'MANUAL';
    notes?: string;
  }) => Promise<void>;
}

export const AddTransactionDrawer: React.FC<AddTransactionDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_dining');
  const [merchantNote, setMerchantNote] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleKeypadPress = (key: string) => {
    if (key === 'BACKSPACE') {
      setAmountStr((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
      return;
    }

    if (key === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr((prev) => prev + '.');
      return;
    }

    // Numbers 0-9
    setAmountStr((prev) => {
      if (prev === '0') return key;
      // Max 2 decimal digits limit
      const parts = prev.split('.');
      if (parts.length > 1 && parts[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handleSave = async () => {
    const paiseAmount = parseKeypadToPaise(amountStr);
    if (paiseAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
      const merchant = merchantNote.trim() || selectedCategory?.name || 'Manual Transaction';

      await onSave({
        accountId: 'acc_hdfc',
        categoryId: selectedCategoryId,
        type,
        amount: paiseAmount,
        currency: 'INR',
        merchantName: merchant,
        date: new Date().toISOString(),
        source: 'MANUAL',
        notes: merchantNote,
      });

      // Reset and close
      setAmountStr('0');
      setMerchantNote('');
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ctaColor =
    type === 'INCOME'
      ? 'from-emerald-500 to-emerald-600 shadow-emerald-900/40'
      : type === 'TRANSFER'
      ? 'from-blue-500 to-blue-600 shadow-blue-900/40'
      : 'from-rose-500 to-rose-600 shadow-rose-900/40';

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[390px] flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-3xl border-t border-white/10 bg-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Handle & Close */}
        <div className="relative shrink-0 px-4 pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-700" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Add Transaction</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:text-white active:bg-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-3 no-scrollbar">
          {/* Segmented Type Control */}
          <div className="flex gap-1.5 rounded-2xl bg-slate-800/70 p-1.5 border border-white/5">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-medium transition-all',
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-medium transition-all',
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-medium transition-all',
                type === 'TRANSFER'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Transfer
            </button>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center py-5">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Amount
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-500">₹</span>
              <span className="text-5xl font-bold tracking-tight text-white tabular-nums">
                {amountStr}
              </span>
              <span className="ml-0.5 h-9 w-0.5 animate-pulse rounded-full bg-violet-400" />
            </div>
          </div>

          {/* Horizontal Category Carousel */}
          <div className="-mx-4 overflow-x-auto px-4 pb-2 no-scrollbar">
            <div className="flex gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span
                      className={cn(
                        'flex size-14 items-center justify-center rounded-full transition-all',
                        cat.bgClass,
                        cat.textClass,
                        isSelected
                          ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-105'
                          : 'opacity-80 hover:opacity-100'
                      )}
                    >
                      <CategoryIcon name={cat.iconName} size={22} />
                    </span>
                    <span
                      className={cn(
                        'text-center text-[10px] leading-tight truncate w-full',
                        isSelected ? 'font-semibold text-white' : 'text-slate-400'
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="mt-3 space-y-2.5">
            <div className="flex gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-between gap-1 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5 text-left text-xs font-medium text-slate-200"
              >
                <span className="truncate">HDFC Bank ····4102</span>
                <ChevronDown className="size-4 shrink-0 text-slate-500" />
              </button>

              <button
                type="button"
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5 text-xs font-medium text-slate-200"
              >
                <span>Today</span>
                <ChevronDown className="size-4 text-slate-500" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Add a note or merchant name..."
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
            />

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-100">
                  Split Transaction
                </span>
                <span className="text-[11px] text-slate-400">
                  Split across multiple categories
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isSplit}
                onClick={() => setIsSplit(!isSplit)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  isSplit ? 'bg-violet-600' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
                    isSplit ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>

          {/* 4x3 Touch Numeric Keypad */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleKeypadPress(val)}
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-800/60 text-xl font-semibold text-white transition-all active:scale-95 active:bg-slate-700/80"
              >
                {val}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleKeypadPress('BACKSPACE')}
              aria-label="Backspace"
              className="flex h-12 items-center justify-center rounded-2xl bg-slate-800/60 text-white transition-all active:scale-95 active:bg-slate-700/80"
            >
              <Delete className="size-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            disabled={isSubmitting || parseKeypadToPaise(amountStr) <= 0}
            onClick={handleSave}
            className={cn(
              'w-full rounded-2xl bg-gradient-to-br py-3.5 text-base font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50',
              ctaColor
            )}
          >
            {isSubmitting ? 'Saving...' : `Save ${type.charAt(0) + type.slice(1).toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};
