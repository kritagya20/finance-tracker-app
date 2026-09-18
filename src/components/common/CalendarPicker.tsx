import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type CalendarMode = 'single' | 'range';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface CalendarPickerProps {
  mode?: CalendarMode;
  selectedDate?: string; // YYYY-MM-DD or ISO
  onSelectDate?: (dateStr: string) => void;
  selectedRange?: DateRange;
  onSelectRange?: (range: DateRange) => void;
  onPresetSelect?: (preset: string) => void;
  activePreset?: string;
  showPresets?: boolean;
  onClose?: () => void;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYMDToDate(ymd: string): Date {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  mode = 'single',
  selectedDate,
  onSelectDate,
  selectedRange,
  onSelectRange,
  onPresetSelect,
  activePreset,
  showPresets = true,
  onClose,
  className,
}) => {
  // Determine initial month view from selected date or current date
  const initialDate = selectedDate
    ? parseYMDToDate(selectedDate)
    : selectedRange?.startDate
    ? parseYMDToDate(selectedRange.startDate)
    : new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Internal range selection tracking when in range mode
  const [rangeStart, setRangeStart] = useState<string | null>(selectedRange?.startDate || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(selectedRange?.endDate || null);

  const todayYMD = formatDateToYMD(new Date());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Days calculations for the month view
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handleDayClick = (dayStr: string) => {
    if (mode === 'single') {
      onSelectDate?.(dayStr);
      onClose?.();
      return;
    }

    // Range mode logic
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dayStr);
      setRangeEnd(null);
    } else {
      // User is picking the second date
      if (dayStr < rangeStart) {
        setRangeStart(dayStr);
        setRangeEnd(rangeStart);
        onSelectRange?.({ startDate: dayStr, endDate: rangeStart });
      } else {
        setRangeEnd(dayStr);
        onSelectRange?.({ startDate: rangeStart, endDate: dayStr });
      }
    }
  };

  const handleApplyRangePreset = (presetKey: string) => {
    const now = new Date();
    let start = '';
    let end = '';

    if (presetKey === 'TODAY') {
      start = formatDateToYMD(now);
      end = start;
    } else if (presetKey === 'YESTERDAY') {
      const y = new Date(now.getTime() - 86400000);
      start = formatDateToYMD(y);
      end = start;
    } else if (presetKey === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      start = formatDateToYMD(monday);
      end = formatDateToYMD(new Date());
    } else if (presetKey === 'THIS_MONTH') {
      start = formatDateToYMD(new Date(now.getFullYear(), now.getMonth(), 1));
      end = formatDateToYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (presetKey === 'LAST_MONTH') {
      start = formatDateToYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = formatDateToYMD(new Date(now.getFullYear(), now.getMonth(), 0));
    } else if (presetKey === 'LAST_30_DAYS') {
      const past = new Date(now.getTime() - 30 * 86400000);
      start = formatDateToYMD(past);
      end = formatDateToYMD(now);
    } else if (presetKey === 'ALL') {
      onPresetSelect?.('ALL');
      onClose?.();
      return;
    }

    if (start && end) {
      setRangeStart(start);
      setRangeEnd(end);
      onSelectRange?.({ startDate: start, endDate: end });
      onPresetSelect?.(presetKey);
    }
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
  });

  return (
    <div
      className={cn(
        'w-full max-w-[340px] rounded-3xl border border-theme-border bg-theme-elevated p-4 shadow-xl text-theme-primary select-none',
        className
      )}
    >
      {/* Calendar Header: Month/Year navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-violet-500" />
          <h3 className="text-sm font-bold text-theme-primary">
            {monthName} <span className="text-theme-muted font-normal">{viewYear}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleJumpToday}
            title="Jump to current month"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-7 items-center justify-center rounded-lg border border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover active:scale-95 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-7 items-center justify-center rounded-lg border border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover active:scale-95 transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 pt-3 pb-1 text-center text-[11px] font-semibold text-theme-muted">
        {WEEKDAYS.map((wd, i) => (
          <div key={i} className="py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {/* Previous Month Overflow Days */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => {
          const prevDayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="flex size-8 mx-auto items-center justify-center text-[11px] text-theme-muted opacity-40"
            >
              {prevDayNum}
            </div>
          );
        })}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

          const isToday = dayStr === todayYMD;

          // Selection states
          const isSingleSelected = mode === 'single' && selectedDate?.slice(0, 10) === dayStr;

          const isRangeStart = mode === 'range' && rangeStart === dayStr;
          const isRangeEnd = mode === 'range' && rangeEnd === dayStr;
          const isInRange =
            mode === 'range' &&
            rangeStart &&
            rangeEnd &&
            dayStr > rangeStart &&
            dayStr < rangeEnd;

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleDayClick(dayStr)}
              className={cn(
                'relative flex size-8 mx-auto items-center justify-center rounded-full text-xs font-medium transition-all active:scale-95',
                // Default Day
                'text-theme-primary hover:bg-theme-card-hover',
                // Today indicator
                isToday && !isSingleSelected && !isRangeStart && !isRangeEnd && 'border border-violet-500 text-violet-600 dark:text-violet-400 font-bold',
                // Single mode selected
                isSingleSelected && 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40 hover:bg-violet-600',
                // Range mode start
                isRangeStart && 'bg-violet-600 text-white font-bold rounded-full shadow-sm hover:bg-violet-600 z-10',
                // Range mode end
                isRangeEnd && 'bg-violet-600 text-white font-bold rounded-full shadow-sm hover:bg-violet-600 z-10',
                // In range
                isInRange && 'bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-none'
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Quick Presets Strip */}
      {showPresets && mode === 'range' && (
        <div className="mt-4 pt-3 border-t border-theme-divider space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyRangePreset('THIS_MONTH')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                activePreset === 'THIS_MONTH'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleApplyRangePreset('LAST_MONTH')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                activePreset === 'LAST_MONTH'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => handleApplyRangePreset('LAST_30_DAYS')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                activePreset === 'LAST_30_DAYS'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyRangePreset('ALL')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                activePreset === 'ALL'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              All Time
            </button>
          </div>
        </div>
      )}

      {/* Done / Close Button */}
      {onClose && (
        <div className="mt-3 pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/30 hover:bg-violet-500 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
