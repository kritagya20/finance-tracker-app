import { Transaction, ActivityFilterState } from '../models/types';

export const INITIAL_FILTER_STATE: ActivityFilterState = {
  type: 'ALL',
  datePreset: 'ALL',
  categoryIds: [],
  source: 'ALL',
};

/**
 * Pure function to filter transactions based on search query and structured filter criteria.
 */
export function filterTransactions(
  transactions: Transaction[],
  filter: ActivityFilterState,
  searchQuery = ''
): Transaction[] {
  const query = searchQuery.trim().toLowerCase();
  const now = new Date();

  return transactions.filter((tx) => {
    // 1. Search Query
    if (query) {
      const matchMerchant = tx.merchantName.toLowerCase().includes(query);
      const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
      if (!matchMerchant && !matchNotes) return false;
    }

    // 2. Transaction Type (Debit = EXPENSE, Credit = INCOME)
    if (filter.type !== 'ALL' && tx.type !== filter.type) {
      return false;
    }

    // 3. Source (Auto-SMS vs Manual)
    if (filter.source !== 'ALL' && tx.source !== filter.source) {
      return false;
    }

    // 4. Categories (Multi-select)
    if (filter.categoryIds.length > 0 && !filter.categoryIds.includes(tx.categoryId)) {
      return false;
    }

    // 5. Date-wise filtering
    const txDate = new Date(tx.date);

    if (filter.datePreset === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      if (txDate < startOfWeek || txDate > endOfWeek) return false;
    } else if (filter.datePreset === 'LAST_WEEK') {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endOfLastWeek = new Date(startOfThisWeek.getTime() - 1);
      if (txDate < startOfLastWeek || txDate > endOfLastWeek) return false;
    } else if (filter.datePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      if (txDate < startOfMonth || txDate > endOfMonth) return false;
    } else if (filter.datePreset === 'LAST_MONTH') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      if (txDate < startOfLastMonth || txDate > endOfLastMonth) return false;
    } else if (filter.datePreset === 'LAST_60_DAYS') {
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      sixtyDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (txDate < sixtyDaysAgo || txDate > endOfToday) return false;
    } else if (filter.datePreset === 'LAST_90_DAYS') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (txDate < ninetyDaysAgo || txDate > endOfToday) return false;
    } else if (filter.datePreset === 'THIS_YEAR') {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      if (txDate < startOfYear || txDate > endOfYear) return false;
    } else if (filter.datePreset === 'CUSTOM') {
      if (filter.startDate) {
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }

    return true;
  });
}

/**
 * Computes human-readable summary of active filters count
 */
export function getActiveFilterCount(filter: ActivityFilterState): number {
  let count = 0;
  if (filter.type !== 'ALL') count++;
  if (filter.datePreset !== 'ALL') count++;
  if (filter.categoryIds.length > 0) count += filter.categoryIds.length;
  if (filter.source !== 'ALL') count++;
  return count;
}
