/**
 * Standardized Date Formatting Utilities for Finance Tracker.
 * Absolute Rule: All dates displayed in the UI MUST be in strictly DD-MM-YYYY format (e.g. 23-09-2026).
 */

/**
 * Format any Date object, ISO timestamp, or date string to strict DD-MM-YYYY format.
 * Examples:
 * - '2026-09-23' -> '23-09-2026'
 * - '2026-09-23T10:30:00Z' -> '23-09-2026'
 * - new Date(2026, 8, 23) -> '23-09-2026'
 */
export function formatDateDDMMYYYY(value: Date | string | number | null | undefined): string {
  if (!value) return '—';

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    // Avoid UTC timezone shifts on plain YYYY-MM-DD dates
    const [y, m, d] = value.trim().split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format a Date to strict DD-MM-YYYY, hh:mm A format (e.g. 23-09-2026, 10:24 PM).
 */
export function formatDateTimeDDMMYYYY(value: Date | string | number | null | undefined): string {
  if (!value) return '—';

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '—';

  const datePart = formatDateDDMMYYYY(date);
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Format a date range in strict DD-MM-YYYY – DD-MM-YYYY format.
 */
export function formatDateRangeDDMMYYYY(
  start: Date | string | number,
  end: Date | string | number
): string {
  const startStr = formatDateDDMMYYYY(start);
  const endStr = formatDateDDMMYYYY(end);
  return `${startStr} – ${endStr}`;
}

/**
 * Format transaction date with optional contextual label (Today / Yesterday)
 * while preserving the mandatory DD-MM-YYYY representation.
 * Examples:
 * - 'Today (23-09-2026)'
 * - 'Yesterday (22-09-2026)'
 * - '21-09-2026'
 */
export function formatContextualDateDDMMYYYY(
  value: Date | string | number,
  includeContext = true
): string {
  const dateStr = formatDateDDMMYYYY(value);
  if (dateStr === '—') return '—';

  if (!includeContext) return dateStr;

  const now = new Date();
  const todayStr = formatDateDDMMYYYY(now);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = formatDateDDMMYYYY(yesterday);

  if (dateStr === todayStr) {
    return `Today (${dateStr})`;
  }
  if (dateStr === yesterdayStr) {
    return `Yesterday (${dateStr})`;
  }

  return dateStr;
}
