import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CardHeaderProps {
  title: string | React.ReactNode;
  titleSize?: string;
  subtitle?: string | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  noTruncate?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  titleSize = 'text-xs sm:text-sm font-semibold text-theme-primary',
  subtitle,
  icon: Icon,
  iconColor = 'text-violet-500',
  badge,
  action,
  className,
  noTruncate = false,
}) => {
  return (
    <div className={cn('flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 min-w-0', className)}>
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {Icon && <Icon className={cn('size-4 shrink-0', iconColor)} />}
        <div className="min-w-0">
          {typeof title === 'string' ? (
            <h3 className={cn(noTruncate ? 'whitespace-nowrap' : 'truncate', titleSize)}>
              {title}
            </h3>
          ) : (
            title
          )}
          {subtitle && (
            <p className="text-[11px] text-theme-muted font-normal truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {badge && (
          <span className="text-[10px] font-mono font-medium text-theme-muted bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/[0.08] whitespace-nowrap">
            {badge}
          </span>
        )}
        {action}
      </div>
    </div>
  );
};
