import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Search,
  ArrowDown,
  ArrowUp,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Split,
  X,
} from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { getCategoryById } from '../../domain/engine/categories';
import { cn } from '../../lib/utils';

export interface VelocitySpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dayPoint: {
    day: number;
    dateStr: string;
    cumulative: number;
    daily: number;
  } | null;
  transactions: Transaction[];
  periodStart: Date;
  periodEnd: Date;
  totalExpense: number;
  totalBudget: number;
  hideBalances: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

interface ContributingItem {
  id: string;
  transaction: Transaction;
  merchantName: string;
  categoryId: string;
  dateStr: string;
  timestamp: number;
  amount: number;
  isSplit: boolean;
  note?: string;
}

type SortField = 'date' | 'amount';
type SortOrder = 'desc' | 'asc';
type SnapState = 'partial' | 'full';

export const VelocitySpendDrawer: React.FC<VelocitySpendDrawerProps> = ({
  isOpen,
  onClose,
  dayPoint,
  transactions,
  periodStart,
  periodEnd,
  totalExpense,
  totalBudget,
  hideBalances,
  onSelectTransaction,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Draggable bottom sheet state
  const [snap, setSnap] = useState<SnapState>('full');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listTouchStartYRef = useRef(0);

  // Smooth dismiss animation
  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setDragOffset(window.innerHeight || 800);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragOffset(0);
      setSnap('full');
    }, 220);
  }, [onClose]);

  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, triggerClose]);

  // Reset filters & states when opened with a new dayPoint
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSortField('date');
      setSortOrder('desc');
      setSnap('full');
      setDragOffset(0);
      setIsClosing(false);
      isDraggingRef.current = false;
    }
  }, [isOpen, dayPoint]);

  // Drag Handlers
  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaY = clientY - startYRef.current;

      if (snap === 'full') {
        if (deltaY < 0) {
          setDragOffset(deltaY * 0.25);
        } else {
          setDragOffset(deltaY);
        }
      } else {
        if (deltaY < 0) {
          setDragOffset(deltaY);
        } else {
          setDragOffset(deltaY);
        }
      }
    },
    [snap]
  );

  const handleDragEnd = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      const deltaY = clientY - startYRef.current;
      const elapsed = Math.max(1, Date.now() - startTimeRef.current);
      const velocity = deltaY / elapsed;

      if (velocity > 0.55 || deltaY > 150) {
        triggerClose();
      } else if (snap === 'full' && (velocity > 0.3 || deltaY > 80)) {
        setSnap('partial');
        setDragOffset(0);
      } else if (snap === 'partial' && (velocity < -0.3 || deltaY < -80)) {
        setSnap('full');
        setDragOffset(0);
      } else {
        setDragOffset(0);
      }
    },
    [snap, triggerClose]
  );

  // Global window listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      handleDragMove(e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      handleDragEnd(e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientY);
      }
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

  // List scroll touch listener: allow drag-to-dismiss when pulling down at top of list
  const handleListTouchStart = (e: React.TouchEvent) => {
    listTouchStartYRef.current = e.touches[0].clientY;
  };

  const handleListTouchMove = (e: React.TouchEvent) => {
    if (!listRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - listTouchStartYRef.current;

    if (listRef.current.scrollTop <= 0 && deltaY > 5 && !isDraggingRef.current) {
      handleDragStart(currentY);
    }
  };

  // Filter and extract transactions
  const allItems = useMemo<ContributingItem[]>(() => {
    if (!isOpen) return [];

    const diffTime = Math.abs(periodEnd.getTime() - periodStart.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const matching = transactions.filter((tx) => {
      if (tx.type !== 'EXPENSE') return false;
      const txDate = new Date(tx.date);
      if (txDate < periodStart || txDate > periodEnd) return false;

      if (dayPoint) {
        const txDay = Math.min(
          totalDays,
          Math.max(1, Math.floor((txDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        );
        return txDay === dayPoint.day;
      }
      return true;
    });

    return matching.map((tx) => {
      const dateObj = new Date(tx.date);
      return {
        id: tx.id,
        transaction: tx,
        merchantName: tx.merchantName || 'Expense',
        categoryId: tx.categoryId,
        dateStr: tx.date,
        timestamp: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime(),
        amount: tx.amount,
        isSplit: !!(tx.isSplit && tx.splits && tx.splits.length > 0),
        note: tx.notes,
      };
    });
  }, [isOpen, transactions, periodStart, periodEnd, dayPoint]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.merchantName.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        getCategoryById(item.categoryId).name.toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    if (sortField === 'date') {
      sorted.sort((a, b) =>
        sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
      );
    } else {
      sorted.sort((a, b) =>
        sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount
      );
    }
    return sorted;
  }, [filteredItems, sortField, sortOrder]);

  if (!isOpen) return null;

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatItemDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSpentInView = allItems.reduce((acc, curr) => acc + curr.amount, 0);

  const targetHeight = snap === 'full' ? '90vh' : '58vh';

  const sheetStyle: React.CSSProperties = {
    height: targetHeight,
    maxHeight: '92vh',
    transform: isClosing
      ? 'translateY(100%)'
      : dragOffset !== 0
      ? `translateY(${dragOffset}px)`
      : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), height 260ms cubic-bezier(0.16, 1, 0.3, 1)',
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

      {/* 2. Draggable Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="velocity-drawer-title"
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
          title="Drag down to close, drag up to expand"
        >
          <div className="w-11 h-1.5 rounded-full bg-slate-400/50 dark:bg-slate-500/50 group-hover:bg-slate-500 dark:group-hover:bg-slate-400 group-active:scale-95 transition-all shadow-xs" />
        </div>

        {/* Top Header: Draggable Bar with Single ArrowLeft */}
        <div
          onPointerDown={(e) => {
            if (e.button === 0) handleDragStart(e.clientY);
          }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          className="flex items-center justify-between px-4 pb-3 border-b border-theme-border/40 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Back"
            className="flex size-10 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 px-2 pointer-events-none">
            <Calendar className="size-4 text-violet-500 shrink-0" />
            <h2
              id="velocity-drawer-title"
              className="text-base font-bold text-theme-primary truncate"
            >
              {dayPoint ? `Expenses on ${dayPoint.dateStr}` : 'Spending Velocity'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {dayPoint && (
              <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-theme-card-subtle text-theme-secondary border border-theme-border/60">
                {dayPoint.dateStr}
              </span>
            )}

            {/* Snap Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSnap((s) => (s === 'full' ? 'partial' : 'full'));
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label={snap === 'full' ? 'Collapse drawer' : 'Expand drawer'}
              className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-all active:scale-95"
            >
              {snap === 'full' ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          ref={listRef}
          onTouchStart={handleListTouchStart}
          onTouchMove={handleListTouchMove}
          className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4"
        >
          {/* Summary Hero Card */}
          <div className="rounded-2xl border border-theme-border/60 bg-theme-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                  {dayPoint ? `Spent on ${dayPoint.dateStr}` : 'Total Velocity Expense'}
                </p>
                <p className="text-2xl font-bold font-mono text-theme-primary mt-0.5">
                  {hideBalances ? '••••••' : formatCurrency(dayPoint ? dayPoint.daily : totalExpense || totalSpentInView, undefined, false)}
                </p>
              </div>

              {dayPoint && (
                <div className="text-right">
                  <p className="text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Cumulative Spent
                  </p>
                  <p className="text-lg font-bold font-mono text-violet-500 mt-0.5">
                    {hideBalances ? '••••••' : formatCurrency(dayPoint.cumulative, undefined, false)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-theme-border/40 flex items-center justify-between text-xs text-theme-secondary">
              <span>{allItems.length} {allItems.length === 1 ? 'transaction' : 'transactions'}</span>
              {totalBudget > 0 && (
                <span>
                  Budget: {hideBalances ? '••••••' : formatCurrency(totalBudget, undefined, false)}
                </span>
              )}
            </div>
          </div>

          {/* Search & Sort Controls */}
          {allItems.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-theme-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search merchant or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 rounded-xl border border-theme-border bg-theme-input pl-8 pr-7 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Sort: Date */}
              <button
                type="button"
                onClick={() => handleSortClick('date')}
                className={cn(
                  'flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold border transition-colors shrink-0',
                  sortField === 'date'
                    ? 'bg-violet-600/10 border-violet-500/40 text-violet-500'
                    : 'border-theme-border bg-theme-card-subtle text-theme-muted hover:text-theme-primary'
                )}
              >
                <span>Date</span>
                {sortField === 'date' ? (
                  sortOrder === 'desc' ? (
                    <ArrowDown className="size-3 shrink-0 stroke-[2.5]" />
                  ) : (
                    <ArrowUp className="size-3 shrink-0 stroke-[2.5]" />
                  )
                ) : null}
              </button>

              {/* Sort: Amount */}
              <button
                type="button"
                onClick={() => handleSortClick('amount')}
                className={cn(
                  'flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold border transition-colors shrink-0',
                  sortField === 'amount'
                    ? 'bg-violet-600/10 border-violet-500/40 text-violet-500'
                    : 'border-theme-border bg-theme-card-subtle text-theme-muted hover:text-theme-primary'
                )}
              >
                <span>Amount</span>
                {sortField === 'amount' ? (
                  sortOrder === 'desc' ? (
                    <ArrowDown className="size-3 shrink-0 stroke-[2.5]" />
                  ) : (
                    <ArrowUp className="size-3 shrink-0 stroke-[2.5]" />
                  )
                ) : null}
              </button>
            </div>
          )}

          {/* Transaction List */}
          {sortedItems.length > 0 ? (
            <div className="space-y-2">
              {sortedItems.map((item) => {
                const cat = getCategoryById(item.categoryId);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTransaction && onSelectTransaction(item.transaction)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTransaction && onSelectTransaction(item.transaction);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-theme-card border border-theme-border/60 hover:border-violet-500/30 hover:bg-theme-card-hover active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl text-white shrink-0 shadow-xs',
                          cat.bgClass
                        )}
                      >
                        <CategoryIcon name={cat.iconName} size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-theme-primary truncate">
                            {item.merchantName}
                          </span>
                          {item.isSplit && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400 font-mono">
                              <Split className="size-2.5" />
                              <span>Split</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-theme-muted font-mono mt-0.5">
                          {formatItemDate(item.dateStr)} • {cat.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold font-mono text-theme-primary">
                        {hideBalances ? '••••••' : `-${formatCurrency(item.amount, undefined, false)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-2xl border border-dashed border-theme-border/60 bg-theme-card-subtle/30 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-theme-primary">
                  {dayPoint ? `No spending on ${dayPoint.dateStr}` : 'No expenses logged'}
                </p>
                <p className="text-xs text-theme-muted mt-1">
                  {dayPoint ? '₹0 spent • No expenses logged for this day' : 'No activity found in this period'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-theme-muted">
              No transactions match "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </>
  );
};
