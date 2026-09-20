import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  ChevronDown,
  Check,
  AlertCircle,
  Delete,
  Pencil,
  Split,
  Store,
  FileText,
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
import { useCurrency } from '../../context/CurrencyContext';
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
  const { currency, currencySymbol, numberingSystem } = useCurrency();

  const [isRendered, setIsRendered] = useState(isOpen);

  // 2-Step Journey State (1 = Amount Keypad, 2 = Details & Categorization)
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Splits: if > 1 item, multi-category mode is active!
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

  // Draggable bottom sheet state & physics
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);

  // Smooth dismiss animation
  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setDragOffset(window.innerHeight || 800);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragOffset(0);
    }, 220);
  }, [onClose]);

  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePicker) {
          setActivePicker(null);
        } else {
          triggerClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, activePicker, triggerClose]);

  // Drag Gesture Handlers
  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaY = clientY - startYRef.current;
    if (deltaY < 0) {
      setDragOffset(deltaY * 0.2);
    } else {
      setDragOffset(deltaY);
    }
  }, []);

  const handleDragEnd = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      const deltaY = clientY - startYRef.current;
      const elapsed = Math.max(1, Date.now() - startTimeRef.current);
      const velocity = deltaY / elapsed;

      if (velocity > 0.5 || deltaY > 120) {
        triggerClose();
      } else {
        setDragOffset(0);
      }
    },
    [triggerClose]
  );

  // Global window listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => handleDragMove(e.clientY);
    const onPointerUp = (e: PointerEvent) => handleDragEnd(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleDragEnd(e.changedTouches[0].clientY);
      } else {
        handleDragEnd(startYRef.current);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const resetForm = useCallback(() => {
    setStep(1);
    setType('EXPENSE');
    setAmountStr('0');
    setSelectedCategoryId('');
    const accountOptions = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
    setSelectedAccountId(accountOptions[0]?.id || '');
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setMerchantName('');
    setNotes('');
    setSplits([]);
    setActivePicker(null);
    setErrors({});
    setErrorMessage(null);
    setDragOffset(0);
    setIsClosing(false);
  }, [accounts]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => {
        setIsRendered(false);
        resetForm();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);

  if (!isRendered) return null;

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

  const handleProceedToDetails = () => {
    const paiseAmount = parseKeypadToPaise(amountStr);
    if (paiseAmount <= 0) {
      setErrors({ amount: true });
      setErrorMessage('Please enter an amount to proceed');
      return;
    }
    setErrors({});
    setErrorMessage(null);
    setStep(2);
  };

  const handleToggleCategoryInPicker = (catId: string) => {
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: false }));
      setErrorMessage(null);
    }

    // For non-expense transactions (Income, Transfer), splitting is not applicable
    if (type !== 'EXPENSE') {
      setSelectedCategoryId(catId);
      setSplits([]);
      setActivePicker(null);
      return;
    }

    const paiseAmount = parseKeypadToPaise(amountStr);

    // If already splitting across multiple categories
    if (splits.length > 1) {
      const exists = splits.some((s) => s.categoryId === catId);
      if (exists) {
        const remaining = splits.filter((s) => s.categoryId !== catId);
        if (remaining.length === 1) {
          setSelectedCategoryId(remaining[0].categoryId);
          setSplits([]);
        } else {
          setSplits(remaining);
        }
      } else {
        const allocated = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
        const unallocated = Math.max(0, paiseAmount - allocated);
        setSplits([
          ...splits,
          {
            id: `split_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            categoryId: catId,
            amount: unallocated,
            note: '',
          },
        ]);
      }
      return;
    }

    // Currently single category or none selected
    if (!selectedCategoryId) {
      setSelectedCategoryId(catId);
      setSplits([]);
    } else if (selectedCategoryId === catId) {
      // Tapped the same category - remain selected
    } else {
      // User tapped a SECOND category! Instantly initiate split!
      const half1 = Math.floor(paiseAmount / 2);
      const half2 = paiseAmount - half1;
      setSplits([
        {
          id: `split_1_${Date.now()}`,
          categoryId: selectedCategoryId,
          amount: half1,
          note: '',
        },
        {
          id: `split_2_${Date.now()}`,
          categoryId: catId,
          amount: half2,
          note: '',
        },
      ]);
      setSelectedCategoryId('');
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

    const isSplit = splits.length > 1 && type === 'EXPENSE';

    if (isSplit) {
      const allocatedPaise = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (allocatedPaise !== paiseAmount) {
        newErrors.splitBalance = true;
        const diff = paiseAmount - allocatedPaise;
        if (diff > 0) {
          missing.push(`remaining ${currencySymbol}${paiseToRupees(diff)} to allocate`);
        } else {
          missing.push(`reduce overage of ${currencySymbol}${paiseToRupees(Math.abs(diff))}`);
        }
      }
    } else {
      const effectiveCatId = selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '');
      if (!effectiveCatId) {
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
      const fallbackCatId = filteredCategories[0]?.id || (type === 'INCOME' ? 'cat_salary' : 'cat_dining');
      const effectiveCategoryId = isSplit
        ? (splits[0]?.categoryId || fallbackCatId)
        : (selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '') || fallbackCatId);
      const effectiveMerchant = merchantName.trim() || (isSplit ? 'Multi-Category Expense' : type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer');

      await onSave({
        type,
        amount: paiseAmount,
        currency: currency || 'INR',
        merchantName: effectiveMerchant,
        categoryId: effectiveCategoryId,
        accountId: selectedAccountId,
        notes: notes.trim() || undefined,
        date: new Date(selectedDate).toISOString(),
        source: 'MANUAL',
        isSplit,
        splits: isSplit ? splits : undefined,
      });

      triggerClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrorMessage('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (type === 'INCOME') {
      return categories.filter((c) => !!c.isIncome);
    }
    if (type === 'EXPENSE') {
      return categories.filter((c) => !c.isIncome);
    }
    return categories;
  }, [categories, type]);

  const accountOptions = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount = accountOptions.find((a) => a.id === selectedAccountId);
  const activeCategoryId = selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '');
  const currentCategory = filteredCategories.find((c) => c.id === activeCategoryId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel = !selectedDate
    ? 'Select Date'
    : selectedDate === todayStr
    ? 'Today'
    : selectedDate === yesterdayStr
    ? 'Yesterday'
    : new Date(selectedDate).toLocaleDateString(numberingSystem === 'indian' ? 'en-IN' : 'en-US', { day: 'numeric', month: 'short' });

  const activeAmount = parseKeypadToPaise(amountStr);
  const formattedRupees = (activeAmount / 100).toLocaleString(
    numberingSystem === 'indian' ? 'en-IN' : 'en-US',
    {
      maximumFractionDigits: 2,
    }
  );

  const isSplit = splits.length > 1 && type === 'EXPENSE';

  const sheetStyle: React.CSSProperties = {
    height: '92vh',
    maxHeight: '92vh',
    transform: isClosing
      ? 'translateY(100%)'
      : dragOffset !== 0
      ? `translateY(${dragOffset}px)`
      : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const backdropOpacity = isClosing
    ? 0
    : dragOffset > 0
    ? Math.max(0.1, 1 - dragOffset / 350)
    : 1;

  const backdropStyle: React.CSSProperties = {
    opacity: backdropOpacity,
    transition: isDragging ? 'none' : 'opacity 260ms ease-out',
  };

  return (
    <>
      {/* 1. Backdrop */}
      <div
        onClick={triggerClose}
        aria-hidden="true"
        style={backdropStyle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity select-none"
      />

      {/* 2. Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        style={sheetStyle}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[420px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-300"
      >
        {/* Generous Draggable Pull Handle Zone */}
        <div
          onPointerDown={(e) => {
            if (e.button === 0) handleDragStart(e.clientY);
          }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          className="w-full pt-3 pb-1.5 flex flex-col items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing group shrink-0"
          title="Drag down to close"
        >
          <div className="w-11 h-1.5 rounded-full bg-slate-400/50 dark:bg-slate-500/50 group-hover:bg-slate-500 dark:group-hover:bg-slate-400 group-active:scale-95 transition-all shadow-xs" />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: AMOUNT KEYPAD SCREEN                                       */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="flex flex-col flex-1 min-h-0 justify-between px-5 pb-8 animate-in fade-in duration-200">
            {/* Top Header Bar */}
            <div
              onPointerDown={(e) => {
                if (e.button === 0) handleDragStart(e.clientY);
              }}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              className="flex items-center justify-between pb-2 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerClose();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
              >
                <ArrowLeft className="size-5" />
              </button>

              <h2
                id="add-transaction-title"
                className="text-sm font-bold text-theme-primary uppercase tracking-wider"
              >
                {type === 'EXPENSE' ? 'Add Expense' : type === 'INCOME' ? 'Add Income' : 'Add Transfer'}
              </h2>

              <div className="size-9" />
            </div>

            {/* Type Switcher Pills */}
            <div className="flex items-center justify-center pb-2 shrink-0">
              <div className="flex items-center rounded-full bg-theme-card-subtle p-1 border border-theme-border/50">
                {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
                  const isSelected = type === t;
                  const label = t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer';
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (type !== t) {
                          setType(t);
                          setSelectedCategoryId('');
                          setSplits([]);
                          setErrors((prev) => ({ ...prev, category: false, splitBalance: false }));
                          setErrorMessage(null);
                        }
                      }}
                      className={cn(
                        'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
                        isSelected
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'text-theme-secondary hover:text-theme-primary'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="my-1 shrink-0 flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
                <AlertCircle className="size-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Centered Hero: Amount + Note Pill */}
            <div className="flex flex-col items-center justify-center py-2 shrink-0">
              <span className="text-xs font-medium text-theme-muted tracking-wider uppercase mb-1">
                Enter amount
              </span>

              <div className="flex items-baseline justify-center gap-1.5 select-none">
                <span className="text-2xl font-semibold text-theme-muted font-mono">{currencySymbol}</span>
                <span className="text-5xl font-light tracking-tight tabular-nums text-theme-primary font-mono">
                  {amountStr}
                </span>
                <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-500" />
              </div>

              {/* Optional Quick Payee/Merchant input in Step 1 */}
              <div className="mt-3 flex items-center justify-center w-full max-w-[260px]">
                <div className="relative flex items-center w-full">
                  <Store className="absolute left-3.5 size-3.5 text-theme-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Merchant or note (optional)"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full rounded-full bg-theme-card-subtle pl-9 pr-4 py-2 text-xs text-center text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors shadow-xs"
                  />
                </div>
              </div>

              {/* Subtle Quick Increment Chips */}
              <div className="mt-3 flex items-center gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="rounded-full bg-theme-card-subtle px-3 py-1.5 text-xs font-medium font-mono text-theme-secondary hover:text-theme-primary hover:bg-theme-card active:scale-[0.95] transition-all shadow-xs border border-theme-border/40"
                  >
                    +{currencySymbol}{amt.toLocaleString(numberingSystem === 'indian' ? 'en-IN' : 'en-US')}
                  </button>
                ))}
              </div>
            </div>

            {/* Keypad */}
            <div className="py-2 flex-1 flex flex-col justify-center min-h-0">
              <div className="grid grid-cols-3 gap-2.5 max-w-[340px] mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="flex h-12 items-center justify-center rounded-2xl bg-theme-card/60 hover:bg-theme-card text-theme-primary text-xl font-medium font-mono active:scale-[0.92] transition-all border border-theme-border/30"
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

            {/* Primary CTA */}
            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={handleProceedToDetails}
                disabled={activeAmount <= 0}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
              >
                <span>
                  {activeAmount > 0
                    ? `Proceed to Details (${currencySymbol}${formattedRupees})`
                    : 'Enter amount to proceed'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: DETAILS CANVAS (Transaction Specifics Screen)              */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
            {/* Top Header Bar */}
            <div
              onPointerDown={(e) => {
                if (e.button === 0) handleDragStart(e.clientY);
              }}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              className="flex items-center justify-between px-4 pb-3 border-b border-theme-border/40 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
            >
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                aria-label="Back to Amount"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
              >
                <ArrowLeft className="size-5" />
              </button>

              <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider">
                {type === 'EXPENSE' ? 'Add Expense Details' : type === 'INCOME' ? 'Add Income Details' : 'Add Transfer Details'}
              </h2>

              <div className="size-9" />
            </div>

            {/* Scrollable Content Body with All Specifics */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
                  <AlertCircle className="size-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Centered Hero: Amount + Edit Button */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border',
                      type === 'EXPENSE'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : type === 'INCOME'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    )}
                  >
                    {isSplit ? 'Split Expense' : type}
                  </span>
                </div>

                <div className="flex items-baseline justify-center gap-1 select-none">
                  <span className="text-2xl font-semibold text-theme-muted font-mono">{currencySymbol}</span>
                  <span className="text-4xl font-bold tracking-tight text-theme-primary font-mono tabular-nums">
                    {formattedRupees}
                  </span>
                </div>

                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-theme-card-subtle hover:bg-theme-card border border-theme-border px-3.5 py-1.5 text-xs font-medium text-theme-secondary hover:text-theme-primary active:scale-95 transition-all shadow-xs"
                    title="Change amount"
                  >
                    <Pencil className="size-3 text-theme-muted" />
                    <span>Edit amount</span>
                  </button>
                </div>
              </div>

              {/* 1. Merchant / Payee Field */}
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                  Merchant / Payee
                </label>
                <div className="relative flex items-center">
                  <Store className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Starbucks, Amazon, Salary"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full h-12 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* 2. Category Section */}
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                  {type === 'INCOME' ? 'Income Category' : 'Category'}
                </label>
                {isSplit ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-semibold text-theme-secondary">
                        Split into {splits.length} categories
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePicker('category')}
                        className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                      >
                        Edit categories
                      </button>
                    </div>

                    <CategorySplitEditor
                      totalAmountPaise={activeAmount}
                      splits={splits}
                      categories={filteredCategories}
                      onChange={(updated) => {
                        if (updated.length === 1) {
                          setSelectedCategoryId(updated[0].categoryId);
                          setSplits([]);
                        } else {
                          setSplits(updated);
                        }
                      }}
                      onAddCategoryClick={() => setActivePicker('category')}
                      allowRemoveToSingle={true}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActivePicker('category')}
                      className={cn(
                        'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
                        errors.category
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
                          : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex size-9 items-center justify-center rounded-lg text-white shadow-xs',
                            currentCategory ? currentCategory.bgClass : 'bg-violet-600'
                          )}
                        >
                          <CategoryIcon name={currentCategory ? currentCategory.iconName : 'Tag'} size={18} />
                        </div>
                        <div>
                          <div className={cn('text-xs font-semibold', errors.category ? 'text-rose-500' : 'text-theme-primary')}>
                            {currentCategory ? currentCategory.name : (type === 'INCOME' ? 'Choose income category' : 'Choose category')}
                          </div>
                          <div className="text-[11px] text-theme-muted">
                            {currentCategory ? 'Tap to change' + (type === 'EXPENSE' ? ' or split' : '') : 'Tap to select' + (type === 'EXPENSE' ? ' or split' : '')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-theme-muted">
                        <span>{currentCategory ? (type === 'EXPENSE' ? 'Change / Split' : 'Change') : 'Select'}</span>
                        <ChevronDown className="size-3.5" />
                      </div>
                    </button>

                    {currentCategory && type === 'EXPENSE' && (
                      <button
                        type="button"
                        onClick={() => setActivePicker('category')}
                        className="flex items-center gap-1.5 self-start px-1 py-0.5 text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                      >
                        <Split className="size-3" />
                        <span>Split into multiple categories</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Payment Account Field */}
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                  Payment Account
                </label>
                <button
                  type="button"
                  onClick={() => setActivePicker('account')}
                  className={cn(
                    'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
                    errors.account
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
                      : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/50">
                      <CreditCard className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-theme-primary">
                        {currentAccount ? currentAccount.name : 'Select Account'}
                      </div>
                      <div className="text-[11px] text-theme-muted font-mono">
                        {currentAccount
                          ? `···· ${'maskNumber' in currentAccount ? currentAccount.maskNumber : ('mask' in currentAccount ? currentAccount.mask : '')}`
                          : 'Tap to choose payment account'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-theme-muted">
                    <span>Change</span>
                    <ChevronDown className="size-3.5" />
                  </div>
                </button>
              </div>

              {/* 4. Date Field */}
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                  Date
                </label>
                <button
                  type="button"
                  onClick={() => setActivePicker('date')}
                  className={cn(
                    'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
                    errors.date
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
                      : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/50">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-theme-primary">
                        {dateDisplayLabel}
                      </div>
                      <div className="text-[11px] text-theme-muted">
                        {selectedDate ? selectedDate : 'Tap to select date'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-theme-muted">
                    <span>Change</span>
                    <ChevronDown className="size-3.5" />
                  </div>
                </button>
              </div>

              {/* 5. Notes Field */}
              <div>
                <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                  Notes (Optional)
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Add note, bill number or memo"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-12 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Pinned Sticky Bottom CTA */}
            <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 border-t border-theme-border/40 backdrop-blur-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
              >
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : isSplit
                    ? `Save Split Expense ${currencySymbol}${formattedRupees}`
                    : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ${currencySymbol}${formattedRupees}`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SUB-PICKER: CATEGORY SELECTION                                     */}
        {/* ------------------------------------------------------------------ */}
        {activePicker === 'category' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-theme-border/40 shrink-0">
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                aria-label="Back"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="text-center">
                <span className="text-sm font-bold text-theme-primary uppercase tracking-wider">
                  {type === 'EXPENSE'
                    ? 'Select Expense Category'
                    : type === 'INCOME'
                    ? 'Select Income Category'
                    : 'Select Category'}
                </span>
                <p className="text-[11px] text-theme-muted">
                  {type === 'EXPENSE'
                    ? splits.length > 1
                      ? `${splits.length} categories selected • Split bill below`
                      : 'Choose 1 category or tap multiple to split'
                    : 'Choose 1 category'}
                </p>
              </div>
              <div className="size-9" />
            </div>

            {/* Scrollable Canvas: Category Grid + Categorization Breakdown */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {filteredCategories.map((cat) => {
                  const isSelectedInSplit = splits.some((s) => s.categoryId === cat.id);
                  const isSingleSelected = !splits.length && selectedCategoryId === cat.id;
                  const isSelected = isSelectedInSplit || isSingleSelected;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategoryInPicker(cat.id)}
                      className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-theme-card-hover active:scale-95 transition-all relative"
                    >
                      <div
                        className={cn(
                          'flex size-12 items-center justify-center rounded-2xl text-white transition-all relative shadow-xs',
                          cat.bgClass,
                          isSelected ? 'ring-2 ring-violet-500 scale-105 shadow-md' : ''
                        )}
                      >
                        <CategoryIcon name={cat.iconName} size={20} />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs">
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-center text-[11px] truncate w-full mt-1',
                          isSelected ? 'font-bold text-theme-primary' : 'text-theme-secondary'
                        )}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="py-8 text-center text-xs text-theme-muted">
                  No {type === 'EXPENSE' ? 'expense' : 'income'} categories available.
                </div>
              )}

              {/* Categorization Split Breakdown */}
              {type === 'EXPENSE' && splits.length > 1 && (
                <div className="pt-4 border-t border-theme-border/40 animate-in fade-in duration-150">
                  <CategorySplitEditor
                    totalAmountPaise={activeAmount}
                    splits={splits}
                    categories={filteredCategories}
                    onChange={(updated) => {
                      if (updated.length === 1) {
                        setSelectedCategoryId(updated[0].categoryId);
                        setSplits([]);
                      } else {
                        setSplits(updated);
                      }
                    }}
                    allowRemoveToSingle={true}
                  />
                </div>
              )}
            </div>

            {/* Pinned Bottom Apply Button */}
            <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 border-t border-theme-border/40 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryId || splits.length > 0) {
                    setErrors((prev) => ({ ...prev, category: false }));
                    setErrorMessage(null);
                  }
                  setActivePicker(null);
                }}
                className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 shadow-lg active:scale-[0.97] transition-all"
              >
                <span>
                  {splits.length > 1
                    ? `Apply Split (${splits.length} Categories)`
                    : currentCategory
                    ? `Apply ${currentCategory.name}`
                    : 'Done'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SUB-PICKER: ACCOUNT SELECTION                                      */}
        {/* ------------------------------------------------------------------ */}
        {activePicker === 'account' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-theme-border/40 shrink-0">
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                aria-label="Back"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <span className="text-sm font-bold text-theme-primary uppercase tracking-wider">Select Payment Account</span>
              <div className="size-9" />
            </div>

            <div className="flex flex-col gap-2 p-5 overflow-y-auto no-scrollbar flex-1">
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
                      'flex items-center justify-between p-3.5 rounded-xl border transition-all text-left',
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10 text-theme-primary shadow-xs'
                        : 'border-theme-border bg-theme-card-subtle hover:bg-theme-card text-theme-secondary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/40">
                        <CreditCard className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-theme-primary">{acc.name}</div>
                        <div className="text-[11px] text-theme-muted font-mono">···· {mask}</div>
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
        {/* SUB-PICKER: DATE SELECTION                                         */}
        {/* ------------------------------------------------------------------ */}
        {activePicker === 'date' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-theme-border/40 shrink-0">
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                aria-label="Back"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <span className="text-sm font-bold text-theme-primary uppercase tracking-wider">Select Date</span>
              <div className="size-9" />
            </div>

            <div className="flex items-center justify-center w-full p-4">
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
    </>
  );
};
