import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: (isDark: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Dual-icon theme toggle with Sun on the left and Moon on the right.
 * The sliding thumb smoothly transitions between them, prominently
 * displaying the active theme with clear visual contrast and color accents.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggle,
  disabled = false,
  className,
  ariaLabel = 'Switch between Light and Dark theme',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!isDark);
      }}
      className={cn(
        'group relative inline-flex h-8 w-[66px] shrink-0 cursor-pointer items-center rounded-full border border-theme-border/80 bg-slate-200/90 dark:bg-slate-800/90 p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-app disabled:cursor-not-allowed disabled:opacity-[0.38] disabled:pointer-events-none active:scale-[0.96]',
        className
      )}
    >
      {/* Background Track Icons on Either Side */}
      <div className="flex w-full items-center justify-between px-1.5 pointer-events-none select-none">
        {/* Sun on Left */}
        <Sun
          className={cn(
            'size-3.5 transition-colors duration-200',
            !isDark ? 'text-amber-500 opacity-0' : 'text-slate-400 dark:text-slate-500 opacity-80'
          )}
        />
        {/* Moon on Right */}
        <Moon
          className={cn(
            'size-3.5 transition-colors duration-200',
            isDark ? 'text-violet-400 opacity-0' : 'text-slate-500 dark:text-slate-400 opacity-80'
          )}
        />
      </div>

      {/* Sliding Active Indicator Thumb */}
      <span
        className={cn(
          'pointer-events-none absolute top-[3px] flex size-6 items-center justify-center rounded-full shadow-md transition-all duration-200 ease-out',
          isDark
            ? 'translate-x-[34px] bg-violet-600 text-white shadow-violet-900/40 ring-1 ring-violet-400/30'
            : 'translate-x-0 bg-amber-500 text-white shadow-amber-500/30 ring-1 ring-amber-300/40'
        )}
      >
        {isDark ? (
          <Moon className="size-3.5 stroke-[2.2] animate-in zoom-in-75 duration-150" />
        ) : (
          <Sun className="size-3.5 stroke-[2.2] animate-in zoom-in-75 duration-150" />
        )}
      </span>
    </button>
  );
};
