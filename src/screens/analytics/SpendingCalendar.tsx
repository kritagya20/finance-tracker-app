import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { cn } from '../../lib/utils';

interface SpendingCalendarProps {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  dailySpending: Map<string, IntegerMoney>; // Date string 'YYYY-MM-DD' -> amount in paise
  hideBalances: boolean;
  onSelectDate?: (dateStr: string, amount: IntegerMoney) => void;
  className?: string;
}

export const SpendingCalendar: React.FC<SpendingCalendarProps> = ({
  year,
  month,
  dailySpending,
  hideBalances,
  onSelectDate,
  className,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Calendar Geometry
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert to Monday = 0, Sunday = 6

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = today.getDate();

  // Compute daily spend amounts & calculate quartiles for intensity scaling
  const pastDaySpends: number[] = [];
  let zeroSpendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const isFuture = isCurrentMonth && d > currentDay;
    if (isFuture) continue;

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const amount = dailySpending.get(dateKey) || 0;

    const dayOfWeek = (startDayOfWeek + d - 1) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sat, Sun

    if (amount === 0) {
      zeroSpendCount++;
    } else {
      pastDaySpends.push(amount);
    }

    if (isWeekend) {
      weekendTotal += amount;
      weekendCount++;
    } else {
      weekdayTotal += amount;
      weekdayCount++;
    }
  }

  // Quartile thresholds for non-zero spends
  pastDaySpends.sort((a, b) => a - b);
  const q1 = pastDaySpends.length > 0 ? pastDaySpends[Math.floor(pastDaySpends.length * 0.25)] : 0;
  const q2 = pastDaySpends.length > 0 ? pastDaySpends[Math.floor(pastDaySpends.length * 0.6)] : 0;

  // Averages
  const weekdayAvg = weekdayCount > 0 ? Math.round(weekdayTotal / weekdayCount) : 0;
  const weekendAvg = weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0;

  // Weekday header labels
  const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Handle cell click
  const handleCellClick = (dateKey: string, amount: IntegerMoney, isFuture: boolean) => {
    if (isFuture) return;
    setSelectedDateStr(dateKey);
    onSelectDate?.(dateKey, amount);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-4 sm:p-5 shadow-sm select-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-violet-500" />
          <h3 className="text-xs font-semibold text-theme-primary">
            Spending Calendar & Streaks
          </h3>
        </div>
        <span className="text-[11px] font-mono text-theme-muted">
          {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Weekday Abbreviations Bar */}
      <div className="mt-3.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((wd, i) => (
          <span
            key={wd + i}
            className={cn(
              'text-[10px] font-mono font-medium',
              i >= 5 ? 'text-amber-500/80 font-bold' : 'text-theme-muted'
            )}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {/* Leading empty spacers for days before 1st of month */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isFuture = isCurrentMonth && day > currentDay;
          const isToday = isCurrentMonth && day === currentDay;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const amount = dailySpending.get(dateKey) || 0;
          const isZeroSpend = !isFuture && amount === 0;
          const isSelected = selectedDateStr === dateKey;

          // Intensity mapping
          let cellStyle = 'bg-slate-100 dark:bg-white/[0.04] text-theme-secondary';
          if (isFuture) {
            cellStyle = 'bg-transparent text-slate-300 dark:text-slate-700 opacity-40 cursor-default';
          } else if (isZeroSpend) {
            cellStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
          } else if (amount <= q1) {
            cellStyle = 'bg-violet-400/25 text-violet-700 dark:text-violet-300';
          } else if (amount <= q2) {
            cellStyle = 'bg-violet-500/50 text-white font-semibold';
          } else {
            cellStyle = 'bg-violet-600 text-white font-bold shadow-xs';
          }

          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => handleCellClick(dateKey, amount, isFuture)}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-mono transition-all duration-150 relative outline-none',
                cellStyle,
                isToday && 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-slate-900',
                isSelected && 'ring-2 ring-white shadow-md scale-105 z-10',
                !isFuture && 'hover:scale-105 active:scale-95 cursor-pointer'
              )}
              title={`${dateKey}: ${amount > 0 ? formatAdaptiveCardCurrency(amount, true, '₹', true) : 'Zero Spend'}`}
            >
              <span>{day}</span>
              {isZeroSpend && (
                <span className="size-1 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Toast or Legend */}
      <div className="mt-3.5 pt-3 border-t border-theme-border/50 flex items-center justify-between text-xs">
        {selectedDateStr ? (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-theme-secondary font-medium">
              {formatDateDDMMYYYY(selectedDateStr)}:
            </span>
            <span className="font-mono font-bold text-theme-primary">
              {(dailySpending.get(selectedDateStr) || 0) === 0 ? (
                <span className="text-emerald-500">Zero Spend Day ✨</span>
              ) : (
                hideBalances
                  ? '••••••'
                  : formatAdaptiveCardCurrency(dailySpending.get(selectedDateStr) || 0, true, '₹', true)
              )}
            </span>
          </div>
        ) : (
          <>
            {/* Zero-spend days celebration */}
            <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-semibold text-[11px]">
              <Sparkles className="size-3.5 shrink-0" />
              <span>
                <strong className="font-mono font-bold">{zeroSpendCount}</strong> zero-spend days
              </span>
            </div>

            {/* Weekend vs Weekday Delta */}
            <div className="font-mono text-[10px] text-theme-muted flex items-center gap-2">
              <span>Wkday: {hideBalances ? '••••' : formatAdaptiveCardCurrency(weekdayAvg, true, '₹', true)}</span>
              <span>·</span>
              <span className="text-amber-500/90">Wkend: {hideBalances ? '••••' : formatAdaptiveCardCurrency(weekendAvg, true, '₹', true)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
