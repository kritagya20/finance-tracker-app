import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  MessageSquare,
  ChevronDown,
  Check,
  AlertCircle,
  Split,
  Delete,
  Pencil,
} from 'lucide-react';
import {
  Category,
  Transaction,
  TransactionType,
  Account,
  SplitItem,
} from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { CalendarPicker } from '../../components/common/CalendarPicker';
import { CategorySplitEditor } from './CategorySplitEditor';
import { cn } from '../../lib/utils';

interface AddTransactionDrawerProps {
  isOpen: boolean;
  categories: Category[];
  accounts?: Account[];
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_ACCOUNTS: { id: string; name: string; mask: string }[] = [
  { id: 'acc_hdfc', name: 'HDFC Bank', mask: '4102' },
  { id: 'acc_icici', name: 'ICICI Amazon Card', mask: '8819' },
  { id: 'acc_cash', name: 'Cash Wallet', mask: 'CASH' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

export const AddTransactionDrawer: React.FC<AddTransactionDrawerProps> = ({
  isOpen,
  categories,
  accounts = [],
  onSave,
  onClose,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // 2-Step Journey State (1 = Amount Keypad, 2 = Details & Categorization)
  const [step, setStep] = useState<1 | 2>(1);

  // Form State - unselected by default
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  
  // Multi-category split state
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation error state
  const [errors, setErrors] = useState<{
    amount?: boolean;
    category?: boolean;
    account?: boolean;
    date?: boolean;
    splitBalance?: boolean;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Sub-Sheet Picker ('category' | 'account' | 'date' | null)
  const [activePicker, setActivePicker] = useState<'category' | 'account' | 'date' | null>(null);

  // Drag-to-dismiss gesture state
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Comprehensive form reset
  const resetForm = () => {
    setStep(1);
    setType('EXPENSE');
    setAmountStr('0');
    setSelectedCategoryId('');
    setSelectedAccountId('');
    setSelectedDate('');
    setMerchantNote('');
    setIsSplit(false);
    setSplits([]);
    setActivePicker(null);
    setErrors({});
    setErrorMessage(null);
  };

  // Slide-in / slide-out animation lifecycle with auto-reset
  useEffect(() => {
    if (isOpen) {
      resetForm();
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
        resetForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  // Handle pointer drag-to-dismiss
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: false }));
      setErrorMessage(null);
    }

    setAmountStr((prev) => {
      if (key === 'BACKSPACE') {
        return prev.length <= 1 ? '0' : prev.slice(0, -1);
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      // Numeric 0-9
      if (prev === '0') return key;
      const parts = prev.split('.');
      if (parts.length > 1 && parts[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handleQuickAdd = (rupeesToAdd: number) => {
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: false }));
      setErrorMessage(null);
    }
    setAmountStr((prev) => {
      const currentPaise = parseKeypadToPaise(prev);
      const currentRupees = paiseToRupees(currentPaise);
      const newRupees = currentRupees + rupeesToAdd;
      return newRupees.toString();
    });
  };

  const handleProceedToDetails = () => {
    const paiseAmount = parseKeypadToPaise(amountStr);
    if (paiseAmount <= 0) {
      setErrors({ amount: true });
      setErrorMessage('Please enter an amount before proceeding');
      return;
    }
    setErrors({});
    setErrorMessage(null);
    setStep(2);
  };

  const handleToggleSplit = (enable: boolean) => {
    setIsSplit(enable);
    if (enable) {
      const paiseAmount = parseKeypadToPaise(amountStr);
      if (splits.length < 2) {
        const half1 = Math.floor(paiseAmount / 2);
        const half2 = paiseAmount - half1;
        setSplits([
          {
            id: `split_1_${Date.now()}`,
            categoryId: selectedCategoryId || 'cat_dining',
            amount: half1,
            note: '',
          },
          {
            id: `split_2_${Date.now()}`,
            categoryId: categories.find((c) => c.id !== (selectedCategoryId || 'cat_dining'))?.id || 'cat_groceries',
            amount: half2,
            note: '',
          },
        ]);
      }
    }
  };

  const handleSave = async () => {
    const paiseAmount = parseKeypadToPaise(amountStr);
    const newErrors: {
      amount?: boolean;
      category?: boolean;
      account?: boolean;
      date?: boolean;
      splitBalance?: boolean;
    } = {};
    const missing: string[] = [];

    if (paiseAmount <= 0) {
      newErrors.amount = true;
      missing.push('amount');
    }
    if (!selectedAccountId) {
      newErrors.account = true;
      missing.push('payment account');
    }
    if (!selectedDate) {
      newErrors.date = true;
      missing.push('date');
    }

    if (isSplit) {
      // Validate multi-category splits
      const allocatedPaise = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (allocatedPaise !== paiseAmount) {
        newErrors.splitBalance = true;
        const diff = paiseAmount - allocatedPaise;
        if (diff > 0) {
          missing.push(`remaining ₹${paiseToRupees(diff)} to allocate`);
        } else {
          missing.push(`reduce overage of ₹${paiseToRupees(Math.abs(diff))}`);
        }
      }
    } else {
      if (!selectedCategoryId) {
        newErrors.category = true;
        missing.push('category');
      }
    }

    if (missing.length > 0) {
      setErrors(newErrors);
      setErrorMessage(`Please resolve: ${missing.join(', ')}`);
      return;
    }

    setErrors({});
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      const effectiveCategoryId = isSplit ? (splits[0]?.categoryId || 'cat_dining') : selectedCategoryId;
      const effectiveMerchant = merchantNote.trim() || (isSplit ? 'Multi-Category Expense' : 'Expense');

      await onSave({
        type,
        amount: paiseAmount,
        currency: 'INR',
        merchantName: effectiveMerchant,
        categoryId: effectiveCategoryId,
        accountId: selectedAccountId,
        notes: merchantNote.trim() || undefined,
        date: new Date(selectedDate).toISOString(),
        source: 'MANUAL',
        isSplit,
        splits: isSplit ? splits : undefined,
      });

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrorMessage('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount = accountOptions.find((a) => a.id === selectedAccountId);
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel = !selectedDate
    ? 'Select Date'
    : selectedDate === todayStr
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
          'fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300',
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
        {/* Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shrink-0 px-4 pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-theme-muted opacity-40 mb-2" />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: AMOUNT & KEYPAD (GPay Minimalist Hero)                      */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="flex flex-col flex-1 pb-4 animate-in fade-in slide-in-from-left-2 duration-200">
            {/* Top Navigation: Type Switcher + Close */}
            <div className="px-4 pb-2 flex items-center justify-between">
              {/* Segmented Type Switcher */}
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
                aria-label="Close transaction drawer"
                className="flex size-7 items-center justify-center rounded-full bg-theme-card-subtle text-theme-secondary hover:text-theme-primary transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Validation Error Banner */}
            {errorMessage && (
              <div className="mx-4 my-1 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-500 dark:text-rose-400 transition-all">
                <AlertCircle className="size-3.5 shrink-0 text-rose-500" />
                <span className="font-medium text-[11px] leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Hero Amount Display */}
            <div className="flex flex-col items-center justify-center py-4 px-4">
              <div className="flex items-baseline gap-1 select-none">
                <span className={cn('text-3xl font-bold transition-colors', errors.amount ? 'text-rose-500' : 'text-theme-muted')}>₹</span>
                <span className={cn('text-5xl font-extrabold tracking-tight tabular-nums transition-colors', errors.amount ? 'text-rose-500' : 'text-theme-primary')}>
                  {amountStr}
                </span>
                <span className={cn('ml-0.5 h-9 w-0.5 animate-pulse rounded-full', errors.amount ? 'bg-rose-500' : 'bg-violet-500')} />
              </div>

              {/* Quick Increment Chips */}
              <div className="mt-3 flex items-center gap-1.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="rounded-full border border-theme-border bg-theme-card px-2.5 py-1 text-xs font-medium text-theme-secondary hover:border-violet-500/40 hover:text-theme-primary active:scale-95 transition-all shadow-xs"
                  >
                    +₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* GPay 3x4 Touch Keypad */}
            <div className="px-4 py-2 flex-1">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="flex h-12 items-center justify-center rounded-2xl bg-theme-card hover:bg-theme-card-hover active:bg-theme-card-subtle text-theme-primary text-lg font-semibold active:scale-95 transition-all shadow-xs"
                  >
                    {key === 'BACKSPACE' ? (
                      <Delete className="size-5 text-theme-secondary" />
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom CTA: Proceed to Details */}
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={handleProceedToDetails}
                disabled={activeAmount <= 0}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
                  activeColorGradient
                )}
              >
                <span>{activeAmount > 0 ? `Proceed with ₹${formattedRupees}` : 'Enter Amount to Proceed'}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: TRANSACTION DETAILS CANVAS & MULTI-CATEGORY SPLITTING      */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="flex flex-col flex-1 pb-4 animate-in fade-in slide-in-from-right-2 duration-200 overflow-y-auto no-scrollbar">
            {/* Step 2 Header: Back + Title + Close */}
            <div className="px-4 pb-2 flex items-center justify-between border-b border-theme-border shrink-0">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors py-1"
              >
                <ArrowLeft className="size-4" />
                <span>Amount</span>
              </button>

              <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                Transaction Details
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close transaction drawer"
                className="flex size-7 items-center justify-center rounded-full bg-theme-card-subtle text-theme-secondary hover:text-theme-primary transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Validation Error Banner */}
            {errorMessage && (
              <div className="mx-4 mt-2 mb-1 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 dark:text-rose-400 transition-all">
                <AlertCircle className="size-4 shrink-0 text-rose-500" />
                <span className="font-medium text-xs leading-tight">{errorMessage}</span>
              </div>
            )}

            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Sticky Mini Amount Card with Quick Change */}
              <div className="flex items-center justify-between rounded-2xl border border-theme-border bg-theme-card p-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                    {type} Amount
                  </span>
                  <div className="text-xl font-extrabold text-theme-primary tabular-nums">
                    ₹{formattedRupees}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 rounded-lg border border-theme-border bg-theme-card-subtle px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-theme-card-hover transition-all shadow-xs"
                >
                  <Pencil className="size-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* Merchant / Description Input */}
              <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-input px-3 py-2.5 shadow-xs transition-colors focus-within:border-violet-500/50">
                <MessageSquare className="size-4 text-theme-muted shrink-0" />
                <input
                  type="text"
                  placeholder="What's this for? (Merchant, store, or note)..."
                  value={merchantNote}
                  onChange={(e) => setMerchantNote(e.target.value)}
                  className="w-full bg-transparent text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none"
                />
              </div>

              {/* Account & Date Selection Chips */}
              <div className="grid grid-cols-2 gap-2">
                {/* Account Chip */}
                <button
                  type="button"
                  onClick={() => setActivePicker('account')}
                  className={cn(
                    'flex items-center justify-between rounded-xl p-2.5 text-left border shadow-xs transition-all',
                    errors.account
                      ? 'border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10'
                      : 'border-theme-border bg-theme-card hover:bg-theme-card-hover'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className={cn('size-4 shrink-0', errors.account ? 'text-rose-500' : 'text-theme-muted')} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-theme-muted">Account</div>
                      <div className={cn('text-xs font-bold truncate', errors.account ? 'text-rose-500' : 'text-theme-primary')}>
                        {currentAccount ? currentAccount.name : 'Select Account'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={cn('size-3.5 shrink-0', errors.account ? 'text-rose-500' : 'text-theme-muted')} />
                </button>

                {/* Date Chip */}
                <button
                  type="button"
                  onClick={() => setActivePicker('date')}
                  className={cn(
                    'flex items-center justify-between rounded-xl p-2.5 text-left border shadow-xs transition-all',
                    errors.date
                      ? 'border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10'
                      : 'border-theme-border bg-theme-card hover:bg-theme-card-hover'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className={cn('size-4 shrink-0', errors.date ? 'text-rose-500' : 'text-theme-muted')} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-theme-muted">Date</div>
                      <div className={cn('text-xs font-bold truncate', errors.date ? 'text-rose-500' : 'text-theme-primary')}>
                        {dateDisplayLabel}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={cn('size-3.5 shrink-0', errors.date ? 'text-rose-500' : 'text-theme-muted')} />
                </button>
              </div>

              {/* Categorization & Multi-Category Splitting */}
              {type === 'EXPENSE' && (
                <div className="flex flex-col gap-2 pt-1">
                  {/* Multi-Category Split Toggle */}
                  <label className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-3 py-2.5 shadow-xs cursor-pointer select-none transition-colors hover:bg-theme-card-hover">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <Split className="size-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-theme-primary">
                          Split into multiple categories
                        </div>
                        <div className="text-[10px] text-theme-muted">
                          Divide this single bill across multiple categories
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSplit}
                      onChange={(e) => handleToggleSplit(e.target.checked)}
                      className="size-4.5 rounded accent-violet-600 cursor-pointer"
                    />
                  </label>

                  {/* If Multi-Category: Render Split Editor */}
                  {isSplit ? (
                    <CategorySplitEditor
                      totalAmountPaise={activeAmount}
                      splits={splits}
                      categories={categories}
                      onChange={setSplits}
                    />
                  ) : (
                    /* Single Category Selection */
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-theme-primary">Category</span>
                        {errors.category && (
                          <span className="text-[10px] font-bold text-rose-500">Required</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePicker('category')}
                        className={cn(
                          'flex items-center justify-between rounded-xl p-3 text-left border shadow-xs transition-all',
                          errors.category
                            ? 'border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10'
                            : 'border-theme-border bg-theme-card hover:bg-theme-card-hover'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {currentCategory ? (
                            <div className={cn('flex size-8 items-center justify-center rounded-lg', currentCategory.bgClass, currentCategory.textClass)}>
                              <CategoryIcon name={currentCategory.iconName} size={16} />
                            </div>
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-lg bg-theme-card-subtle text-theme-muted">
                              <ChevronDown className="size-4" />
                            </div>
                          )}
                          <div>
                            <div className={cn('text-xs font-bold', errors.category ? 'text-rose-500' : 'text-theme-primary')}>
                              {currentCategory ? currentCategory.name : 'Select Category'}
                            </div>
                            <div className="text-[10px] text-theme-muted">
                              {currentCategory ? 'Primary Category' : 'Tap to choose'}
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={cn('size-4', errors.category ? 'text-rose-500' : 'text-theme-muted')} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Single Category for Income & Transfer */}
              {type !== 'EXPENSE' && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-theme-primary">Category</span>
                    {errors.category && (
                      <span className="text-[10px] font-bold text-rose-500">Required</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePicker('category')}
                    className={cn(
                      'flex items-center justify-between rounded-xl p-3 text-left border shadow-xs transition-all',
                      errors.category
                        ? 'border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10'
                        : 'border-theme-border bg-theme-card hover:bg-theme-card-hover'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {currentCategory ? (
                        <div className={cn('flex size-8 items-center justify-center rounded-lg', currentCategory.bgClass, currentCategory.textClass)}>
                          <CategoryIcon name={currentCategory.iconName} size={16} />
                        </div>
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-lg bg-theme-card-subtle text-theme-muted">
                          <ChevronDown className="size-4" />
                        </div>
                      )}
                      <div>
                        <div className={cn('text-xs font-bold', errors.category ? 'text-rose-500' : 'text-theme-primary')}>
                          {currentCategory ? currentCategory.name : 'Select Category'}
                        </div>
                        <div className="text-[10px] text-theme-muted">
                          {currentCategory ? 'Category' : 'Tap to choose'}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn('size-4', errors.category ? 'text-rose-500' : 'text-theme-muted')} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Primary CTA */}
            <div className="px-4 pt-2 pb-2 mt-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
                  activeColorGradient
                )}
              >
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : isSplit
                    ? `Save Split Expense ₹${formattedRupees} (${splits.length} Categories)`
                    : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ₹${formattedRupees}`}
                </span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Quick Picker Sub-Sheet: Category                                   */}
        {/* ------------------------------------------------------------------ */}
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
                      setErrors((prev) => {
                        const next = { ...prev, category: false };
                        if (!next.amount && !next.account && !next.date) {
                          setErrorMessage(null);
                        }
                        return next;
                      });
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

        {/* ------------------------------------------------------------------ */}
        {/* Quick Picker Sub-Sheet: Account                                    */}
        {/* ------------------------------------------------------------------ */}
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
              {accountOptions.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                const mask = 'maskNumber' in acc ? acc.maskNumber : ('mask' in acc ? acc.mask : '');
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setErrors((prev) => {
                        const next = { ...prev, account: false };
                        if (!next.amount && !next.category && !next.date) {
                          setErrorMessage(null);
                        }
                        return next;
                      });
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

        {/* ------------------------------------------------------------------ */}
        {/* Quick Picker Sub-Sheet: Date                                       */}
        {/* ------------------------------------------------------------------ */}
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
                  setErrors((prev) => {
                    const next = { ...prev, date: false };
                    if (!next.amount && !next.category && !next.account) {
                      setErrorMessage(null);
                    }
                    return next;
                  });
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
                  setErrors((prev) => {
                    const next = { ...prev, date: false };
                    if (!next.amount && !next.category && !next.account) {
                      setErrorMessage(null);
                    }
                    return next;
                  });
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
                  setErrors((prev) => {
                    const next = { ...prev, date: false };
                    if (!next.amount && !next.category && !next.account) {
                      setErrorMessage(null);
                    }
                    return next;
                  });
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
