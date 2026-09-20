import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  badge?: string;
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
  badge,
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
        'relative flex flex-col items-center justify-center text-center select-none overflow-hidden transition-all',
        compact
          ? 'py-8 px-4 rounded-2xl border border-theme-border/60 bg-theme-card-subtle/50'
          : 'py-12 px-6 rounded-3xl border border-white/5 bg-[#14151a] shadow-xl',
        className
      )}
    >
      {/* Ambient background soft glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 size-40 rounded-full bg-violet-500/15 blur-3xl" />

      {/* Layered Icon Bubble */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-violet-400 shadow-inner mb-4 transition-transform duration-300 hover:scale-105',
          compact ? 'size-12 rounded-xl' : 'size-16 rounded-2xl'
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-transparent pointer-events-none" />
        <Icon className={cn(compact ? 'size-6 text-violet-400' : 'size-8 text-violet-400')} />
      </div>

      {/* Optional Metadata Badge */}
      {badge && (
        <span className="mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium font-sans bg-violet-500/15 text-violet-300 border border-violet-500/30">
          {badge}
        </span>
      )}

      {/* Heading */}
      <h3
        className={cn(
          'font-bold tracking-tight text-white font-sans',
          compact ? 'text-sm' : 'text-base sm:text-lg'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'mt-1.5 max-w-[280px] text-slate-400 leading-relaxed font-sans',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {description}
        </p>
      )}

      {/* Action Buttons (Strictly conforming to 48px CTA Button Standards in DESIGN_SYSTEM.md) */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-[280px]">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="flex h-12 w-full items-center justify-center px-5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-600 shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex h-12 w-full items-center justify-center px-5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:scale-[0.97] transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
