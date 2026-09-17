import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  isActive?: boolean;
  align?: 'left' | 'right' | 'auto';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ariaLabel?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  isActive = false,
  align = 'left',
  className,
  triggerClassName,
  menuClassName,
  isOpen: controlledIsOpen,
  onOpenChange,
  ariaLabel,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setUncontrolledIsOpen(newOpen);
    }
  };

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const gap = 6;
    const menuEstimatedWidth = 210;

    let computedAlign = align;
    if (computedAlign === 'auto') {
      computedAlign = rect.left + menuEstimatedWidth > viewportWidth - 12 ? 'right' : 'left';
    }

    if (computedAlign === 'right') {
      const right = Math.max(8, viewportWidth - rect.right);
      setCoords({
        top: rect.bottom + gap,
        right,
      });
    } else {
      const left = Math.max(8, Math.min(rect.left, viewportWidth - menuEstimatedWidth - 8));
      setCoords({
        top: rect.bottom + gap,
        left,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, align]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown popover itself
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', () => setOpen(false));
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', () => setOpen(false));
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel || label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setOpen(!isOpen)}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors shadow-sm',
          isActive
            ? 'border-violet-500/40 bg-violet-500/15 text-violet-600 dark:text-violet-300'
            : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover',
          triggerClassName
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'size-3.5 opacity-70 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              top: `${coords.top}px`,
              ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
              ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
            }}
            className={cn(
              'fixed z-50 min-w-[190px] max-w-[calc(100vw-32px)] rounded-2xl border border-theme-border bg-theme-elevated/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150',
              menuClassName
            )}
          >
            <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs font-medium text-theme-primary">
              {options.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-300'
                        : 'hover:bg-theme-card-hover text-theme-secondary active:bg-theme-card-subtle'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Check className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
