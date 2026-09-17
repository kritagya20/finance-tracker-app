import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Trash2, ArrowUpDown, Calendar } from 'lucide-react';
import { Category, Transaction, TransactionType, Account } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { parseKeypadToPaise } from '../../domain/engine/moneyUtils';
import { CalendarPicker } from '../../components/common/CalendarPicker';
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
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    tx ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
      setSelectedDate(tx.date.slice(0, 10));
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
        setIsCalendarOpen(false);
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

    // Numeric 0-9
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
      const updatedDate = new Date(selectedDate);
      const origDate = new Date(tx.date);
      updatedDate.setHours(origDate.getHours(), origDate.getMinutes(), origDate.getSeconds());

      await onSave({
        type,
        amount: paiseAmount,
        merchantName: merchantName.trim() || tx.merchantName,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        notes: notes.trim() || undefined,
        date: updatedDate.toISOString(),
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel =
    selectedDate === todayStr
      ? 'Today'
      : selectedDate === yesterdayStr
      ? 'Yesterday'
      : new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

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

      {/* Drawer Container */}
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
          <div className="mx-auto h-1.5 w-10 rounded-full bg-theme-muted/40" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold text-xs">
                Edit
              </span>
              <h2 className="text-base font-bold text-theme-primary">Edit Transaction</h2>
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 no-scrollbar space-y-4">
          {/* Segmented Type Switcher */}
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

          {/* Metadata Section */}
          <div className="space-y-2.5">
            {/* Merchant / Payee Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-secondary">Merchant / Payee</label>
              <input
                type="text"
                placeholder="e.g. Starbucks, Swiggy, Amazon"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/50 focus:outline-none"
              />
            </div>

            {/* Account Selector & Calendar Date Picker */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const currIdx = accountOptions.findIndex((a) => a.id === selectedAccountId);
                  const nextIdx = (currIdx + 1) % accountOptions.length;
                  setSelectedAccountId(accountOptions[nextIdx].id);
                }}
                className="flex flex-1 items-center justify-between gap-1 rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5 text-left text-xs font-medium text-theme-primary active:bg-theme-card-subtle transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{currentAccount.name}</span>
                  <span className="text-[10px] text-theme-muted">···{('maskNumber' in currentAccount ? currentAccount.maskNumber : ('mask' in currentAccount ? currentAccount.mask : ''))}</span>
                </div>
                <ArrowUpDown className="size-3.5 shrink-0 text-theme-muted" />
              </button>

              {/* Interactive Calendar Date Button */}
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

            {/* Note / Memo */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-secondary">Notes / Memo</label>
              <input
                type="text"
                placeholder="Add optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/50 focus:outline-none"
              />
            </div>

            {/* Split Switch */}
            <div className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-input px-3.5 py-2.5">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary">
                  Split Transaction
                </span>
                <span className="text-[10px] text-theme-muted">
                  Divide amount across multiple categories
                </span>
              </div>
              <Switch
                checked={isSplit}
                onCheckedChange={setIsSplit}
                ariaLabel="Split transaction toggle"
              />
            </div>
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

          {/* Action Buttons: Delete & Update CTA */}
          <div className="pt-2 pb-6 space-y-2.5">
            <button
              type="button"
              disabled={isSubmitting || parseKeypadToPaise(amountStr) <= 0}
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Updating...' : 'Update Transaction'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(tx.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-[0.98] transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Transaction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
