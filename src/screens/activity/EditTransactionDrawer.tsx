import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Delete,
  Calendar,
  CreditCard,
  ChevronDown,
  Check,
  AlertCircle,
  Pencil,
  Tag,
  Split,
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
import { CategorySplitEditor } from '../logger/CategorySplitEditor';
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

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

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

  // 2-Step Navigation (Defaults to Step 2 for editing details, can switch to Step 1 for Keypad)
  const [step, setStep] = useState<1 | 2>(2);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [merchantNote, setMerchantNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Categorization mode: 'single' | 'split'
  const [categoryMode, setCategoryMode] = useState<'single' | 'split'>('single');
  const [splits, setSplits] = useState<SplitItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
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

  // Initialize values when transaction changes
  useEffect(() => {
    if (tx) {
      setStep(2);
      setType(tx.type);
      const rupees = (tx.amount / 100).toString();
      setAmountStr(rupees);
      setMerchantNote(tx.merchantName || tx.notes || '');
      setSelectedCategoryId(tx.categoryId);
      setSelectedAccountId(tx.accountId || 'acc_hdfc');
      setSelectedDate(tx.date.slice(0, 10));
      
      const hasSplits = Boolean(tx.isSplit && tx.splits && tx.splits.length > 0);
      setCategoryMode(hasSplits ? 'split' : 'single');
      setSplits(tx.splits || []);

      setErrors({});
      setErrorMessage(null);
    }
  }, [tx]);

  // Handle enter / exit animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setStep(2);
      setErrors({});
      setErrorMessage(null);
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
        setErrors({});
        setErrorMessage(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered || !tx) return null;

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

  const handleSwitchCategoryMode = (mode: 'single' | 'split') => {
    setCategoryMode(mode);
    if (mode === 'split' && splits.length < 2) {
      const paiseAmount = parseKeypadToPaise(amountStr);
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
      missing.push('account');
    }
    if (!selectedDate) {
      newErrors.date = true;
      missing.push('date');
    }

    const isSplit = categoryMode === 'split' && type === 'EXPENSE';

    if (isSplit) {
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
      setErrorMessage(`Please select: ${missing.join(', ')}`);
      return;
    }

    setErrors({});
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      const updatedDate = new Date(selectedDate);
      const origDate = new Date(tx.date);
      updatedDate.setHours(origDate.getHours(), origDate.getMinutes(), origDate.getSeconds());

      const effectiveCategoryId = isSplit ? (splits[0]?.categoryId || tx.categoryId) : selectedCategoryId;
      const effectiveMerchant = merchantNote.trim() || tx.merchantName;

      await onSave({
        type,
        amount: paiseAmount,
        merchantName: effectiveMerchant,
        categoryId: effectiveCategoryId,
        accountId: selectedAccountId,
        notes: merchantNote.trim() || undefined,
        date: updatedDate.toISOString(),
        isSplit,
        splits: isSplit ? splits : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setErrorMessage('Failed to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount =
    accountOptions.find((a) => a.id === selectedAccountId) || accountOptions[0];

  const currentCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

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

  const isSplit = categoryMode === 'split' && type === 'EXPENSE';

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
        className="relative z-10 flex w-full max-h-[94dvh] flex-col rounded-t-3xl border-t border-theme-border/50 bg-theme-elevated shadow-2xl transition-colors overflow-hidden"
      >
        {/* Subtle Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative shrink-0 px-4 pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="mx-auto h-1 w-8 rounded-full bg-theme-muted/40" />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: AMOUNT KEYPAD                                              */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="flex flex-col flex-1 pb-5 px-4 animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center rounded-full bg-theme-card-subtle p-0.5 border border-theme-border/60">
                {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
                  const isSelected = type === t;
                  const label = t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer';
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'px-3 py-1 text-xs font-semibold rounded-full transition-all',
                        isSelected
                          ? 'bg-theme-card text-theme-primary shadow-xs'
                          : 'text-theme-muted hover:text-theme-primary'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="my-1.5 flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
                <AlertCircle className="size-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Centered Hero: Amount */}
            <div className="flex flex-col items-center justify-center pt-4 pb-2">
              <span className="text-xs font-medium text-theme-muted tracking-wide mb-1">
                Edit amount
              </span>

              <div className="flex items-baseline justify-center gap-1 select-none">
                <span className="text-2xl font-semibold text-theme-muted">₹</span>
                <span className="text-5xl font-light tracking-tight tabular-nums text-theme-primary">
                  {amountStr}
                </span>
                <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-500" />
              </div>

              {/* Quick Increment Chips */}
              <div className="mt-3 flex items-center gap-1.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="rounded-full bg-theme-card-subtle px-2.5 py-1 text-[11px] font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-95 transition-all"
                  >
                    +₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Flat Keypad */}
            <div className="pt-2 pb-3 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-3 gap-2 max-w-[340px] mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="flex h-11 items-center justify-center rounded-2xl bg-theme-card/60 hover:bg-theme-card text-theme-primary text-lg font-medium active:scale-95 transition-all"
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

            {/* Pill CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={activeAmount <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-[0.99] transition-all"
              >
                <span>Done editing amount (₹{formattedRupees})</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: DETAILS CANVAS                                             */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="flex flex-col flex-1 pb-5 px-4 animate-in fade-in duration-200 overflow-y-auto no-scrollbar">
            {/* Top Bar: Title + Delete + Close */}
            <div className="flex items-center justify-between pb-2 border-b border-theme-border/40 shrink-0">
              <span className="text-xs font-semibold text-theme-secondary">
                Edit transaction
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDelete(tx.id)}
                  aria-label="Delete"
                  className="flex size-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex size-8 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="my-2 flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
                <AlertCircle className="size-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Centered Hero: Amount + Note */}
            <div className="flex flex-col items-center justify-center py-3">
              <span className="text-xs font-medium text-theme-muted mb-0.5">
                {isSplit ? 'Amount to split' : `${type.toLowerCase()} amount`}
              </span>

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-semibold text-theme-muted">₹</span>
                <span className="text-4xl font-light tracking-tight text-theme-primary tabular-nums">
                  {formattedRupees}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-2 p-1 text-theme-muted hover:text-violet-400 transition-colors"
                  title="Change amount"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>

              {/* Note pill (editable) */}
              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="What's this for?"
                  value={merchantNote}
                  onChange={(e) => setMerchantNote(e.target.value)}
                  className="rounded-full bg-theme-card-subtle px-4 py-1.5 text-xs text-center text-theme-primary placeholder:text-theme-muted focus:outline-none border border-theme-border/60 focus:border-violet-500/60 max-w-[220px] transition-colors"
                />
              </div>
            </div>

            {/* Context Pills: Account & Date */}
            <div className="flex items-center justify-center gap-2 py-2">
              <button
                type="button"
                onClick={() => setActivePicker('account')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-xs',
                  errors.account
                    ? 'border border-rose-500 bg-rose-500/10 text-rose-500'
                    : 'bg-theme-card-subtle hover:bg-theme-card text-theme-primary border border-theme-border/60'
                )}
              >
                <CreditCard className="size-3.5 text-theme-muted" />
                <span className="truncate max-w-[110px]">
                  {currentAccount.name}
                </span>
                <ChevronDown className="size-3 text-theme-muted" />
              </button>

              <button
                type="button"
                onClick={() => setActivePicker('date')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-xs',
                  errors.date
                    ? 'border border-rose-500 bg-rose-500/10 text-rose-500'
                    : 'bg-theme-card-subtle hover:bg-theme-card text-theme-primary border border-theme-border/60'
                )}
              >
                <Calendar className="size-3.5 text-theme-muted" />
                <span>{dateDisplayLabel}</span>
                <ChevronDown className="size-3 text-theme-muted" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            {type === 'EXPENSE' && (
              <div className="mt-3 mb-2 flex items-center justify-center border-b border-theme-border/40">
                <button
                  type="button"
                  onClick={() => handleSwitchCategoryMode('single')}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all',
                    categoryMode === 'single'
                      ? 'border-violet-500 text-violet-500'
                      : 'border-transparent text-theme-muted hover:text-theme-primary'
                  )}
                >
                  <Tag className="size-3.5" />
                  <span>Single category</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchCategoryMode('split')}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all',
                    categoryMode === 'split'
                      ? 'border-violet-500 text-violet-500'
                      : 'border-transparent text-theme-muted hover:text-theme-primary'
                  )}
                >
                  <Split className="size-3.5" />
                  <span>Split categories</span>
                </button>
              </div>
            )}

            {/* Mode 1: Single Category */}
            {(!isSplit || type !== 'EXPENSE') && (
              <div className="py-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActivePicker('category')}
                  className={cn(
                    'flex items-center justify-between py-2.5 px-2 rounded-2xl transition-all',
                    errors.category
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/40'
                      : 'hover:bg-theme-card-subtle text-theme-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-white shadow-xs',
                        currentCategory.bgClass
                      )}
                    >
                      <CategoryIcon name={currentCategory.iconName} size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-theme-primary">
                        {currentCategory.name}
                      </div>
                      <div className="text-[11px] text-theme-muted">
                        Category
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-theme-muted" />
                </button>
              </div>
            )}

            {/* Mode 2: Multi-Category Bill Splitting */}
            {isSplit && type === 'EXPENSE' && (
              <div className="py-1">
                <CategorySplitEditor
                  totalAmountPaise={activeAmount}
                  splits={splits}
                  categories={categories}
                  onChange={setSplits}
                />
              </div>
            )}

            {/* GPay Rounded-Full Pill CTA */}
            <div className="pt-4 mt-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-[0.99] transition-all"
              >
                <span>
                  {isSubmitting
                    ? 'Updating...'
                    : isSplit
                    ? `Update Split Expense ₹${formattedRupees}`
                    : `Update Transaction ₹${formattedRupees}`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Picker Sub-Sheet: Category */}
        {activePicker === 'category' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
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
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-theme-card-hover active:scale-95 transition-all"
                  >
                    <div
                      className={cn(
                        'flex size-11 items-center justify-center rounded-full text-white transition-all',
                        cat.bgClass,
                        isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-theme-elevated scale-105' : ''
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
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
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
                      'flex items-center justify-between p-3 rounded-2xl border transition-all text-left',
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10 text-theme-primary'
                        : 'border-theme-border/60 bg-theme-card-subtle hover:bg-theme-card text-theme-secondary'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full bg-theme-card text-theme-primary">
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
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-3">
              <span className="text-sm font-bold text-theme-primary">Select Date</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            
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
                  'flex-1 py-2 text-xs font-semibold rounded-full border transition-all',
                  selectedDate === todayStr
                    ? 'border-violet-500 bg-violet-500/15 text-violet-500'
                    : 'border-theme-border/60 bg-theme-card-subtle text-theme-secondary hover:bg-theme-card'
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
                  'flex-1 py-2 text-xs font-semibold rounded-full border transition-all',
                  selectedDate === yesterdayStr
                    ? 'border-violet-500 bg-violet-500/15 text-violet-500'
                    : 'border-theme-border/60 bg-theme-card-subtle text-theme-secondary hover:bg-theme-card'
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
