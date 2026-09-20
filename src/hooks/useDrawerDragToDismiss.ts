import { useState, useRef, useCallback } from 'react';

interface UseDrawerDragToDismissOptions {
  onClose: () => void;
  dismissThreshold?: number; // pixels dragged down before triggering dismiss (default 75px)
  enabled?: boolean;
}

export function useDrawerDragToDismiss({
  onClose,
  dismissThreshold = 75,
  enabled = true,
}: UseDrawerDragToDismissOptions) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);

  // Touch Handlers for Mobile Devices
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startYRef.current = e.touches[0].clientY;
      setIsDragging(true);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || startYRef.current === null) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      } else {
        setDragOffset(0);
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || startYRef.current === null) return;
    setIsDragging(false);
    startYRef.current = null;

    if (dragOffset > dismissThreshold) {
      setDragOffset(450); // slide completely down
      setTimeout(() => {
        onClose();
        setDragOffset(0);
      }, 180);
    } else {
      setDragOffset(0);
    }
  }, [enabled, dragOffset, dismissThreshold, onClose]);

  // Pointer Handlers for Desktop & Mouse Testing
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      startYRef.current = e.clientY;
      setIsDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture unsupported
      }
    },
    [enabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || startYRef.current === null) return;
      const deltaY = e.clientY - startYRef.current;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      } else {
        setDragOffset(0);
      }
    },
    [enabled]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || startYRef.current === null) return;
      setIsDragging(false);
      startYRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      if (dragOffset > dismissThreshold) {
        setDragOffset(450);
        setTimeout(() => {
          onClose();
          setDragOffset(0);
        }, 180);
      } else {
        setDragOffset(0);
      }
    },
    [enabled, dragOffset, dismissThreshold, onClose]
  );

  return {
    dragOffset,
    isDragging,
    dragHandleProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    sheetStyle: {
      transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
      transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    },
    backdropStyle: {
      opacity: dragOffset > 0 ? Math.max(0.15, 1 - dragOffset / 300) : undefined,
    },
  };
}
