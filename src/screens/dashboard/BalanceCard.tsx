import React, { useState, useRef } from 'react';
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
  const [isInteracting, setIsInteracting] = useState(false);
  const [pointerX, setPointerX] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

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

  // Interactive glass slider tracking handlers
  const handlePointerMove = (clientX: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedPct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setPointerX(clampedPct);
    setIsInteracting(true);
  };

  const handlePointerLeave = () => {
    setIsInteracting(false);
    setPointerX(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseLeave={handlePointerLeave}
      onTouchMove={(e) => {
        if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
      }}
      onTouchEnd={handlePointerLeave}
      className="relative p-[1.5px] rounded-[32px] bg-gradient-to-br from-violet-500/50 via-slate-800/20 to-emerald-500/40 shadow-2xl shadow-violet-950/25 select-none transition-all group"
    >
      {/* Card Inner Container with Enhanced Frosted Glass Background Color */}
      <div className="relative rounded-[30.5px] overflow-hidden bg-gradient-to-br from-white/95 via-slate-50/95 to-slate-100/90 dark:bg-gradient-to-br dark:from-[#181a27]/95 dark:via-[#11121d]/98 dark:to-[#0a0b13]/98 border border-white/20 dark:border-white/[0.08] backdrop-blur-2xl p-6 sm:p-7 transition-all shadow-inner">
        {/* Soft Ambient Radial Backlights */}
        <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-violet-600/[0.16] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-emerald-500/[0.12] blur-3xl" />
        
        {/* Top Hairline Specular Reflection */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 dark:via-white/20 to-transparent" />

        {/* --- Subtle, Settled Glass Sheen Effect Layers --- */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30.5px]">
          {/* 1. Automated Gentle Ambient Glass Sheen (Subtle, periodic sweep every 18s) */}
          <div className="absolute -inset-y-16 w-48 bg-gradient-to-r from-transparent via-white/[0.045] dark:via-white/[0.055] to-transparent blur-lg transform -skew-x-[25deg] animate-glass-sheen" />

          {/* 2. Interactive Gesture/Touch Glass Tracking (Soft specular glide) */}
          {isInteracting && pointerX !== null && (
            <div
              className="absolute -inset-y-16 w-36 bg-gradient-to-r from-transparent via-white/[0.07] dark:via-white/[0.08] to-transparent blur-md transform -skew-x-[25deg] transition-all duration-75 ease-out"
              style={{
                left: `${pointerX}%`,
                transform: 'translateX(-50%) skewX(-25deg)',
              }}
            />
          )}
        </div>

        {/* Header Label */}
        <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
          TOTAL BALANCE
        </p>

        {/* Hero Balance Amount */}
        <h1
          className={cn(
            'relative z-10 mt-2 mb-6 font-bold font-sans tracking-tight text-slate-900 dark:text-white leading-none',
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
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* Income Card */}
          <div className="rounded-[20px] bg-emerald-500/10 dark:bg-[#122820]/90 border border-emerald-500/20 dark:border-[#1a4336]/80 p-3.5 flex flex-col justify-between backdrop-blur-md transition-all shadow-sm">
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
          <div className="rounded-[20px] bg-rose-500/10 dark:bg-[#28151e]/90 border border-rose-500/20 dark:border-[#451f2e]/80 p-3.5 flex flex-col justify-between backdrop-blur-md transition-all shadow-sm">
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
