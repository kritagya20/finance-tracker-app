import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  hoverable?: boolean;
  activeScale?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  role?: string;
}

export const CardShell = forwardRef<HTMLDivElement, CardShellProps>(
  (
    {
      children,
      className,
      padding = 'p-4 sm:p-5',
      hoverable = false,
      activeScale = false,
      onClick,
      onKeyDown,
      tabIndex,
      role,
      ...rest
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick || hoverable);

    return (
      <div
        ref={ref}
        role={role || (onClick ? 'button' : undefined)}
        tabIndex={tabIndex !== undefined ? tabIndex : onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={cn(
          'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] shadow-sm select-none transition-all duration-200',
          padding,
          isInteractive && 'cursor-pointer hover:border-slate-300 dark:hover:border-white/15',
          activeScale && 'active:scale-[0.995]',
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

CardShell.displayName = 'CardShell';
