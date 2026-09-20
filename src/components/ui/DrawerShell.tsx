import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

export type SnapState = 'partial' | 'full';

export interface DrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  defaultSnap?: SnapState;
  snap?: SnapState;
  onSnapChange?: (snap: SnapState) => void;
  snapHeights?: {
    partial?: string; // Default: '58vh'
    full?: string;    // Default: '90vh'
  };
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Standardized DrawerShell component implementing fintech bottom sheet gesture physics,
 * dual snap states (58vh / 90vh), backdrop blur, and accessibility standards.
 */
export const DrawerShell: React.FC<DrawerShellProps> = ({
  isOpen,
  onClose,
  titleId,
  defaultSnap = 'full',
  snap: propSnap,
  onSnapChange,
  snapHeights = { partial: '58vh', full: '90vh' },
  header,
  children,
  footer,
  className,
  contentClassName,
}) => {
  const [internalSnap, setInternalSnap] = useState<SnapState>(defaultSnap);
  const snap = propSnap !== undefined ? propSnap : internalSnap;

  const updateSnap = useCallback(
    (nextSnap: SnapState) => {
      if (propSnap === undefined) {
        setInternalSnap(nextSnap);
      }
      onSnapChange?.(nextSnap);
    },
    [propSnap, onSnapChange]
  );

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
      updateSnap(defaultSnap);
    }, 220);
  }, [onClose, defaultSnap, updateSnap]);

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

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      updateSnap(defaultSnap);
      setDragOffset(0);
      setIsClosing(false);
      isDraggingRef.current = false;
    }
  }, [isOpen, defaultSnap, updateSnap]);

  // Drag Gesture Physics
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
          // Elastic resistance when pulling up past full height
          setDragOffset(deltaY * 0.25);
        } else {
          setDragOffset(deltaY);
        }
      } else {
        setDragOffset(deltaY);
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
      const velocity = deltaY / elapsed; // px/ms

      if (snap === 'full') {
        if (velocity > 0.6 || deltaY > 200) {
          triggerClose();
        } else if (velocity > 0.25 || deltaY > 90) {
          updateSnap('partial');
          setDragOffset(0);
        } else {
          setDragOffset(0);
        }
      } else {
        if (velocity > 0.5 || deltaY > 90) {
          triggerClose();
        } else if (velocity < -0.25 || deltaY < -70) {
          updateSnap('full');
          setDragOffset(0);
        } else {
          setDragOffset(0);
        }
      }
    },
    [snap, triggerClose, updateSnap]
  );

  // Global window listeners for drag tracking
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

  if (!isOpen) return null;

  const targetHeight = snap === 'full' ? snapHeights.full || '90vh' : snapHeights.partial || '58vh';

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

      {/* 2. Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={sheetStyle}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[420px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-300',
          className
        )}
      >
        {/* Generous Draggable Pull Handle Zone */}
        <div
          onPointerDown={(e) => {
            if (e.button === 0) handleDragStart(e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0) handleDragStart(e.touches[0].clientY);
          }}
          className="w-full pt-3 pb-1.5 flex flex-col items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing group shrink-0"
          title="Drag down to close, drag up to expand"
        >
          <div className="w-11 h-1.5 rounded-full bg-slate-400/50 dark:bg-slate-500/50 group-hover:bg-slate-500 dark:group-hover:bg-slate-400 group-active:scale-95 transition-all shadow-xs" />
        </div>

        {/* Header Slot */}
        {header}

        {/* Scrollable Content Body */}
        <div
          className={cn(
            'flex-1 overflow-y-auto px-4 py-3 overscroll-contain focus:outline-none scrollbar-thin',
            contentClassName
          )}
        >
          {children}
        </div>

        {/* Sticky Bottom Action Bar / Footer */}
        {footer}
      </div>
    </>
  );
};
