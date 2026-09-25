import React from 'react';
import { Store, ChevronRight } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { CardShell } from '../../components/ui/CardShell';
import { CardHeader } from '../../components/ui/CardHeader';
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
      <CardShell className={className}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
            <Store className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Top Spending Destinations</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Log merchant names on your transactions to discover your top spending destinations.
            </p>
          </div>
        </div>
      </CardShell>
    );
  }

  // Calculate highest spend for subtle relative background bar fill
  const maxAmount = Math.max(...merchants.map((m) => m.amount), 1);

  return (
    <CardShell className={className}>
      {/* Card Header Primitive */}
      <CardHeader
        title="Top Spending Destinations"
        icon={Store}
        badge={`Top ${merchants.length}`}
      />

      {/* Ultra-Minimal List */}
      <div className="mt-3 flex flex-col gap-1">
        {merchants.map((merchant, idx) => {
          const rank = idx + 1;
          const relativeWidthPercent = Math.min(100, Math.max(6, Math.round((merchant.amount / maxAmount) * 100)));
          const formattedAmount = hideBalances
            ? '••••••'
            : formatAdaptiveCardCurrency(merchant.amount, true, undefined, true);

          return (
            <div
              key={merchant.name + idx}
              role={onSelectMerchant ? 'button' : undefined}
              tabIndex={onSelectMerchant ? 0 : undefined}
              onClick={() => onSelectMerchant?.(merchant.name)}
              className={cn(
                'group relative flex items-center justify-between rounded-xl p-2.5 transition-all duration-150 overflow-hidden',
                onSelectMerchant && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              )}
            >
              {/* Subtle relative spend background bar */}
              <div
                style={{ width: `${relativeWidthPercent}%` }}
                className="absolute inset-y-0 left-0 bg-violet-500/[0.05] dark:bg-violet-500/[0.08] rounded-xl pointer-events-none transition-all duration-300"
              />

              {/* Left: Rank Pill & Merchant Name */}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <span className="text-xs font-mono font-bold text-theme-muted size-6 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                  {rank}
                </span>
                <span className="text-xs sm:text-sm font-medium text-theme-primary truncate">
                  {merchant.name}
                </span>
              </div>

              {/* Right: Amount & Navigation Chevron */}
              <div className="relative z-10 flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs sm:text-sm font-bold text-theme-primary">
                  {formattedAmount}
                </span>
                {onSelectMerchant && (
                  <ChevronRight className="size-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
};
