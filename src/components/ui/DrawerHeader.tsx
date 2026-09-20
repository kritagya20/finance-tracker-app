import React from 'react';
import { ArrowLeft, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerHeaderProps {
  title: string;
  onBack: () => void;
  titleId?: string;
  backLabel?: string;
  snap?: 'partial' | 'full';
  onSnapToggle?: () => void;
  rightElement?: React.ReactNode;
  onDragStart?: (clientY: number) => void;
  className?: string;
}

/**
 * Standardized DrawerHeader adhering strictly to DESIGN_SYSTEM.md:
 * - Single ArrowLeft back button (no conflicting 'X' icon)
 * - Clean uppercase tracking-wider title without decorative icons
 * - Snap toggle (ChevronsUpDown) and custom right actions
 */
export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title,
  onBack,
  titleId,
  backLabel = 'Back',
  snap,
  onSnapToggle,
  rightElement,
  onDragStart,
  className,
}) => {
  return (
    <div
      onPointerDown={(e) => {
        if (e.button === 0 && onDragStart) onDragStart(e.clientY);
      }}
      onTouchStart={(e) => {
        if (onDragStart && e.touches.length > 0) onDragStart(e.touches[0].clientY);
      }}
      className={cn(
        'flex items-center justify-between px-4 pb-3 border-b border-theme-border/40 shrink-0 select-none touch-none',
        onDragStart && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {/* 1. Single ArrowLeft Back Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label={backLabel}
        className="flex size-10 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
      >
        <ArrowLeft className="size-5" />
      </button>

      {/* 2. Clean Center Title (Cleanliness Invariant: No decorative icons) */}
      <div className="flex items-center pointer-events-none">
        <h2
          id={titleId}
          className="text-sm font-bold text-theme-primary uppercase tracking-wider"
        >
          {title}
        </h2>
      </div>

      {/* 3. Right Action Zone */}
      <div className="flex items-center gap-1">
        {rightElement}

        {onSnapToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSnapToggle();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={snap === 'full' ? 'Collapse drawer' : 'Expand drawer'}
            className="flex size-9 items-center justify-center rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            title={snap === 'full' ? 'Collapse to half screen' : 'Expand to full screen'}
          >
            <ChevronsUpDown className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
