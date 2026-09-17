import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUpDown,
  Delete,
  Check,
  Split,
  X,
  Calendar,
} from 'lucide-react';
import {
  Category,
  Account,
  TransactionType,
  Transaction,
} from '../../domain/models/types';
import { parseKeypadToPaise } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CalendarPicker } from '../../components/common/CalendarPicker';
import { Switch } from '../../components/ui/Switch';
import { cn } from '../../lib/utils';

interface AddTransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts?: Account[];
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const DEFAULT_ACCOUNTS = [
  { id: 'acc_hdfc', name: 'HDFC Bank', maskNumber: '4102' },
  { id: 'acc_icici', name: 'ICICI Amazon Card', maskNumber: '8819' },
  { id: 'acc_cash', name: 'Cash Wallet', maskNumber: 'CASH' },
];

export const AddTransactionDrawer: React.FC<AddTransactionDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  accounts = [],
  onSave,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_dining');
  const [selectedAccountId, setSelectedAccountId] = useState('acc_hdfc');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [merchantNote, setMerchantNote] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag-to-dismiss gesture state
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Smooth slide-in and slide-out animation lifecycle
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
        setIsCalendarOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  // Handle pointer drag-to-dismiss
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

    try {
      setIsSubmitting(true);
      const chosenDate = new Date(selectedDate);
      const now = new Date();
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      await onSave({
        type,
        amount: paiseAmount,
        currency: 'INR',
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        merchantName: merchantNote.trim() || (type === 'INCOME' ? 'Income Deposit' : 'General Expense'),
        notes: merchantNote.trim() || undefined,
        date: chosenDate.toISOString(),
        source: 'MANUAL',
        isSplit,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount =
    accountList.find((a) => a.id === selectedAccountId) || accountList[0];

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel =
    selectedDate === todayStr
      ? 'Today'
      : selectedDate === yesterdayStr
      ? 'Yesterday'
      : new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const activeColor =
    type === 'INCOME'
      ? 'from-emerald-600 to-emerald-500 shadow-emerald-950/40'
      : type === 'TRANSFER'
      ? 'from-blue-600 to-blue-500 shadow-blue-950/40'
      : 'from-rose-600 to-rose-500 shadow-rose-950/40';

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[390px] flex items-end justify-center">
      {/* Backdrop with fade-in / fade-out transition */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300',
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Drawer Container with smooth slide & touch drag */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          transform: isAnimatingIn
            ? `translateY(${dragOffsetY}px)`
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-3xl border-t border-theme-border bg-theme-elevated shadow-2xl transition-colors"
      >
        {/* Drag Handle & Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shrink-0 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-theme-muted opacity-40" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Plus className="size-4" />
              </div>
              <h2 className="text-base font-bold text-theme-primary">Add Transaction</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-theme-card-subtle text-theme-secondary hover:text-theme-primary transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-1 no-scrollbar space-y-4">
          {/* Segmented Type Control */}
          <div className="flex gap-1.5 rounded-2xl bg-theme-card-subtle p-1.5 border border-theme-border">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-semibold transition-all',
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                  : 'text-theme-secondary hover:text-theme-primary'
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
                  : 'text-theme-secondary hover:text-theme-primary'
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
                  : 'text-theme-secondary hover:text-theme-primary'
              )}
            >
              Transfer
            </button>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center py-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-theme-muted">
              Amount
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-theme-muted">₹</span>
              <span className="text-4xl font-bold tracking-tight text-theme-primary tabular-nums">
                {amountStr}
              </span>
              <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-500" />
            </div>
          </div>

          {/* Horizontal Category Carousel */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-secondary">Category</label>
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
                            ? 'border-violet-500 ring-2 ring-violet-500/40 scale-105'
                            : 'border-theme-border opacity-75 hover:opacity-100'
                        )}
                      >
                        <CategoryIcon name={cat.iconName} size={20} />
                      </span>
                      <span
                        className={cn(
                          'text-center text-[10px] leading-tight truncate w-full',
                          isSelected ? 'font-semibold text-theme-primary' : 'text-theme-muted'
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

          {/* Metadata Row */}
          <div className="space-y-2.5">
            {/* Account & Date row */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const currIdx = accountList.findIndex((a) => a.id === selectedAccountId);
                  const nextIdx = (currIdx + 1) % accountList.length;
                  setSelectedAccountId(accountList[nextIdx].id);
                }}
                className="flex flex-1 items-center justify-between gap-1 rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5 text-left text-xs font-medium text-theme-primary active:bg-theme-card-subtle transition-colors"
              >
                <span className="truncate">{currentAccount.name} ····{('maskNumber' in currentAccount ? currentAccount.maskNumber : '')}</span>
                <ArrowUpDown className="size-3.5 shrink-0 text-theme-muted" />
              </button>

              {/* Interactive Calendar Picker Date Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-input px-3 py-2.5 text-xs font-medium text-theme-primary hover:bg-theme-card-subtle transition-colors"
                >
                  <Calendar className="size-3.5 text-violet-500" />
                  <span>{dateDisplayLabel}</span>
                </button>

                {isCalendarOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCalendarOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 z-50">
                      <CalendarPicker
                        mode="single"
                        selectedDate={selectedDate}
                        onSelectDate={(d) => {
                          setSelectedDate(d);
                          setIsCalendarOpen(false);
                        }}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Merchant / Description */}
            <input
              type="text"
              placeholder="Merchant / Note (e.g. Blue Tokai Coffee)..."
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              className="w-full rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/50 focus:outline-none"
            />

            {/* Split Switch */}
            <div className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary">
                  Split Transaction
                </span>
                <span className="text-[10px] text-theme-muted">
                  Split across multiple categories
                </span>
              </div>
              <Switch
                checked={isSplit}
                onCheckedChange={setIsSplit}
                ariaLabel="Split transaction switch"
              />
            </div>

            {isSplit && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300">
                  <Split className="size-3.5" />
                  <span>Split Breakdown</span>
                </div>
                <p className="text-[11px] text-theme-secondary">
                  This transaction will be flagged for itemized split categorization in Activity.
                </p>
              </div>
            )}
          </div>

          {/* Numeric Touch Keypad */}
          <div className="pt-1">
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="flex h-12 items-center justify-center rounded-2xl bg-theme-card-subtle hover:bg-theme-card-hover text-theme-primary text-base font-semibold active:scale-95 transition-all shadow-sm"
                  >
                    {key === 'BACKSPACE' ? (
                      <Delete className="size-5 text-theme-secondary" />
                    ) : (
                      key
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-2 pb-6">
            <button
              type="button"
              disabled={isSubmitting || parseKeypadToPaise(amountStr) <= 0}
              onClick={handleSave}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
                activeColor
              )}
            >
              <Check className="size-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
