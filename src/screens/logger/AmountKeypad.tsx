import React from 'react';
import { ArrowLeft, Delete, Store, AlertCircle } from 'lucide-react';
import { TransactionType } from '../../domain/models/types';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

export interface AmountKeypadProps {
  type: TransactionType;
  onTypeChange?: (type: TransactionType) => void;
  showTypeSwitcher?: boolean;
  amountStr: string;
  onAmountChange: (newAmountStr: string) => void;
  currencySymbol: string;
  numberingSystem?: 'indian' | 'international' | 'standard';
  merchantName?: string;
  onMerchantNameChange?: (name: string) => void;
  showMerchantInput?: boolean;
  quickAmounts?: number[];
  onProceed: () => void;
  onClose: () => void;
  proceedLabel?: string;
  title?: string;
  errorMessage?: string | null;
  onHeaderDragStart?: (clientY: number) => void;
}

const DEFAULT_QUICK_AMOUNTS = [100, 500, 1000, 2000];

/**
 * Standardized AmountKeypad component used across transaction creation and editing flows.
 * Provides a clean, responsive numeric pad, quick preset chips, optional merchant input,
 * and currency display in JetBrains Mono.
 */
export const AmountKeypad: React.FC<AmountKeypadProps> = ({
  type,
  onTypeChange,
  showTypeSwitcher = true,
  amountStr,
  onAmountChange,
  currencySymbol,
  numberingSystem = 'indian',
  merchantName,
  onMerchantNameChange,
  showMerchantInput = true,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  onProceed,
  onClose,
  proceedLabel,
  title,
  errorMessage,
  onHeaderDragStart,
}) => {
  const activeAmount = parseKeypadToPaise(amountStr);
  const formattedRupees = (activeAmount / 100).toLocaleString(
    numberingSystem === 'indian' ? 'en-IN' : 'en-US',
    { maximumFractionDigits: 2 }
  );

  const handleKeypadPress = (key: string) => {
    if (key === 'BACKSPACE' || key === 'delete') {
      onAmountChange(amountStr.length <= 1 ? '0' : amountStr.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (amountStr.includes('.')) return;
      onAmountChange(amountStr + '.');
      return;
    }
    if (amountStr === '0') {
      onAmountChange(key);
      return;
    }
    const parts = amountStr.split('.');
    if (parts.length > 1 && parts[1].length >= 2) return;
    onAmountChange(amountStr + key);
  };

  const handleQuickAdd = (rupeesToAdd: number) => {
    const currentPaise = parseKeypadToPaise(amountStr);
    const currentRupees = paiseToRupees(currentPaise);
    const newRupees = currentRupees + rupeesToAdd;
    onAmountChange(newRupees.toString());
  };

  const displayTitle =
    title ||
    (type === 'EXPENSE' ? 'Add Expense' : type === 'INCOME' ? 'Add Income' : 'Add Transfer');

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between px-5 pb-8 animate-in fade-in duration-200 select-none">
      {/* Top Header Bar */}
      <div
        onPointerDown={(e) => {
          if (e.button === 0 && onHeaderDragStart) onHeaderDragStart(e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches.length > 0 && onHeaderDragStart) onHeaderDragStart(e.touches[0].clientY);
        }}
        className="flex items-center justify-between pb-2 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Close"
          className="flex size-10 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
        >
          <ArrowLeft className="size-5" />
        </button>

        <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider">
          {displayTitle}
        </h2>

        <div className="size-10" />
      </div>

      {/* Type Switcher Pills */}
      {showTypeSwitcher && onTypeChange && (
        <div className="flex items-center justify-center pb-2 shrink-0">
          <div className="flex items-center rounded-full bg-theme-card-subtle p-1 border border-theme-border/50">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
              const isSelected = type === t;
              const label = t === 'EXPENSE' ? 'Expense' : t === 'INCOME' ? 'Income' : 'Transfer';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTypeChange(t)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
                    isSelected
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-primary'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="my-1 shrink-0 flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
          <AlertCircle className="size-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Centered Hero: Amount + Note Pill */}
      <div className="flex flex-col items-center justify-center py-2 shrink-0">
        <span className="text-xs font-medium text-theme-muted tracking-wider uppercase mb-1">
          Enter amount
        </span>

        <div className="flex items-baseline justify-center gap-1.5 select-none">
          <span className="text-2xl font-semibold text-theme-muted font-mono">{currencySymbol}</span>
          <span className="text-5xl font-light tracking-tight tabular-nums text-theme-primary font-mono">
            {amountStr}
          </span>
          <span className="ml-0.5 h-8 w-0.5 animate-pulse rounded-full bg-violet-500" />
        </div>

        {/* Optional Quick Payee/Merchant input in Step 1 */}
        {showMerchantInput && onMerchantNameChange && (
          <div className="mt-3 flex flex-col items-center justify-center w-full max-w-[260px]">
            <div className="relative flex items-center w-full">
              <Store className="absolute left-3.5 size-3.5 text-theme-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Merchant / Payee"
                aria-label="Merchant / Payee"
                value={merchantName || ''}
                maxLength={256}
                onChange={(e) => onMerchantNameChange(e.target.value.slice(0, 256))}
                className="w-full rounded-full bg-theme-card-subtle pl-9 pr-4 py-2 text-xs text-center text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors shadow-xs"
              />
            </div>
            {merchantName && merchantName.length > 200 && (
              <span className="mt-1 text-[10px] font-mono text-theme-muted">
                {merchantName.length}/256
              </span>
            )}
          </div>
        )}

        {/* Subtle Quick Increment Chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAdd(amt)}
              className="rounded-full bg-theme-card-subtle px-3 py-1.5 text-xs font-medium font-mono text-theme-secondary hover:text-theme-primary hover:bg-theme-card active:scale-[0.95] transition-all shadow-xs border border-theme-border/40"
            >
              +{currencySymbol}{amt.toLocaleString(numberingSystem === 'indian' ? 'en-IN' : 'en-US')}
            </button>
          ))}
        </div>
      </div>

      {/* 12-key Keypad */}
      <div className="py-2 flex-1 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-3 gap-2.5 max-w-[340px] mx-auto w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeypadPress(key)}
              className="flex h-12 items-center justify-center rounded-2xl bg-theme-card/60 hover:bg-theme-card text-theme-primary text-xl font-medium font-mono active:scale-[0.92] transition-all border border-theme-border/30"
            >
              {key === 'BACKSPACE' ? (
                <Delete className="size-5 text-theme-secondary" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2 shrink-0">
        <button
          type="button"
          onClick={onProceed}
          disabled={activeAmount <= 0}
          className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
        >
          <span>
            {proceedLabel ||
              (activeAmount > 0
                ? `Proceed to Details (${currencySymbol}${formattedRupees})`
                : 'Enter amount to proceed')}
          </span>
        </button>
      </div>
    </div>
  );
};
