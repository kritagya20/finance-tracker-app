import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Calendar,
  CreditCard,
  ChevronDown,
  Check,
  AlertCircle,
  Delete,
  Pencil,
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

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  
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

  const resetForm = () => {
    setStep(1);
    setType('EXPENSE');
    setAmountStr('0');
    setSelectedCategoryId('');
    setSelectedAccountId('');
    setSelectedDate('');
    setMerchantNote('');
    setSplits([]);
    setActivePicker(null);
    setErrors({});
    setErrorMessage(null);
  };

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
        resetForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
          missing.push(`remaining ₹${paiseToRupees(diff)} to allocate`);
        } else {
          missing.push(`reduce overage of ₹${paiseToRupees(Math.abs(diff))}`);
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
      const effectiveCategoryId = isSplit
        ? (splits[0]?.categoryId || 'cat_dining')
        : (selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '') || 'cat_dining');
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
  const activeCategoryId = selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '');
  const currentCategory = categories.find((c) => c.id === activeCategoryId);

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

  const isSplit = splits.length > 1 && type === 'EXPENSE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-theme-elevated transition-all duration-300 mx-auto max-w-[430px] overflow-hidden select-none',
        isAnimatingIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* STEP 1: AMOUNT KEYPAD (Full-Screen GPay-Inspired Minimal Flow)     */}
      {/* ------------------------------------------------------------------ */}
      {step === 1 && (
        <div className="flex flex-col flex-1 min-h-0 justify-between px-5 pt-4 pb-8 animate-in fade-in duration-200">
          {/* Top Bar: Clean Minimal Switcher + Close */}
          <div className="flex items-center justify-between pb-2 shrink-0">
            <div className="flex items-center rounded-full bg-theme-card-subtle p-0.5">
              {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
                const isSelected = type === t;
                const label = t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all',
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
              className="flex size-9 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="my-1 shrink-0 flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
              <AlertCircle className="size-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Centered Hero: "Enter amount" + Large Amount + "What's this for?" Pill */}
          <div className="flex flex-col items-center justify-center py-4 shrink-0">
            <span className="text-xs font-medium text-theme-muted tracking-wider uppercase mb-1">
              Enter amount
            </span>

            <div className="flex items-baseline justify-center gap-1.5 select-none">
              <span className="text-2xl font-semibold text-theme-muted">₹</span>
              <span className="text-5xl font-light tracking-tight tabular-nums text-theme-primary">
                {amountStr}
              </span>
              <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-500" />
            </div>

            {/* Centered Pill: "What's this for?" (Border-free soft pill) */}
            <div className="mt-4 flex items-center justify-center">
              <input
                type="text"
                placeholder="What's this for?"
                value={merchantNote}
                onChange={(e) => setMerchantNote(e.target.value)}
                className="rounded-full bg-theme-card-subtle px-4 py-2 text-xs text-center text-theme-primary placeholder:text-theme-muted focus:outline-none max-w-[240px] transition-colors shadow-xs"
              />
            </div>

            {/* Subtle Quick Increment Chips (Border-free) */}
            <div className="mt-4 flex items-center gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="rounded-full bg-theme-card-subtle px-3 py-1.5 text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-card active:scale-95 transition-all shadow-xs"
                >
                  +₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Flat, Spacious Keypad (Border-free) */}
          <div className="py-3 flex-1 flex flex-col justify-center min-h-0">
            <div className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="flex h-12 items-center justify-center rounded-2xl bg-theme-card/50 hover:bg-theme-card text-theme-primary text-xl font-medium active:scale-95 transition-all"
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

          {/* GPay Pill CTA */}
          <div className="pt-2 shrink-0">
            <button
              type="button"
              onClick={handleProceedToDetails}
              disabled={activeAmount <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg active:scale-[0.99] transition-all"
            >
              <span>{activeAmount > 0 ? `Proceed with ₹${formattedRupees}` : 'Enter amount to proceed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2: DETAILS CANVAS (Full-Screen GPay-Inspired Clean Canvas)    */}
      {/* ------------------------------------------------------------------ */}
      {step === 2 && (
        <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
          {/* Top Bar: Back Arrow + Title + Close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(1);
              }}
              className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>

            <span className="text-sm font-semibold text-theme-primary">
              Transaction details
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
                <AlertCircle className="size-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Centered Hero: Amount + Note */}
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-xs font-medium text-theme-muted mb-1">
                {isSplit ? 'Amount to split' : `${type.toLowerCase()} amount`}
              </span>

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-semibold text-theme-muted">₹</span>
                <span className="text-4xl font-light tracking-tight text-theme-primary tabular-nums">
                  {formattedRupees}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep(1);
                  }}
                  className="ml-2.5 p-1.5 rounded-full text-theme-muted hover:text-violet-400 hover:bg-theme-card-subtle transition-colors"
                  title="Change amount"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              {/* Note pill (editable) */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="What's this for?"
                  value={merchantNote}
                  onChange={(e) => setMerchantNote(e.target.value)}
                  className="rounded-full bg-theme-card-subtle px-4 py-2 text-xs text-center text-theme-primary placeholder:text-theme-muted focus:outline-none max-w-[240px] transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* Context Pills: Account & Date */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              <button
                type="button"
                onClick={() => setActivePicker('account')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all shadow-xs',
                  errors.account
                    ? 'border border-rose-500 bg-rose-500/10 text-rose-500'
                    : 'bg-theme-card-subtle hover:bg-theme-card text-theme-primary border border-transparent'
                )}
              >
                <CreditCard className="size-3.5 text-theme-muted" />
                <span className="truncate max-w-[120px]">
                  {currentAccount ? currentAccount.name : 'Select Account'}
                </span>
                <ChevronDown className="size-3 text-theme-muted" />
              </button>

              <button
                type="button"
                onClick={() => setActivePicker('date')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all shadow-xs',
                  errors.date
                    ? 'border border-rose-500 bg-rose-500/10 text-rose-500'
                    : 'bg-theme-card-subtle hover:bg-theme-card text-theme-primary border border-transparent'
                )}
              >
                <Calendar className="size-3.5 text-theme-muted" />
                <span>{dateDisplayLabel}</span>
                <ChevronDown className="size-3 text-theme-muted" />
              </button>
            </div>

            {/* Unified Category Section (NO ARTIFICIAL TABS!) */}
            {isSplit ? (
              <div className="py-2">
                <div className="flex items-center justify-between pb-2">
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
                  categories={categories}
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
              <div className="py-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActivePicker('category')}
                  className={cn(
                    'flex items-center justify-between py-3 px-4 rounded-2xl transition-all shadow-xs',
                    errors.category
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/40'
                      : 'bg-theme-card-subtle hover:bg-theme-card text-theme-primary border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl text-white shadow-xs',
                        currentCategory ? currentCategory.bgClass : 'bg-violet-600'
                      )}
                    >
                      <CategoryIcon name={currentCategory ? currentCategory.iconName : 'Tag'} size={18} />
                    </div>
                    <div className="text-left">
                      <div className={cn('text-xs font-semibold', errors.category ? 'text-rose-500' : 'text-theme-primary')}>
                        {currentCategory ? currentCategory.name : 'Choose category'}
                      </div>
                      <div className="text-xs text-theme-muted mt-0.5">
                        {currentCategory ? 'Tap to change or split' : 'Tap to select or split'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-theme-muted">
                    <span>{currentCategory ? 'Change / Split' : 'Select'}</span>
                    <ChevronDown className="size-3.5" />
                  </div>
                </button>

                {/* Subtle "+ Split with another category" button for direct discoverability */}
                {currentCategory && type === 'EXPENSE' && (
                  <button
                    type="button"
                    onClick={() => setActivePicker('category')}
                    className="flex items-center gap-1.5 self-start px-2 py-1 text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                  >
                    <Split className="size-3.5" />
                    <span>Split into multiple categories</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pinned Sticky Bottom CTA Footer */}
          <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg active:scale-[0.99] transition-all"
            >
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isSplit
                  ? `Save Split Expense ₹${formattedRupees}`
                  : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ₹${formattedRupees}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Picker Sub-Sheet: Category (Uncluttered, Border-free, Multi-Category Splitting Built-In!) */}
      {activePicker === 'category' && (
        <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <span className="text-sm font-bold text-theme-primary">Select Category</span>
                <p className="text-[11px] text-theme-muted">
                  {splits.length > 1
                    ? `${splits.length} categories selected • Split bill below`
                    : 'Choose 1 category or tap multiple to split'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePicker(null)}
              className="flex size-9 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable Canvas: Category Grid + Categorization Breakdown */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
            {/* Category Grid with Generous Spacing and No Harsh White Borders */}
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {categories.map((cat) => {
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

            {/* Whenever user clicks more than single category: Show Categorization Breakdown Right Here! */}
            {splits.length > 1 && (
              <div className="pt-4 border-t border-theme-divider animate-in fade-in duration-150">
                <CategorySplitEditor
                  totalAmountPaise={activeAmount}
                  splits={splits}
                  categories={categories}
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
          <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => {
                if (selectedCategoryId || splits.length > 0) {
                  setErrors((prev) => ({ ...prev, category: false }));
                  setErrorMessage(null);
                }
                setActivePicker(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg active:scale-[0.99] transition-all"
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

        {/* Quick Picker Sub-Sheet: Account */}
        {activePicker === 'account' && (
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
              <span className="text-sm font-bold text-theme-primary">Select Payment Account</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="flex size-9 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <X className="size-5" />
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
                      'flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left',
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10 text-theme-primary shadow-xs'
                        : 'border-theme-divider bg-theme-card-subtle hover:bg-theme-card text-theme-secondary'
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
          <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated p-5 animate-in fade-in duration-150 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-theme-divider mb-3">
              <span className="text-sm font-bold text-theme-primary">Select Date</span>
              <button
                type="button"
                onClick={() => setActivePicker(null)}
                className="flex size-9 items-center justify-center rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <X className="size-5" />
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
  );
};
