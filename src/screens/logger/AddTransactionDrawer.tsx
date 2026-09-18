import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Delete,
  ArrowRight,
  Calendar,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Check,
  Users,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  Category,
  Account,
  TransactionType,
  Transaction,
  SplitDetails,
} from '../../domain/models/types';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CalendarPicker } from '../../components/common/CalendarPicker';
import { SplitExpenseModal } from './SplitExpenseModal';
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

  // Form State - unselected by default
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  const [splitDetails, setSplitDetails] = useState<SplitDetails | undefined>(undefined);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation error state
  const [errors, setErrors] = useState<{
    amount?: boolean;
    category?: boolean;
    account?: boolean;
    date?: boolean;
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
    setType('EXPENSE');
    setAmountStr('0');
    setSelectedCategoryId('');
    setSelectedAccountId('');
    setSelectedDate('');
    setMerchantNote('');
    setSplitDetails(undefined);
    setIsSplitModalOpen(false);
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

  const updateEqualSplit = (newPaise: number) => {
    setSplitDetails((prev) => {
      if (!prev || prev.splitType !== 'EQUAL') return prev;
      const count = prev.participants.length;
      if (count <= 0) return prev;
      const eq = Math.floor(newPaise / count);
      const rem = newPaise - eq * count;
      const myShare = eq + rem;
      const lent = newPaise - myShare;
      return {
        ...prev,
        totalAmount: newPaise,
        myShare,
        lentAmount: lent,
        participants: prev.participants.map((p) => ({
          ...p,
          amount: p.isPaidByMe ? myShare : eq,
        })),
      };
    });
  };

  const handleKeypadPress = (key: string) => {
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: false }));
      setErrorMessage(null);
    }

    let nextStr = amountStr;
    if (key === 'BACKSPACE') {
      nextStr = amountStr.length <= 1 ? '0' : amountStr.slice(0, -1);
    } else if (key === '.') {
      if (!amountStr.includes('.')) {
        nextStr = amountStr + '.';
      }
    } else {
      // Numbers 0-9
      if (amountStr === '0') {
        nextStr = key;
      } else {
        const parts = amountStr.split('.');
        if (parts.length <= 1 || parts[1].length < 2) {
          nextStr = amountStr + key;
        }
      }
    }

    setAmountStr(nextStr);
    const newPaise = parseKeypadToPaise(nextStr);
    updateEqualSplit(newPaise);
  };

  const handleQuickAdd = (rupeesToAdd: number) => {
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: false }));
      setErrorMessage(null);
    }
    const currentPaise = parseKeypadToPaise(amountStr);
    const currentRupees = paiseToRupees(currentPaise);
    const newRupees = currentRupees + rupeesToAdd;
    const nextStr = newRupees.toString();
    setAmountStr(nextStr);
    const newPaise = parseKeypadToPaise(nextStr);
    updateEqualSplit(newPaise);
  };

  const handleSave = async () => {
    const paiseAmount = parseKeypadToPaise(amountStr);
    const newErrors: {
      amount?: boolean;
      category?: boolean;
      account?: boolean;
      date?: boolean;
    } = {};
    const missing: string[] = [];

    if (paiseAmount <= 0) {
      newErrors.amount = true;
      missing.push('amount');
    }
    if (!selectedCategoryId) {
      newErrors.category = true;
      missing.push('category');
    }
    if (!selectedAccountId) {
      newErrors.account = true;
      missing.push('account');
    }
    if (!selectedDate) {
      newErrors.date = true;
      missing.push('date');
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
        isSplit: Boolean(splitDetails),
        splitDetails: splitDetails || undefined,
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrorMessage('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  const currentAccount = selectedAccountId
    ? accountList.find((a) => a.id === selectedAccountId)
    : undefined;

  const currentCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : undefined;

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
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all shrink-0 shadow-xs',
              errors.category
                ? 'border border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400 font-semibold'
                : currentCategory
                ? 'border border-theme-border bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                : 'border border-dashed border-theme-border bg-theme-card-subtle text-theme-secondary hover:text-theme-primary'
            )}
          >
            {currentCategory ? (
              <span className={cn('size-2 rounded-full', currentCategory.bgClass || 'bg-violet-500')} />
            ) : (
              <Tag className={cn('size-3', errors.category ? 'text-rose-500' : 'text-theme-muted')} />
            )}
            <span className="truncate max-w-[85px]">{currentCategory ? currentCategory.name : 'Select Category'}</span>
            <ChevronDown className={cn('size-3', errors.category ? 'text-rose-500' : 'text-theme-muted')} />
          </button>

          {/* Account Chip */}
          <button
            type="button"
            onClick={() => setActivePicker('account')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all shrink-0 shadow-xs',
              errors.account
                ? 'border border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400 font-semibold'
                : currentAccount
                ? 'border border-theme-border bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                : 'border border-dashed border-theme-border bg-theme-card-subtle text-theme-secondary hover:text-theme-primary'
            )}
          >
            <CreditCard className={cn('size-3', errors.account ? 'text-rose-500' : 'text-theme-muted')} />
            <span className="truncate max-w-[95px]">
              {currentAccount
                ? `${currentAccount.name} ····${'maskNumber' in currentAccount ? currentAccount.maskNumber : ''}`
                : 'Select Account'}
            </span>
            <ChevronDown className={cn('size-3', errors.account ? 'text-rose-500' : 'text-theme-muted')} />
          </button>

          {/* Date Chip */}
          <button
            type="button"
            onClick={() => setActivePicker('date')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all shrink-0 shadow-xs',
              errors.date
                ? 'border border-rose-500 ring-1 ring-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400 font-semibold'
                : selectedDate
                ? 'border border-theme-border bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                : 'border border-dashed border-theme-border bg-theme-card-subtle text-theme-secondary hover:text-theme-primary'
            )}
          >
            <Calendar className={cn('size-3', errors.date ? 'text-rose-500' : 'text-theme-muted')} />
            <span>{dateDisplayLabel}</span>
            <ChevronDown className={cn('size-3', errors.date ? 'text-rose-500' : 'text-theme-muted')} />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="mx-4 mt-1 mb-0 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-500 dark:text-rose-400 transition-all animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="size-3.5 shrink-0 text-rose-500" />
            <span className="font-medium text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Hero Amount Section with Blinking Cursor */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1 px-4">
          <div className="flex items-baseline gap-1 select-none">
            <span className={cn('text-2xl font-bold transition-colors', errors.amount ? 'text-rose-500' : 'text-theme-muted')}>₹</span>
            <span className={cn('text-4xl font-extrabold tracking-tight tabular-nums transition-colors', errors.amount ? 'text-rose-500' : 'text-theme-primary')}>
              {amountStr}
            </span>
            <span className={cn('ml-0.5 h-7 w-0.5 animate-pulse rounded-full', errors.amount ? 'bg-rose-500' : 'bg-violet-500')} />
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

        {/* Clean Note Input */}
        <div className="px-4 py-1">
          <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-input px-3 py-2 shadow-xs transition-colors focus-within:border-violet-500/50">
            <MessageSquare className="size-3.5 text-theme-muted shrink-0" />
            <input
              type="text"
              placeholder="What's this for? (Merchant / Note)..."
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              className="w-full bg-transparent text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none"
            />
          </div>

          {/* Dedicated Splitwise Bar (Only for Expenses) */}
          {type === 'EXPENSE' && (
            <div className="mt-1.5">
              {!splitDetails ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeAmount <= 0) {
                      setErrors((prev) => ({ ...prev, amount: true }));
                      setErrorMessage('Please enter an amount before splitting');
                      return;
                    }
                    setIsSplitModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-violet-500/35 bg-violet-500/5 hover:bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 transition-all active:scale-[0.99] shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400">
                      <Users className="size-3" />
                    </div>
                    <span className="text-[11px] font-semibold">Split this expense with friends (Splitwise)</span>
                  </div>
                  <ChevronRight className="size-3.5 text-violet-400" />
                </button>
              ) : (
                <div className="flex w-full items-center justify-between rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs transition-all shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0">
                      <Users className="size-3" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-bold text-theme-primary truncate">
                        Split with {splitDetails.participants.filter((p) => !p.isPaidByMe).map((p) => p.name.split(' ')[0]).join(', ')}
                      </div>
                      <div className="text-[10px] text-theme-secondary">
                        Your share: <span className="font-bold text-violet-600 dark:text-violet-400">₹{(splitDetails.myShare / 100).toFixed(0)}</span>
                        {' • '}
                        Lent: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(splitDetails.lentAmount / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSplitModalOpen(true)}
                      className="px-2 py-0.5 rounded-lg bg-violet-600 text-white text-[10px] font-semibold hover:bg-violet-500 transition-colors shadow-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitDetails(undefined);
                      }}
                      className="p-1 rounded-lg text-theme-muted hover:text-rose-500 transition-colors"
                      title="Remove split"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GPay 3x4 Touch Keypad */}
        <div className="px-4 py-1">
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
            disabled={isSubmitting}
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
                ? splitDetails
                  ? `Save Split Expense ₹${formattedRupees} (Your share ₹${(splitDetails.myShare / 100).toFixed(0)})`
                  : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ₹${formattedRupees}`
                : 'Enter Amount & Save'}
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

        {/* Splitwise Split Expense Modal */}
        <SplitExpenseModal
          isOpen={isSplitModalOpen}
          totalAmountPaise={activeAmount}
          initialSplitDetails={splitDetails}
          onApply={(details) => {
            setSplitDetails(details);
            setIsSplitModalOpen(false);
          }}
          onRemove={() => {
            setSplitDetails(undefined);
            setIsSplitModalOpen(false);
          }}
          onClose={() => setIsSplitModalOpen(false)}
        />
      </div>
    </div>
  );
};
