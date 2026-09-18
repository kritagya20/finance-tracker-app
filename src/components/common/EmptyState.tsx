import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center text-center select-none overflow-hidden',
        compact
          ? 'py-8 px-4 rounded-2xl border border-theme-border/60 bg-theme-card-subtle/50'
          : 'py-14 px-6 rounded-3xl border border-theme-border bg-theme-card shadow-xs',
        className
      )}
    >
      {/* Ambient background soft glow */}
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 size-36 rounded-full bg-violet-500/10 blur-2xl dark:bg-violet-500/15" />

      {/* Layered Icon Bubble */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-theme-border/80 bg-theme-card text-theme-muted shadow-sm mb-3.5 transition-transform',
          compact ? 'size-12 rounded-xl' : 'size-16 rounded-2xl'
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
        <Icon className={cn(compact ? 'size-6 text-violet-400' : 'size-8 text-violet-500 dark:text-violet-400')} />
      </div>

      {/* Heading */}
      <h3
        className={cn(
          'font-bold tracking-tight text-theme-primary',
          compact ? 'text-sm' : 'text-base'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'mt-1 max-w-[260px] text-theme-secondary leading-relaxed',
            compact ? 'text-[11px]' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="flex h-11 items-center justify-center px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 shadow-md shadow-violet-900/20 active:scale-[0.97] transition-all"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex h-11 items-center justify-center px-4 rounded-xl text-xs font-semibold text-theme-secondary hover:text-theme-primary bg-theme-card-subtle border border-theme-border hover:bg-theme-card active:scale-[0.97] transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
