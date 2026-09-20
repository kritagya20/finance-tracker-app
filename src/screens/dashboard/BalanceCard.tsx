import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FinanceSummary } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface BalanceCardProps {
  summary: FinanceSummary | null;
  hideBalances: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  hideBalances,
}) => {
  const total = summary?.totalBalance ?? 14285000;
  const income = summary?.monthlyIncome ?? 8500000;
  const spent = summary?.monthlySpent ?? 3215000;

  const totalFormatted = formatAdaptiveCardCurrency(total, false);
  const incomeFormatted = formatAdaptiveCardCurrency(income, true);
  const spentFormatted = formatAdaptiveCardCurrency(spent, true);

  const getSubCardFontSize = (formattedStr: string) => {
    if (formattedStr.length > 12) return 'text-[14px] sm:text-[15px]';
    if (formattedStr.length > 10) return 'text-[15px] sm:text-[16px]';
    return 'text-[17px] sm:text-[18px]';
  };

  const getHeroFontSize = (formattedStr: string) => {
    if (formattedStr.length > 14) return 'text-2xl sm:text-3xl';
    return 'text-3xl sm:text-[38px]';
  };

  return (
    <div className="relative p-[1.5px] rounded-[32px] bg-gradient-to-br from-violet-500/50 via-slate-800/20 to-emerald-500/40 shadow-2xl shadow-violet-950/20">
      <div className="rounded-[30.5px] bg-white dark:bg-[#14151a] p-6 sm:p-7 transition-colors">
        {/* Header Label */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
          TOTAL BALANCE
        </p>

        {/* Hero Balance Amount */}
        <h1
          className={cn(
            'mt-2 mb-6 font-bold font-sans tracking-tight text-slate-900 dark:text-white leading-none',
            hideBalances ? 'text-3xl sm:text-[38px]' : getHeroFontSize(totalFormatted)
          )}
        >
          {hideBalances ? (
            <span className="text-slate-400 dark:text-zinc-600">₹ ••••••</span>
          ) : (
            totalFormatted
          )}
        </h1>

        {/* Dual Cash Flow Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Income Card */}
          <div className="rounded-[20px] bg-emerald-500/10 dark:bg-[#122820] border border-emerald-500/20 dark:border-[#1a4336] p-3.5 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-emerald-700 dark:text-[#34d399]/90 truncate">
                Income
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-[#1b4337] text-emerald-600 dark:text-[#34d399]">
                <ArrowDownLeft className="size-4 stroke-[2.2]" />
              </div>
            </div>
            <p
              className={cn(
                'font-bold font-sans text-emerald-700 dark:text-[#34d399] tracking-tight truncate leading-tight',
                hideBalances ? 'text-[17px] sm:text-[18px]' : getSubCardFontSize(incomeFormatted)
              )}
            >
              {hideBalances ? '••••••' : incomeFormatted}
            </p>
          </div>

          {/* Spent Card */}
          <div className="rounded-[20px] bg-rose-500/10 dark:bg-[#28151e] border border-rose-500/20 dark:border-[#451f2e] p-3.5 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-rose-700 dark:text-[#fca5a5]/90 truncate">
                Spent
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 dark:bg-[#3f1c29] text-rose-600 dark:text-[#fb7185]">
                <ArrowUpRight className="size-4 stroke-[2.2]" />
              </div>
            </div>
            <p
              className={cn(
                'font-bold font-sans text-rose-700 dark:text-[#fca5a5] tracking-tight truncate leading-tight',
                hideBalances ? 'text-[17px] sm:text-[18px]' : getSubCardFontSize(spentFormatted)
              )}
            >
              {hideBalances ? '••••••' : spentFormatted}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
