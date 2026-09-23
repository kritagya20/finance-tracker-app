import React from 'react';
import { Store, ChevronRight } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

export interface MerchantSpendItem {
  name: string;
  amount: IntegerMoney;
  transactionCount: number;
}

interface TopMerchantsCardProps {
  merchants: MerchantSpendItem[];
  hideBalances: boolean;
  onSelectMerchant?: (name: string) => void;
  className?: string;
}

export const TopMerchantsCard: React.FC<TopMerchantsCardProps> = ({
  merchants,
  hideBalances,
  onSelectMerchant,
  className,
}) => {
  // Edge case: No merchant data
  if (!merchants || merchants.length === 0) {
    return (
      <div
        className={cn(
          'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-5 shadow-sm select-none',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
            <Store className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Frequent Merchants</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Add merchant names to your transactions to see your top destinations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Maximum spend to calculate proportional bar fill
  const maxAmount = Math.max(...merchants.map((m) => m.amount), 1);

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 sm:p-5 shadow-sm select-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-theme-primary">
          Top Spending Destinations
        </h3>
        <span className="text-[11px] font-mono text-theme-muted">
          Top {merchants.length}
        </span>
      </div>

      {/* Ranked List */}
      <div className="mt-3 flex flex-col space-y-1.5">
        {merchants.map((merchant, idx) => {
          const widthPercent = Math.min(100, Math.max(8, Math.round((merchant.amount / maxAmount) * 100)));
          const formattedAmount = hideBalances
            ? '••••••'
            : formatAdaptiveCardCurrency(merchant.amount, true, '₹', true);

          return (
            <div
              key={merchant.name + idx}
              role={onSelectMerchant ? 'button' : undefined}
              tabIndex={onSelectMerchant ? 0 : undefined}
              onClick={() => onSelectMerchant?.(merchant.name)}
              className={cn(
                'relative flex items-center justify-between rounded-xl px-3 py-2.5 overflow-hidden transition-all duration-200 group',
                onSelectMerchant && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              )}
            >
              {/* Proportional Background Fill Bar */}
              <div
                style={{ width: `${widthPercent}%` }}
                className="absolute inset-y-0 left-0 bg-violet-500/[0.07] dark:bg-violet-500/[0.12] rounded-xl pointer-events-none transition-all duration-500"
              />

              {/* Left: Rank & Merchant Name */}
              <div className="relative flex items-center gap-2.5 min-w-0 pr-2 z-10">
                <span className="font-mono text-xs font-semibold text-theme-muted w-4 shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {merchant.name}
                </span>
                <span className="font-mono text-[10px] text-theme-muted shrink-0">
                  ({merchant.transactionCount}x)
                </span>
              </div>

              {/* Right: Amount & Optional Chevron */}
              <div className="relative flex items-center gap-2 shrink-0 z-10">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {formattedAmount}
                </span>
                {onSelectMerchant && (
                  <ChevronRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
