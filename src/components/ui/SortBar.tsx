import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SortOption<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

export interface SortBarProps<T extends string> {
  options: SortOption<T>[];
  activeField: T;
  activeOrder: 'asc' | 'desc';
  onSortChange: (field: T, order: 'asc' | 'desc') => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Standardized SortBar component enforcing design system arrow invariants:
 * - Ascending: strictly single top arrow (ArrowUp)
 * - Descending: strictly single bottom arrow (ArrowDown)
 * - Never dual conflicting arrows (ArrowUpDown is strictly prohibited)
 */
export function SortBar<T extends string>({
  options,
  activeField,
  activeOrder,
  onSortChange,
  className,
  size = 'md',
}: SortBarProps<T>) {
  const handleClick = (field: T) => {
    if (activeField === field) {
      onSortChange(field, activeOrder === 'desc' ? 'asc' : 'desc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {options.map((option) => {
        const isActive = activeField === option.key;
        const Icon = option.icon;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => handleClick(option.key)}
            title={`Sort by ${option.label} (${
              isActive
                ? activeOrder === 'asc'
                  ? 'Ascending • click for Descending'
                  : 'Descending • click for Ascending'
                : 'Click to sort'
            })`}
            className={cn(
              'flex items-center gap-1 transition-all duration-150 border shrink-0 active:scale-[0.97]',
              isSmall
                ? 'h-8 px-2.5 rounded-lg text-xs font-medium'
                : 'h-9 px-2.5 rounded-xl text-xs font-semibold',
              isActive
                ? 'bg-violet-600/15 border-violet-500/40 text-violet-600 dark:text-violet-300 font-semibold shadow-xs'
                : 'border-theme-border bg-theme-card-subtle text-theme-muted hover:text-theme-primary'
            )}
          >
            {Icon && <Icon className="size-3 shrink-0" />}
            <span>{option.label}</span>
            {isActive &&
              (activeOrder === 'desc' ? (
                <ArrowDown className="size-3 shrink-0 stroke-[2.5]" />
              ) : (
                <ArrowUp className="size-3 shrink-0 stroke-[2.5]" />
              ))}
          </button>
        );
      })}
    </div>
  );
}
