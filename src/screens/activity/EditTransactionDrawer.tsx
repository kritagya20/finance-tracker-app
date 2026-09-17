import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Trash2, ArrowUpDown } from 'lucide-react';
import { Category, Transaction, TransactionType, Account } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { parseKeypadToPaise } from '../../domain/engine/moneyUtils';
import { Switch } from '../../components/ui/Switch';
import { cn } from '../../lib/utils';

interface EditTransactionDrawerProps {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: Category[];
  accounts?: Account[];
  onSave: (updates: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const DEFAULT_ACCOUNTS: { id: string; name: string; mask: string }[] = [
  { id: 'acc_hdfc', name: 'HDFC Bank', mask: '4102' },
  { id: 'acc_icici', name: 'ICICI Amazon Card', mask: '8819' },
  { id: 'acc_cash', name: 'Cash Wallet', mask: 'CASH' },
];

export const EditTransactionDrawer: React.FC<EditTransactionDrawerProps> = ({
  isOpen,
  transaction: tx,
  categories,
  accounts = [],
  onSave,
  onDelete,
  onClose,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [merchantName, setMerchantName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_dining');
  const [selectedAccountId, setSelectedAccountId] = useState('acc_hdfc');
  const [notes, setNotes] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag-to-dismiss gesture state
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Initialize values when transaction changes
  useEffect(() => {
    if (tx) {
      setType(tx.type);
      const rupees = (tx.amount / 100).toString();
      setAmountStr(rupees);
      setMerchantName(tx.merchantName);
      setSelectedCategoryId(tx.categoryId);
      setSelectedAccountId(tx.accountId || 'acc_hdfc');
      setNotes(tx.notes || '');
      setIsSplit(Boolean(tx.isSplit));
    }
  }, [tx]);

  // Handle smooth enter / exit transition
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setDragOffsetY(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered || !tx) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startYRef.current = e.clientY;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragOffsetY > 90) {
      onClose();
    } else {
      setDragOffsetY(0);
    }
  };

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
      const finalMerchant = merchantName.trim() || selectedCategory?.name || 'Updated Transaction';

      await onSave({
        type,
        amount: paiseAmount,
        merchantName: finalMerchant,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        notes: notes.trim(),
        isSplit,
      });

      onClose();
    } catch (err) {
      console.error('Failed to update transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount =
    accountOptions.find((a) => a.id === selectedAccountId) || accountOptions[0];

  const ctaGradient =
    type === 'INCOME'
      ? 'from-emerald-600 to-emerald-500 shadow-emerald-950/40'
      : type === 'TRANSFER'
      ? 'from-blue-600 to-blue-500 shadow-blue-950/40'
      : 'from-rose-600 to-rose-500 shadow-rose-950/40';

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[390px] flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300',
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          transform: isAnimatingIn
            ? `translateY(${dragOffsetY}px)`
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-3xl border-t border-white/10 bg-zinc-900 shadow-2xl"
      >
        {/* Drag Handle & Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shrink-0 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-zinc-700/80" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Edit Transaction</h2>
              <span className="rounded-md border border-white/10 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 no-scrollbar space-y-4">
          {/* Segmented Type Switcher */}
          <div className="flex gap-1.5 rounded-2xl bg-zinc-850 p-1.5 border border-white/5">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-semibold transition-all',
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-semibold transition-all',
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-semibold transition-all',
                type === 'TRANSFER'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-950/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Transfer
            </button>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center py-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Amount
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-zinc-500">₹</span>
              <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                {amountStr}
              </span>
              <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-400" />
            </div>
          </div>

          {/* Category Carousel */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Category</label>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar">
              <div className="flex gap-2.5">
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
                          'flex size-12 items-center justify-center rounded-2xl transition-all border',
                          cat.bgClass,
                          cat.textClass,
                          isSelected
                            ? 'border-violet-400 ring-2 ring-violet-400/40 scale-105'
                            : 'border-white/5 opacity-75 hover:opacity-100'
                        )}
                      >
                        <CategoryIcon name={cat.iconName} size={20} />
                      </span>
                      <span
                        className={cn(
                          'text-center text-[10px] leading-tight truncate w-full',
                          isSelected ? 'font-semibold text-white' : 'text-zinc-400'
                        )}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Merchant & Account Metadata */}
          <div className="space-y-2.5">
            {/* Merchant / Payee Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Merchant / Payee</label>
              <input
                type="text"
                placeholder="e.g. Starbucks, Swiggy, Amazon"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>

            {/* Account Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // Cycle account on click
                  const currIdx = accountOptions.findIndex((a) => a.id === selectedAccountId);
                  const nextIdx = (currIdx + 1) % accountOptions.length;
                  setSelectedAccountId(accountOptions[nextIdx].id);
                }}
                className="flex flex-1 items-center justify-between gap-1 rounded-xl border border-white/10 bg-zinc-800/80 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-200 active:bg-zinc-750 transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{currentAccount.name}</span>
                  <span className="text-[10px] text-zinc-500">···{('maskNumber' in currentAccount ? currentAccount.maskNumber : ('mask' in currentAccount ? currentAccount.mask : ''))}</span>
                </div>
                <ArrowUpDown className="size-3.5 shrink-0 text-zinc-500" />
              </button>

              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-2.5 text-xs font-medium text-zinc-400">
                <span>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>

            {/* Note / Memo */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Notes / Memo</label>
              <input
                type="text"
                placeholder="Add optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>

            {/* Split Switch */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-800/80 px-3.5 py-2.5">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-100">
                  Split Transaction
                </span>
                <span className="text-[10px] text-zinc-400">
                  Divide across categories
                </span>
              </div>
              <Switch
                checked={isSplit}
                onCheckedChange={setIsSplit}
                ariaLabel="Split Transaction"
              />
            </div>
          </div>

          {/* 4x3 Numeric Keypad */}
          <div className="pt-1">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleKeypadPress(val)}
                  className="flex h-11 items-center justify-center rounded-xl bg-zinc-800/70 text-lg font-semibold text-white transition-all active:scale-95 active:bg-zinc-700"
                >
                  {val}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('BACKSPACE')}
                aria-label="Backspace"
                className="flex h-11 items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-300 transition-all active:scale-95 active:bg-zinc-700"
              >
                <Delete className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar (Delete + Save) */}
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 border-t border-white/5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onDelete(tx.id);
            }}
            aria-label="Delete transaction"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
            title="Delete this transaction"
          >
            <Trash2 className="size-5" />
          </button>

          <button
            type="button"
            disabled={isSubmitting || parseKeypadToPaise(amountStr) <= 0}
            onClick={handleSave}
            className={cn(
              'flex-1 rounded-2xl bg-gradient-to-r py-3.5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50',
              ctaGradient
            )}
          >
            {isSubmitting ? 'Updating...' : 'Update Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
