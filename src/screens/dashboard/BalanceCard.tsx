import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FinanceSummary } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';

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

  return (
    <div className="relative p-[1.5px] rounded-[32px] bg-gradient-to-br from-violet-500/50 via-slate-800/20 to-emerald-500/40 shadow-2xl shadow-violet-950/20">
      <div className="rounded-[30.5px] bg-white dark:bg-[#14151a] p-6 sm:p-7 transition-colors">
        {/* Header Label */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
          TOTAL BALANCE
        </p>

        {/* Hero Balance Amount */}
        <h1 className="mt-2 mb-6 text-3xl sm:text-[38px] font-bold font-sans tracking-tight text-slate-900 dark:text-white leading-none">
          {hideBalances ? (
            <span className="text-slate-400 dark:text-zinc-600">₹ ••••••</span>
          ) : (
            formatCurrency(total, undefined, true)
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
            <p className="text-[17px] sm:text-[18px] font-bold font-sans text-emerald-700 dark:text-[#34d399] tracking-tight truncate leading-tight">
              {hideBalances ? '••••••' : formatCurrency(income, undefined, true)}
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
            <p className="text-[17px] sm:text-[18px] font-bold font-sans text-rose-700 dark:text-[#fca5a5] tracking-tight truncate leading-tight">
              {hideBalances ? '••••••' : formatCurrency(spent, undefined, true)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
