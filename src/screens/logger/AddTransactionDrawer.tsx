import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Delete,
  ArrowRight,
  Calendar,
  CreditCard,
  MessageSquare,
  Split,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  Category,
  Account,
  TransactionType,
  Transaction,
} from '../../domain/models/types';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CalendarPicker } from '../../components/common/CalendarPicker';
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

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

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
  const [merchantNote, setMerchantNote] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Sub-Sheet Picker ('category' | 'account' | 'date' | null)
  const [activePicker, setActivePicker] = useState<'category' | 'account' | 'date' | null>(null);

  // Drag-to-dismiss gesture state
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Slide-in / slide-out animation lifecycle
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
        setActivePicker(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  // Handle pointer drag-to-dismiss
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only allow drag if no sub-sheet is open
    if (activePicker) return;
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

  const handleQuickAdd = (rupeesToAdd: number) => {
    const currentPaise = parseKeypadToPaise(amountStr);
    const currentRupees = paiseToRupees(currentPaise);
    const newRupees = currentRupees + rupeesToAdd;
    setAmountStr(newRupees.toString());
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

  const currentCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel =
    selectedDate === todayStr
      ? 'Today'
      : selectedDate === yesterdayStr
      ? 'Yesterday'
      : new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const activeAmount = parseKeypadToPaise(amountStr);
  const formattedRupees = (activeAmount / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

  const activeColorGradient =
    type === 'INCOME'
      ? 'from-emerald-600 to-emerald-500 shadow-emerald-950/40 hover:from-emerald-500 hover:to-emerald-400'
      : type === 'TRANSFER'
      ? 'from-blue-600 to-blue-500 shadow-blue-950/40 hover:from-blue-500 hover:to-blue-400'
      : 'from-rose-600 to-rose-500 shadow-rose-950/40 hover:from-rose-500 hover:to-rose-400';

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

      {/* Main Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          transform: isAnimatingIn
            ? `translateY(${dragOffsetY}px)`
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 flex w-full max-h-[94dvh] flex-col rounded-t-3xl border-t border-theme-border bg-theme-elevated shadow-2xl transition-colors overflow-hidden"
      >
        {/* Top Drag Handle & Navigation */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shrink-0 px-4 pt-2.5 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-theme-muted opacity-40 mb-2.5" />
          
          <div className="flex items-center justify-between">
            {/* Minimal Segmented Type Toggle */}
            <div className="flex items-center rounded-xl bg-theme-card-subtle p-0.5 border border-theme-border">
              {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
                const isSelected = type === t;
                const label = t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                      isSelected
                        ? t === 'EXPENSE'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : t === 'INCOME'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-blue-500 text-white shadow-xs'
                        : 'text-theme-secondary hover:text-theme-primary'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-full bg-theme-card-subtle text-theme-secondary hover:text-theme-primary transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* GPay Context Chips (Category, Account, Date) */}
        <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Category Chip */}
          <button
            type="button"
            onClick={() => setActivePicker('category')}
            className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-card px-2.5 py-1 text-xs font-medium text-theme-primary hover:bg-theme-card-hover transition-colors shrink-0 shadow-xs"
          >
            {currentCategory && (
              <span className={cn('size-2 rounded-full', currentCategory.bgClass || 'bg-violet-500')} />
            )}
            <span className="truncate max-w-[85px]">{currentCategory?.name || 'Category'}</span>
            <ChevronDown className="size-3 text-theme-muted" />
          </button>

          {/* Account Chip */}
          <button
            type="button"
            onClick={() => setActivePicker('account')}
            className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-card px-2.5 py-1 text-xs font-medium text-theme-primary hover:bg-theme-card-hover transition-colors shrink-0 shadow-xs"
          >
            <CreditCard className="size-3 text-theme-muted" />
            <span className="truncate max-w-[95px]">
              {currentAccount.name} ····{('maskNumber' in currentAccount ? currentAccount.maskNumber : '')}
            </span>
            <ChevronDown className="size-3 text-theme-muted" />
          </button>

          {/* Date Chip */}
          <button
            type="button"
            onClick={() => setActivePicker('date')}
            className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-card px-2.5 py-1 text-xs font-medium text-theme-primary hover:bg-theme-card-hover transition-colors shrink-0 shadow-xs"
          >
            <Calendar className="size-3 text-theme-muted" />
            <span>{dateDisplayLabel}</span>
            <ChevronDown className="size-3 text-theme-muted" />
          </button>
        </div>

        {/* Hero Amount Section with Blinking Cursor */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1 px-4">
          <div className="flex items-baseline gap-1 select-none">
            <span className="text-2xl font-bold text-theme-muted">₹</span>
            <span className="text-4xl font-extrabold tracking-tight text-theme-primary tabular-nums">
              {amountStr}
            </span>
            <span className="ml-0.5 h-7 w-0.5 animate-pulse rounded-full bg-violet-500" />
          </div>

          {/* Quick Increment Chips */}
          <div className="mt-2 flex items-center gap-1.5">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="rounded-full border border-theme-border bg-theme-card px-2.5 py-0.5 text-[11px] font-medium text-theme-secondary hover:border-violet-500/40 hover:text-theme-primary active:scale-95 transition-all shadow-xs"
              >
                +₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Inline Note & Split Bar */}
        <div className="px-4 py-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-input px-3 py-2 shadow-xs transition-colors focus-within:border-violet-500/50">
            <MessageSquare className="size-3.5 text-theme-muted shrink-0" />
            <input
              type="text"
              placeholder="What's this for? (Merchant / Note)..."
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              className="w-full bg-transparent text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setIsSplit(!isSplit)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all shrink-0',
                isSplit
                  ? 'bg-violet-500 text-white shadow-xs'
                  : 'bg-theme-card-subtle text-theme-muted hover:text-theme-primary'
              )}
            >
              <Split className="size-3" />
              <span>Split</span>
            </button>
          </div>
        </div>

        {/* GPay 3x4 Touch Keypad */}
        <div className="px-4 py-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="flex h-11 items-center justify-center rounded-xl bg-theme-card hover:bg-theme-card-hover active:bg-theme-card-subtle text-theme-primary text-base font-semibold active:scale-95 transition-all shadow-xs"
              >
                {key === 'BACKSPACE' ? (
                  <Delete className="size-4 text-theme-secondary" />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Primary CTA */}
        <div className="px-4 pt-1.5 pb-5">
          <button
            type="button"
            disabled={isSubmitting || activeAmount <= 0}
            onClick={handleSave}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
              activeColorGradient
            )}
          >
            <span>
              {isSubmitting
                ? 'Saving...'
                : activeAmount > 0
                ? `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ₹${formattedRupees}`
                : 'Enter Amount'}
            </span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Quick Picker Sub-Sheet: Category */}
        {activePicker === 'category' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <span className="text-sm font-bold text-theme-primary">Select Category</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 py-4 overflow-y-auto no-scrollbar">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setActivePicker(null);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-theme-card-hover active:scale-95 transition-all"
                  >
                    <div
                      className={cn(
                        'flex size-11 items-center justify-center rounded-xl border transition-all',
                        cat.bgClass,
                        cat.textClass,
                        isSelected ? 'border-violet-500 ring-2 ring-violet-500/40 scale-105' : 'border-theme-border'
                      )}
                    >
                      <CategoryIcon name={cat.iconName} size={18} />
                    </div>
                    <span
                      className={cn(
                        'text-center text-[10px] truncate w-full',
                        isSelected ? 'font-bold text-theme-primary' : 'text-theme-secondary'
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Picker Sub-Sheet: Account */}
        {activePicker === 'account' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <span className="text-sm font-bold text-theme-primary">Select Payment Account</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 py-4 overflow-y-auto no-scrollbar">
              {accountList.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                const mask = 'maskNumber' in acc ? acc.maskNumber : '';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setActivePicker(null);
                    }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10 text-theme-primary'
                        : 'border-theme-border bg-theme-card hover:bg-theme-card-hover text-theme-secondary'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-theme-card-subtle text-theme-primary">
                        <CreditCard className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-theme-primary">{acc.name}</div>
                        <div className="text-[10px] text-theme-muted">···· {mask}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="size-4 text-violet-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Picker Sub-Sheet: Date */}
        {activePicker === 'date' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-4 animate-in fade-in duration-150 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
              <span className="text-sm font-bold text-theme-primary">Select Date</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            
            {/* Quick Date Shortcuts */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setActivePicker(null);
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-xl border transition-all',
                  selectedDate === todayStr
                    ? 'border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-300'
                    : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(yesterdayStr);
                  setActivePicker(null);
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-xl border transition-all',
                  selectedDate === yesterdayStr
                    ? 'border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-300'
                    : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
                )}
              >
                Yesterday
              </button>
            </div>

            <div className="flex items-center justify-center">
              <CalendarPicker
                mode="single"
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setActivePicker(null);
                }}
                showPresets={false}
                onClose={() => setActivePicker(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
