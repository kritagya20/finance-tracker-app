import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface MpinInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  isSuccess?: boolean;
  showValue?: boolean;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const MpinInput: React.FC<MpinInputProps> = ({
  value,
  onChange,
  onBlur,
  hasError = false,
  isSuccess = false,
  showValue = false,
  id,
  disabled = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = value.split('');
  const activeIndex = Math.min(digits.length, 5);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(cleaned);
  };

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        'relative flex items-center justify-center gap-2.5 my-4 cursor-pointer select-none',
        hasError && 'animate-shake'
      )}
    >
      {/* Underlying invisible input handling native keyboard, focus, and clipboard */}
      <input
        ref={inputRef}
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label="6-digit MPIN"
        className="absolute inset-0 size-full opacity-0 cursor-pointer z-10"
      />

      {/* 6 Discrete Visual Digit Cells */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const hasChar = digits[index] !== undefined;
        const isCurrent = isFocused && activeIndex === index;

        return (
          <div
            key={index}
            className={cn(
              'w-11 h-[52px] rounded-xl border flex items-center justify-center transition-all bg-theme-input shadow-xs',
              hasError
                ? 'border-2 border-rose-500 ring-4 ring-rose-500/20 bg-rose-500/5 text-rose-500'
                : isSuccess
                ? 'border-2 border-emerald-500/80 ring-4 ring-emerald-500/20 bg-emerald-500/5 text-emerald-500'
                : isCurrent
                ? 'border-2 border-violet-500 ring-4 ring-violet-500/20 bg-theme-input scale-[1.02]'
                : hasChar
                ? 'border-theme-border bg-theme-card-subtle'
                : 'border-theme-border'
            )}
          >
            {hasChar ? (
              showValue ? (
                <span className="text-xl font-bold font-mono text-theme-primary">
                  {digits[index]}
                </span>
              ) : (
                <span className="text-xl text-theme-primary leading-none">
                  ●
                </span>
              )
            ) : isCurrent ? (
              <span className="h-5 w-0.5 animate-pulse rounded-full bg-violet-500" />
            ) : (
              <span className="size-1.5 rounded-full bg-theme-muted/30" />
            )}
          </div>
        );
      })}
    </div>
  );
};
