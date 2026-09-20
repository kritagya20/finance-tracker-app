import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Standardized SearchInput component across all lists, drawers, and modal views.
 * Adheres to DESIGN_SYSTEM.md metrics and accessibility standards.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className,
  autoFocus = false,
}) => {
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-theme-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full pl-9 pr-9 rounded-xl bg-theme-card-subtle/80 border border-theme-border/60 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all font-sans"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-md text-theme-muted hover:text-theme-primary hover:bg-theme-card active:scale-95 transition-all"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
};
