import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, X } from 'lucide-react';
import { IntegerMoney } from '../../domain/models/types';
import { formatCurrency, formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY, formatDateRangeDDMMYYYY } from '../../domain/engine/dateUtils';
import { CardShell } from '../../components/ui/CardShell';
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Calendar Geometry
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDayOfMonth = new Date(year, month + 1, 0);
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

  // Averages (Ceiled to whole currency units, zero decimals)
  const weekdayRupees = weekdayCount > 0 ? Math.ceil(weekdayTotal / 100 / weekdayCount) : 0;
  const weekendRupees = weekendCount > 0 ? Math.ceil(weekendTotal / 100 / weekendCount) : 0;
  const totalPastDays = weekdayCount + weekendCount;
  const dailyRupees = totalPastDays > 0 ? Math.ceil((weekdayTotal + weekendTotal) / 100 / totalPastDays) : 0;

  const weekdayAvg: IntegerMoney = weekdayRupees * 100;
  const weekendAvg: IntegerMoney = weekendRupees * 100;
  const dailyAvg: IntegerMoney = dailyRupees * 100;

  // Weekday header labels
  const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Base Carousel Slides Configuration (3 Slides strictly ordered: 1. Daily Avg, 2. Weekday Avg, 3. Weekend Avg)
  const baseSlides = [
    {
      id: 'daily',
      badge: 'Daily Avg',
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      value: hideBalances ? '••••' : formatCurrency(dailyAvg, undefined, false),
      valClass: 'text-theme-primary font-bold',
    },
    {
      id: 'weekday',
      badge: 'Weekday Avg',
      badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
      value: hideBalances ? '••••' : formatCurrency(weekdayAvg, undefined, false),
      valClass: 'text-theme-primary font-bold',
    },
    {
      id: 'weekend',
      badge: 'Weekend Avg',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      value: hideBalances ? '••••' : formatCurrency(weekendAvg, undefined, false),
      valClass: 'text-amber-600 dark:text-amber-400 font-bold',
    },
  ];

  // Extended slides array with a clone of the first slide at the end for continuous circular forward looping (1 -> 2 -> 3 -> 1)
  const displaySlides = [...baseSlides, { ...baseSlides[0], id: 'daily-clone' }];

  // Advance slide forward every 4 seconds (4000ms)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCarouselIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // When transition to the clone slide (index === 3) completes, silently reset index to 0 without animation
  useEffect(() => {
    if (carouselIndex === baseSlides.length) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCarouselIndex(0);
      }, 500); // 500ms matches transition duration-500
      return () => clearTimeout(timer);
    }
  }, [carouselIndex, baseSlides.length]);

  // Handle manual user tap on carousel
  const handleCarouselClick = () => {
    setIsTransitioning(true);
    setCarouselIndex((prev) => (prev >= baseSlides.length ? 1 : prev + 1));
  };

  // Handle cell click (toggle selection)
  const handleCellClick = (dateKey: string, amount: IntegerMoney, isFuture: boolean) => {
    if (isFuture) return;
    if (selectedDateStr === dateKey) {
      setSelectedDateStr(null);
    } else {
      setSelectedDateStr(dateKey);
      onSelectDate?.(dateKey, amount);
    }
  };

  return (
    <CardShell className={className}>
      {/* Header Bar: Guarantees title is ALWAYS 100% fully displayed without truncation */}
      <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarIcon className="size-4 text-violet-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-theme-primary whitespace-nowrap">
            Spending Calendar
          </h3>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono font-medium text-theme-muted bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/[0.08] whitespace-nowrap shrink-0 ml-auto">
          {formatDateRangeDDMMYYYY(firstDayOfMonth, lastDayOfMonth)}
        </span>
      </div>

      {/* Weekday Abbreviations Bar */}
      <div className="mt-3.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((wd, i) => (
          <span
            key={wd + i}
            className={cn(
              'text-[10px] font-mono font-medium',
              i >= 5 ? 'text-amber-500/90 font-bold' : 'text-theme-muted'
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
              title={`${dateKey}: ${amount > 0 ? formatAdaptiveCardCurrency(amount, true, undefined, true) : 'Zero Spend'}`}
            >
              <span>{day}</span>
              {isZeroSpend && (
                <span className="size-1 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Toast or Vertical Carousel Metrics Footer */}
      <div className="mt-3.5 pt-3 border-t border-theme-border/50 flex items-center justify-between text-xs">
        {selectedDateStr ? (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-theme-secondary font-medium">
              {formatDateDDMMYYYY(selectedDateStr)}:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-theme-primary">
                {(dailySpending.get(selectedDateStr) || 0) === 0 ? (
                  <span className="text-emerald-500 font-semibold">Zero Spend Day ✨</span>
                ) : (
                  hideBalances
                    ? '••••••'
                    : formatAdaptiveCardCurrency(dailySpending.get(selectedDateStr) || 0, true, undefined, true)
                )}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="p-1 rounded-lg hover:bg-theme-card-hover text-theme-muted hover:text-theme-primary transition-colors"
                title="Clear date selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Left side: Zero-spend days celebration */}
            <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-semibold text-[11px] shrink-0">
              <Sparkles className="size-3.5 shrink-0" />
              <span>
                <strong className="font-mono font-bold">{zeroSpendCount}</strong> zero-spend days
              </span>
            </div>

            {/* Right side: Continuous Infinite Circular Forward Carousel (1 -> 2 -> 3 -> 1) */}
            <div
              className="flex items-center gap-1.5 relative cursor-pointer select-none shrink-0"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              onClick={handleCarouselClick}
              title="Click or hover to pause carousel"
            >
              <div className="relative h-6 overflow-hidden min-w-[160px] sm:min-w-[180px] flex items-center justify-end">
                <div
                  className={cn(
                    'absolute top-0 right-0 w-full flex flex-col',
                    isTransitioning ? 'transition-transform duration-500 ease-out' : 'transition-none'
                  )}
                  style={{ transform: `translateY(-${carouselIndex * 24}px)` }}
                >
                  {displaySlides.map((slide, idx) => (
                    <div
                      key={slide.id + idx}
                      className="h-6 flex items-center justify-end gap-1.5 text-[11px] font-mono whitespace-nowrap shrink-0"
                    >
                      <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0', slide.badgeClass)}>
                        {slide.badge}
                      </span>
                      <span className={cn('shrink-0', slide.valClass)}>{slide.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CardShell>
  );
};
