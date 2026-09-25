import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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

  // Internal preset & range selection state tracking before "Done" is tapped
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(activePreset || null);
  const [rangeStart, setRangeStart] = useState<string | null>(selectedRange?.startDate || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(selectedRange?.endDate || null);

  // Sync selectedPresetKey if activePreset prop updates
  useEffect(() => {
    setSelectedPresetKey(activePreset || null);
  }, [activePreset]);

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

  // Days calculations for the month view
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Fixed 6-week layout (42 slots) to ensure 100% stable height and layout
  const TOTAL_GRID_SLOTS = 42;
  const nextMonthOverflowCount = TOTAL_GRID_SLOTS - (firstDayOfMonth + daysInMonth);

  // Day click handler
  const handleDayClick = (dayStr: string) => {
    setSelectedPresetKey(null); // Clear preset selection when custom date is clicked

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
      } else {
        setRangeEnd(dayStr);
      }
    }
  };

  // Preset pill click handler (selects preset without auto-closing)
  const handlePresetClick = (presetKey: string) => {
    setSelectedPresetKey(presetKey);
    setRangeStart(null);
    setRangeEnd(null);
  };

  // Done button handler (confirms active selection)
  const handleDone = () => {
    if (selectedPresetKey) {
      onPresetSelect?.(selectedPresetKey);
    } else if (rangeStart && rangeEnd) {
      onSelectRange?.({ startDate: rangeStart, endDate: rangeEnd });
    }
    onClose?.();
  };

  // Touch swipe gesture handling for month navigation (Left = Next, Right = Prev)
  const touchStartXRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (deltaX < -40) {
      handleNextMonth();
    } else if (deltaX > 40) {
      handlePrevMonth();
    }
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'w-[328px] max-w-[calc(100vw-32px)] shrink-0 rounded-3xl border border-theme-border bg-theme-elevated p-4 shadow-xl text-theme-primary select-none touch-pan-y',
        className
      )}
    >
      {/* Calendar Header: Month/Year navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="size-4 text-violet-500 shrink-0" />
          <h3 className="text-sm font-bold text-theme-primary whitespace-nowrap">
            {monthName} <span className="text-theme-muted font-normal">{viewYear}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
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
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-mono">
        {/* Previous Month Overflow Days */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => {
          const prevDayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="flex size-8 mx-auto items-center justify-center text-[11px] font-mono text-theme-muted opacity-40"
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
                'relative flex size-8 mx-auto items-center justify-center rounded-full text-xs font-medium font-mono transition-all active:scale-95',
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

        {/* Next Month Overflow Days */}
        {Array.from({ length: Math.max(0, nextMonthOverflowCount) }).map((_, i) => {
          const nextDayNum = i + 1;
          return (
            <div
              key={`next-${i}`}
              className="flex size-8 mx-auto items-center justify-center text-[11px] font-mono text-theme-muted opacity-40"
            >
              {nextDayNum}
            </div>
          );
        })}
      </div>

      {/* Timeframe Presets Grid */}
      {showPresets && mode === 'range' && (
        <div className="mt-4 pt-3 border-t border-theme-divider space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
            Timeframe Presets
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'THIS_WEEK', label: 'This Week' },
              { key: 'THIS_MONTH', label: 'This Month' },
              { key: 'LAST_MONTH', label: 'Last Month' },
              { key: 'THIS_YEAR', label: 'This Year' },
              { key: 'LAST_90_DAYS', label: 'Last 90 Days' },
              { key: 'ALL', label: 'All Time' },
            ].map((p) => {
              const isActive = selectedPresetKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetClick(p.key)}
                  className={cn(
                    'rounded-xl border px-2 py-2 text-center text-[11px] font-medium transition-all duration-150',
                    isActive
                      ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold shadow-md shadow-violet-900/30 scale-[1.02]'
                      : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:bg-theme-card-hover hover:text-theme-primary active:scale-95'
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Done / Confirm Button */}
      {onClose && (
        <div className="mt-3 pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-900/30 hover:bg-violet-500 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
