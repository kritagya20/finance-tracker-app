import React, { useState, useRef } from 'react';
import {
  Pencil,
  Trash2,
  Coffee,
  Car,
  Box,
  Receipt,
  Film,
  ShoppingBag,
  Briefcase,
  DollarSign,
  CircleDollarSign,
  Split,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { Transaction, Category } from '../../domain/models/types';
import { getCategoryById } from '../../domain/engine/categories';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

// Icon Map providing rich visual icons for transaction categories
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed: Coffee,
  ShoppingCart: Box,
  Fuel: Car,
  Receipt: Receipt,
  Film: Film,
  ShoppingBag: ShoppingBag,
  Briefcase: Briefcase,
  DollarSign: DollarSign,
  CircleDollarSign: CircleDollarSign,
};

// Subtle glowing border accents per category
const CATEGORY_BORDER_MAP: Record<string, string> = {
  cat_dining: 'border-amber-500/30',
  cat_groceries: 'border-emerald-500/30',
  cat_fuel: 'border-sky-500/30',
  cat_bills: 'border-violet-500/30',
  cat_entertainment: 'border-pink-500/30',
  cat_shopping: 'border-orange-500/30',
  cat_salary: 'border-emerald-500/30',
};

export interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  hideBalances?: boolean;
  variant?: 'activity' | 'home' | 'compact';
  showSwipe?: boolean;
  showCategory?: boolean;
  showSourceBadge?: boolean;
  showTimeOrDate?: 'time' | 'date' | 'both' | 'auto';
  iconShape?: 'rounded' | 'circle';
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
  onClick?: (tx: Transaction) => void;
  className?: string;
}

/**
 * Format timestamp conditionally based on mode and screen variant
 */
function formatTimestamp(
  dateStr: string,
  mode: 'time' | 'date' | 'both' | 'auto',
  variant: 'activity' | 'home' | 'compact'
): string {
  const d = new Date(dateStr);
  const now = new Date();
  const effectiveMode =
    mode === 'auto' ? (variant === 'activity' ? 'time' : 'date') : mode;

  if (effectiveMode === 'time') {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (effectiveMode === 'date') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - txDay.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction: tx,
  category: propCategory,
  hideBalances = false,
  variant = 'activity',
  showSwipe: propShowSwipe,
  showCategory = true,
  showSourceBadge = true,
  showTimeOrDate = 'auto',
  iconShape = 'rounded',
  onDelete,
  onEdit,
  onClick,
  className,
}) => {
  const category = propCategory || getCategoryById(tx.categoryId);
  const isIncome = tx.type === 'INCOME';
  const shouldSwipe = propShowSwipe !== undefined ? propShowSwipe : variant === 'activity';

  // Swipe Gesture State
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialOffsetRef = useRef(0);
  const isHorizontalDragRef = useRef<boolean | null>(null);

  const IconComp = CATEGORY_ICON_MAP[category.iconName] || CircleDollarSign;
  const iconBorderClass = CATEGORY_BORDER_MAP[category.id] || 'border-theme-border';
  const timestampStr = formatTimestamp(tx.date, showTimeOrDate, variant);

  // Drag Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldSwipe) return;
    if (e.button !== 0) return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    initialOffsetRef.current = offsetX;
    isHorizontalDragRef.current = null;
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldSwipe || !isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (isHorizontalDragRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalDragRef.current = true;
        } else {
          isHorizontalDragRef.current = false;
          setIsDragging(false);
          return;
        }
      } else {
        return;
      }
    }

    if (!isHorizontalDragRef.current) return;
    e.preventDefault();

    let nextOffset = initialOffsetRef.current + deltaX;
    if (nextOffset > 76) {
      nextOffset = 76 + (nextOffset - 76) * 0.3;
    } else if (nextOffset < -76) {
      nextOffset = -76 + (nextOffset + 76) * 0.3;
    }
    setOffsetX(Math.max(-84, Math.min(84, nextOffset)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldSwipe || !isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Snap to open or close
    if (offsetX > 42) {
      setOffsetX(76);
    } else if (offsetX < -42) {
      setOffsetX(-76);
    } else {
      setOffsetX(0);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffsetX(0);
    onEdit?.(tx);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffsetX(0);
    onDelete?.(tx.id);
  };

  const handleCardClick = () => {
    if (offsetX !== 0) {
      setOffsetX(0);
      return;
    }
    onClick?.(tx);
  };

  const cardContent = (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        ...(shouldSwipe
          ? {
              transform: `translateX(${offsetX}px)`,
              transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }
          : undefined),
      }}
      onPointerDown={shouldSwipe ? handlePointerDown : undefined}
      onPointerMove={shouldSwipe ? handlePointerMove : undefined}
      onPointerUp={shouldSwipe ? handlePointerUp : undefined}
      onPointerCancel={shouldSwipe ? handlePointerUp : undefined}
      onClick={handleCardClick}
      className={cn(
        'relative z-10 flex flex-col w-full p-3.5 transition-colors',
        shouldSwipe
          ? 'bg-theme-card'
          : 'rounded-xl border border-theme-border bg-theme-card shadow-sm',
        shouldSwipe && isDragging ? 'cursor-grabbing' : shouldSwipe ? 'cursor-grab touch-pan-y' : '',
        onClick && !shouldSwipe ? 'cursor-pointer hover:bg-theme-card-hover/40 active:bg-theme-card-hover transition-colors duration-150' : '',
        offsetX !== 0 ? 'shadow-2xl shadow-black/20 dark:shadow-black/70' : '',
        className
      )}
    >
      {/* Primary Row */}
      <div className="flex w-full items-center gap-3">
        {/* Category Icon Container */}
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center border transition-transform pointer-events-none',
            iconShape === 'circle' ? 'rounded-full' : 'rounded-xl',
            category.bgClass,
            category.textClass,
            iconBorderClass
          )}
        >
          <IconComp className="size-5" />
        </span>

        {/* Title & Metadata (min-w-0 flex-1 guarantees title will wrap or truncate cleanly) */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-tight text-theme-primary">
            {tx.merchantName}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            {showCategory && (
              <span className="truncate text-[11px] font-normal text-theme-secondary">
                {category.name}
              </span>
            )}

            {showCategory && showSourceBadge && (
              <span className="size-1 shrink-0 rounded-full bg-theme-muted" />
            )}

            {showSourceBadge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase',
                  tx.source === 'AUTO_SMS'
                    ? 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25'
                    : 'bg-theme-card-subtle text-theme-secondary border border-theme-border'
                )}
              >
                {tx.source === 'AUTO_SMS' ? 'SMS' : 'MANUAL'}
              </span>
            )}

            {/* Split Accordion Toggle Pill */}
            {tx.isSplit && tx.splits && tx.splits.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAccordionOpen((prev) => !prev);
                }}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-300 border border-violet-500/25 px-2 py-0.5 text-[9px] font-semibold active:scale-95 transition-all"
                aria-label="Toggle split breakdown"
              >
                <Split className="size-2.5" />
                <span>Split ({tx.splits.length})</span>
                <ChevronDown
                  className={cn(
                    'size-2.5 transition-transform duration-200',
                    isAccordionOpen && 'rotate-180'
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* Amount Display (Rigid shrink-0 min-w-fit so large amounts like +₹2,61,100.00 never break) */}
        <div className="shrink-0 text-right min-w-fit pl-2.5 pointer-events-none">
          <p
            className={cn(
              'text-[15px] font-semibold font-mono tracking-tight tabular-nums',
              isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-theme-primary'
            )}
          >
            {hideBalances
              ? '••••••'
              : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
          </p>
          <p className="mt-0.5 text-[11px] font-medium font-mono text-theme-muted tabular-nums">
            {timestampStr}
          </p>
        </div>
      </div>

      {/* Accordion Content for Split Categories */}
      {isAccordionOpen && tx.isSplit && tx.splits && tx.splits.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 w-full pt-2.5 border-t border-theme-border/60 flex flex-col gap-1.5 animate-in fade-in duration-200 pointer-events-auto"
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-theme-muted px-1">
            <span>Category Breakdown</span>
            <span>Allocated</span>
          </div>
          {tx.splits.map((s, idx) => {
            const cat = getCategoryById(s.categoryId);
            const CatIcon =
              cat?.iconName && CATEGORY_ICON_MAP[cat.iconName]
                ? CATEGORY_ICON_MAP[cat.iconName]
                : CircleDollarSign;
            return (
              <div
                key={s.id || idx}
                className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-theme-card-subtle/80 border border-theme-border/50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md text-[10px]',
                      cat?.bgClass || 'bg-violet-500/20',
                      cat?.textClass || 'text-violet-400'
                    )}
                  >
                    <CatIcon className="size-3" />
                  </span>
                  <span className="truncate text-[11px] font-medium text-theme-secondary">
                    {cat?.name || 'Category'}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-theme-primary tabular-nums shrink-0 pl-2">
                  {formatCurrency(s.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // If swipe is disabled, render direct list item without background reveal action buttons
  if (!shouldSwipe) {
    return <li className="select-none">{cardContent}</li>;
  }

  // Swipeable container with unified master border and flush reveal actions
  return (
    <li className="relative overflow-hidden rounded-xl border border-theme-border bg-theme-card select-none shadow-sm">
      {/* 1. Edit Action Background (Left - Revealed on swipe right) */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex w-[76px] items-center justify-center bg-blue-500/15 transition-opacity duration-150',
          offsetX > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={handleEditClick}
          aria-label={`Edit ${tx.merchantName}`}
          className="flex flex-col items-center justify-center gap-1 size-12 rounded-xl text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100 active:scale-90 transition-transform"
        >
          <Pencil className="size-4" />
          <span className="text-[10px] font-semibold">Edit</span>
        </button>
      </div>

      {/* 2. Delete Action Background (Right - Revealed on swipe left) */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-rose-500/15 transition-opacity duration-150',
          offsetX < 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={`Delete ${tx.merchantName}`}
          className="flex flex-col items-center justify-center gap-1 size-12 rounded-xl text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-100 active:scale-90 transition-transform"
        >
          <Trash2 className="size-4" />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* 3. Sliding Foreground Card */}
      {cardContent}
    </li>
  );
};
