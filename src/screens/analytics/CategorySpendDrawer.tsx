import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Check,
  TrendingUp,
  Split,
  Calendar,
  Search,
  X,
  Receipt,
  ChevronsUpDown,
} from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

export interface CategorySpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | string[];
  categoryName: string;
  categoryColor?: string;
  totalSpent: number;
  budgetLimit?: number;
  periodLabel?: string;
  transactions: Transaction[];
  hideBalances: boolean;
}

interface ContributingItem {
  id: string;
  transactionId: string;
  merchantName: string;
  dateStr: string;
  timestamp: number;
  amount: number;
  originalAmount: number;
  isSplit: boolean;
  note?: string;
}

type SortField = 'date' | 'amount';
type SortOrder = 'desc' | 'asc';
type SnapState = 'partial' | 'full';

export const CategorySpendDrawer: React.FC<CategorySpendDrawerProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryColor = '#8b5cf6',
  totalSpent,
  budgetLimit,
  periodLabel,
  transactions,
  hideBalances,
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

  // Reset filters & states when opened with a new category
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
  }, [isOpen, categoryName]);

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
          // Rubber-band resistance when dragging up past full
          setDragOffset(deltaY * 0.25);
        } else {
          setDragOffset(deltaY);
        }
      } else {
        // Partial snap
        if (deltaY < 0) {
          // Dragging upward to expand towards full
          setDragOffset(deltaY);
        } else {
          // Dragging down towards dismiss
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
      const velocity = deltaY / elapsed; // px per ms

      if (snap === 'full') {
        if (velocity > 0.6 || deltaY > 200) {
          triggerClose();
        } else if (velocity > 0.25 || deltaY > 90) {
          setSnap('partial');
          setDragOffset(0);
        } else {
          setDragOffset(0);
        }
      } else {
        // At partial snap
        if (velocity > 0.5 || deltaY > 90) {
          triggerClose();
        } else if (velocity < -0.25 || deltaY < -70) {
          setSnap('full');
          setDragOffset(0);
        } else {
          setDragOffset(0);
        }
      }
    },
    [snap, triggerClose]
  );

  // Global window listeners for drag tracking
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

  // Normalize target category IDs (handles string or string[] for 'Other')
  const targetCategoryIds = useMemo(() => {
    return Array.isArray(categoryId) ? categoryId : [categoryId];
  }, [categoryId]);

  // Extract all contributing transactions & split items
  const allItems = useMemo<ContributingItem[]>(() => {
    if (!isOpen) return [];
    const list: ContributingItem[] = [];

    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;

      if (t.isSplit && t.splits && t.splits.length > 0) {
        for (const s of t.splits) {
          if (targetCategoryIds.includes(s.categoryId)) {
            const dateObj = new Date(t.date);
            list.push({
              id: `${t.id}-split-${s.id}`,
              transactionId: t.id,
              merchantName: t.merchantName || 'Unnamed Expense',
              dateStr: t.date,
              timestamp: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime(),
              amount: s.amount,
              originalAmount: t.amount,
              isSplit: true,
              note: s.note || t.notes,
            });
          }
        }
      } else if (targetCategoryIds.includes(t.categoryId)) {
        const dateObj = new Date(t.date);
        list.push({
          id: t.id,
          transactionId: t.id,
          merchantName: t.merchantName || 'Unnamed Expense',
          dateStr: t.date,
          timestamp: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime(),
          amount: t.amount,
          originalAmount: t.amount,
          isSplit: false,
          note: t.notes,
        });
      }
    }

    return list;
  }, [isOpen, transactions, targetCategoryIds]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.merchantName.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
    );
  }, [allItems, searchQuery]);

  // Sort filtered items
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

  // Handle sort button click: toggles order if already active, or switches field
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
    const currentYear = new Date().getFullYear();
    const itemYear = d.getFullYear();
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: itemYear !== currentYear ? 'numeric' : undefined,
    });
  };

  const isOverBudget = budgetLimit !== undefined && totalSpent > budgetLimit;
  const isNearLimit =
    budgetLimit !== undefined && !isOverBudget && totalSpent >= budgetLimit * 0.75;
  const percentUsed = budgetLimit ? Math.round((totalSpent / budgetLimit) * 100) : null;
  const overAmount = budgetLimit ? Math.max(0, totalSpent - budgetLimit) : 0;
  const remainingAmount = budgetLimit ? Math.max(0, budgetLimit - totalSpent) : 0;

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
        aria-labelledby="category-drawer-title"
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

        {/* Top Header: Draggable Bar with Single ArrowLeft (Fintech Navigation Invariant) */}
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
            <span
              className="size-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: categoryColor }}
            />
            <h2
              id="category-drawer-title"
              className="text-base font-bold text-theme-primary truncate"
            >
              {categoryName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {periodLabel && (
              <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-theme-card-subtle text-theme-secondary border border-theme-border/60">
                {periodLabel}
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
              className="flex size-8 items-center justify-center rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              title={snap === 'full' ? 'Collapse to half screen' : 'Expand to full screen'}
            >
              <ChevronsUpDown className="size-4" />
            </button>
          </div>
        </div>

        {/* Hero Category Metric & Budget Progress (Also Draggable) */}
        <div
          onPointerDown={(e) => {
            if (e.button === 0) handleDragStart(e.clientY);
          }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          className="px-5 pt-4 pb-3 bg-theme-card/50 border-b border-theme-border/40 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-theme-muted uppercase tracking-wider block mb-1">
                Total Outflow
              </span>
              <span className="text-3xl font-bold font-mono tracking-tight text-theme-primary">
                {hideBalances ? '••••••' : formatCurrency(totalSpent, undefined, false)}
              </span>
            </div>

            {/* Budget status badge */}
            {budgetLimit !== undefined && (
              <div className="text-right">
                {isOverBudget ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/25">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>
                      <span className="font-mono">{formatCurrency(overAmount, undefined, false)}</span> over
                    </span>
                  </span>
                ) : isNearLimit ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <TrendingUp className="size-3 shrink-0" />
                    <span>Near limit</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <Check className="size-3 shrink-0" />
                    <span>
                      <span className="font-mono">{formatCurrency(remainingAmount, undefined, false)}</span> left
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Budget Limit Progress Bar */}
          {budgetLimit !== undefined && percentUsed !== null && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-theme-secondary">
                <span>
                  <span className="font-mono font-medium text-theme-primary">
                    {hideBalances ? '••••••' : formatCurrency(totalSpent, undefined, false)}
                  </span>{' '}
                  of <span className="font-mono">{formatCurrency(budgetLimit, undefined, false)}</span> limit
                </span>
                <span
                  className={cn(
                    'font-mono font-bold',
                    isOverBudget
                      ? 'text-rose-400'
                      : isNearLimit
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  )}
                >
                  {percentUsed}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 ease-out',
                    isOverBudget
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : isNearLimit
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                      : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                  )}
                  style={{ width: `${Math.min(100, Math.max(3, percentUsed))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search input + Multi-axis Sort Controls */}
        <div className="px-4 py-2.5 border-b border-theme-border/40 bg-theme-card-subtle/40 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between shrink-0">
          {/* Quick Search Field for Long Datasets */}
          {allItems.length > 5 && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-theme-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-theme-input border border-theme-border text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {/* Transaction Counter & Sort Toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-theme-secondary font-medium mr-auto sm:mr-1">
              <Receipt className="size-3.5 text-theme-muted" />
              <span>
                {filteredItems.length}{' '}
                {filteredItems.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>

            {/* Date Sort Pill */}
            <button
              type="button"
              onClick={() => handleSortClick('date')}
              title={`Sort by Date (${sortField === 'date' && sortOrder === 'asc' ? 'Oldest first' : 'Newest first'})`}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border',
                sortField === 'date'
                  ? 'bg-violet-600/15 text-violet-600 dark:text-violet-300 border-violet-500/30 dark:bg-violet-500/20 font-semibold shadow-xs'
                  : 'bg-theme-card text-theme-secondary border-theme-border hover:text-theme-primary'
              )}
            >
              <Calendar className="size-3 shrink-0" />
              <span>Date</span>
              {sortField === 'date' ? (
                sortOrder === 'desc' ? (
                  <ArrowDown className="size-3 shrink-0 stroke-[2.5]" />
                ) : (
                  <ArrowUp className="size-3 shrink-0 stroke-[2.5]" />
                )
              ) : null}
            </button>

            {/* Amount Sort Pill */}
            <button
              type="button"
              onClick={() => handleSortClick('amount')}
              title={`Sort by Amount (${sortField === 'amount' && sortOrder === 'asc' ? 'Lowest first' : 'Highest first'})`}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border',
                sortField === 'amount'
                  ? 'bg-violet-600/15 text-violet-600 dark:text-violet-300 border-violet-500/30 dark:bg-violet-500/20 font-semibold shadow-xs'
                  : 'bg-theme-card text-theme-secondary border-theme-border hover:text-theme-primary'
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
        </div>

        {/* Scrollable Transaction List: Handles 10 to 500+ records smoothly */}
        <div
          ref={listRef}
          onTouchStart={handleListTouchStart}
          onTouchMove={handleListTouchMove}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain focus:outline-none scrollbar-thin"
        >
          {sortedItems.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="size-10 text-theme-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-theme-primary">No transactions found</p>
              <p className="text-xs text-theme-muted mt-0.5">
                {searchQuery
                  ? `No matches for "${searchQuery}"`
                  : 'No expenses recorded for this category in the selected timeframe.'}
              </p>
            </div>
          ) : (
            sortedItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-theme-card hover:bg-theme-card-hover border border-theme-border/70 hover:border-theme-border transition-all"
              >
                {/* Left Column: Merchant + Split Tag + Note + Date */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-theme-primary truncate">
                      {item.merchantName}
                    </span>

                    {item.isSplit && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 shrink-0">
                        <Split className="size-2.5 shrink-0" />
                        SPLIT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-theme-secondary">
                    <span className="font-mono">{formatItemDate(item.dateStr)}</span>
                    {item.note && (
                      <>
                        <span className="text-theme-border">•</span>
                        <span className="truncate max-w-[180px] sm:max-w-[240px] text-theme-muted">
                          {item.note}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Amount + Subtotal for Split */}
                <div className="text-right shrink-0">
                  <span className="block text-sm sm:text-base font-mono font-bold text-theme-primary">
                    {hideBalances ? '••••••' : formatCurrency(item.amount, undefined, false)}
                  </span>
                  {item.isSplit && (
                    <span className="block text-[11px] font-mono text-theme-muted">
                      of {hideBalances ? '••••••' : formatCurrency(item.originalAmount, undefined, false)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
