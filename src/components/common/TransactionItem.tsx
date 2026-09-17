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
  showNotesTag?: boolean;
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
  showNotesTag = true,
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

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialOffsetRef = useRef(0);
  const isHorizontalDragRef = useRef<boolean | null>(null);

  const IconComp = CATEGORY_ICON_MAP[category.iconName] || CircleDollarSign;
  const iconBorderClass = CATEGORY_BORDER_MAP[category.id] || 'border-white/10';
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
      style={
        shouldSwipe
          ? {
              transform: `translateX(${offsetX}px)`,
              transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }
          : undefined
      }
      onPointerDown={shouldSwipe ? handlePointerDown : undefined}
      onPointerMove={shouldSwipe ? handlePointerMove : undefined}
      onPointerUp={shouldSwipe ? handlePointerUp : undefined}
      onPointerCancel={shouldSwipe ? handlePointerUp : undefined}
      onClick={handleCardClick}
      className={cn(
        'relative flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-zinc-900/85 p-3.5 shadow-sm backdrop-blur-sm transition-colors',
        shouldSwipe && isDragging ? 'cursor-grabbing' : shouldSwipe ? 'cursor-grab touch-pan-y' : '',
        onClick && !shouldSwipe ? 'cursor-pointer hover:bg-zinc-850 active:bg-zinc-800' : '',
        offsetX !== 0 ? 'shadow-xl shadow-black/50' : '',
        className
      )}
    >
      {/* Category Icon Container */}
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center border transition-transform pointer-events-none',
          iconShape === 'circle' ? 'rounded-full' : 'rounded-2xl',
          category.bgClass,
          category.textClass,
          iconBorderClass
        )}
      >
        <IconComp className="size-5" />
      </span>

      {/* Title & Metadata */}
      <div className="min-w-0 flex-1 pointer-events-none">
        <p className="truncate text-sm font-semibold tracking-tight text-zinc-100">
          {tx.merchantName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {showCategory && (
            <span className="truncate text-[11px] font-normal text-zinc-400">
              {category.name}
            </span>
          )}

          {showCategory && (showSourceBadge || (showNotesTag && tx.notes?.includes('items'))) && (
            <span className="size-1 shrink-0 rounded-full bg-zinc-600" />
          )}

          {showSourceBadge && (
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide',
                tx.source === 'AUTO_SMS'
                  ? 'border border-violet-500/25 bg-violet-500/15 text-violet-300'
                  : 'border border-white/5 bg-zinc-800 text-zinc-400'
              )}
            >
              {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
            </span>
          )}

          {showNotesTag && tx.notes && tx.notes.includes('items') && (
            <>
              <span className="size-1 shrink-0 rounded-full bg-zinc-600" />
              <span className="inline-flex items-center rounded-md border border-amber-500/25 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                2 items
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount & Timestamp */}
      <div className="shrink-0 text-right pointer-events-none">
        <p
          className={cn(
            'text-[15px] font-bold tracking-tight tabular-nums',
            isIncome ? 'text-emerald-400' : 'text-zinc-100'
          )}
        >
          {hideBalances
            ? '••••••'
            : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-zinc-500 tabular-nums">
          {timestampStr}
        </p>
      </div>
    </div>
  );

  // If swipe is disabled, render direct list item without background reveal action buttons
  if (!shouldSwipe) {
    return <li className="select-none">{cardContent}</li>;
  }

  // Swipeable container with reveal actions
  return (
    <li className="relative overflow-hidden rounded-2xl select-none">
      {/* 1. Edit Action Background (Left - Revealed on swipe right) */}
      <div className="absolute inset-y-0 left-0 flex w-[76px] items-center justify-center bg-blue-600/25 border-r border-blue-500/30">
        <button
          type="button"
          onClick={handleEditClick}
          aria-label={`Edit ${tx.merchantName}`}
          className="flex flex-col items-center gap-1 text-blue-300 hover:text-blue-200 active:scale-95 transition-transform"
        >
          <Pencil className="size-5" />
          <span className="text-[10px] font-medium">Edit</span>
        </button>
      </div>

      {/* 2. Delete Action Background (Right - Revealed on swipe left) */}
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-rose-600/25 border-l border-rose-500/30">
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={`Delete ${tx.merchantName}`}
          className="flex flex-col items-center gap-1 text-rose-300 hover:text-rose-200 active:scale-95 transition-transform"
        >
          <Trash2 className="size-5" />
          <span className="text-[10px] font-medium">Delete</span>
        </button>
      </div>

      {/* 3. Sliding Foreground Card */}
      {cardContent}
    </li>
  );
};
