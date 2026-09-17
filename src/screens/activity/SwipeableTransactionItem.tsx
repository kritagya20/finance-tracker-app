import React, { useState, useRef } from 'react';
import { Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { Transaction, Category } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface SwipeableTransactionItemProps {
  tx: Transaction;
  category: Category;
  iconComp: LucideIcon;
  hideBalances: boolean;
  onDelete: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

export const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({
  tx,
  category,
  iconComp: IconComp,
  hideBalances,
  onDelete,
  onEdit,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialOffsetRef = useRef(0);
  const isHorizontalDragRef = useRef<boolean | null>(null);

  const isIncome = tx.type === 'INCOME';

  const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button / touch
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
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    // Detect gesture direction on first few pixels
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

    // Prevent default touch scrolling when dragging horizontally
    e.preventDefault();

    // Calculate raw offset with bounds (-84px to +84px)
    let nextOffset = initialOffsetRef.current + deltaX;
    if (nextOffset > 76) {
      nextOffset = 76 + (nextOffset - 76) * 0.3; // rubber banding
    } else if (nextOffset < -76) {
      nextOffset = -76 + (nextOffset + 76) * 0.3;
    }
    setOffsetX(Math.max(-84, Math.min(84, nextOffset)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const deltaX = e.clientX - startXRef.current;

    // If it was just a click/tap without dragging and card was open, close it
    if (Math.abs(deltaX) < 5 && Math.abs(initialOffsetRef.current) > 10) {
      setOffsetX(0);
      return;
    }

    // Determine snap target
    if (offsetX > 35) {
      setOffsetX(76); // snap open to reveal Edit
    } else if (offsetX < -35) {
      setOffsetX(-76); // snap open to reveal Delete
    } else {
      setOffsetX(0); // snap closed
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffsetX(0);
    if (onEdit) onEdit(tx);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffsetX(0);
    onDelete(tx.id);
  };

  return (
    <li className="relative overflow-hidden rounded-2xl select-none">
      {/* 1. Edit Action Background (Left - Revealed on swipe right) */}
      <div className="absolute inset-y-0 left-0 flex w-[76px] items-center justify-center bg-blue-500/20">
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
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-rose-500/20">
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
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'relative flex touch-pan-y items-center gap-3 border border-white/10 bg-zinc-900 p-3',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          offsetX !== 0 ? 'shadow-lg' : ''
        )}
      >
        {/* Category Circle Icon */}
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full pointer-events-none',
            category.bgClass,
            category.textClass
          )}
        >
          <IconComp className="size-5" />
        </span>

        {/* Merchant & Metadata */}
        <div className="min-w-0 flex-1 pointer-events-none">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {tx.merchantName}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="truncate text-[11px] text-zinc-500">
              {category.name}
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                tx.source === 'AUTO_SMS'
                  ? 'bg-violet-500/15 text-violet-300'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              {tx.source === 'AUTO_SMS' ? 'Auto-SMS' : 'Manual'}
            </span>
            {tx.notes && tx.notes.includes('items') && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                2 items
              </span>
            )}
          </div>
        </div>

        {/* Amount & Time */}
        <div className="shrink-0 text-right pointer-events-none">
          <p
            className={cn(
              'text-sm font-semibold tabular-nums',
              isIncome ? 'text-emerald-400' : 'text-zinc-200'
            )}
          >
            {hideBalances
              ? '••••••'
              : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{timeStr}</p>
        </div>
      </div>
    </li>
  );
};
