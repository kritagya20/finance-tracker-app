import { useState, useEffect, useCallback } from 'react';
import { FinanceService } from '../services/FinanceService';
import {
  Account,
  Category,
  FinanceSummary,
  Transaction,
  UserProfile,
} from '../domain/models/types';

export function useFinance() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    return localStorage.getItem('hide_balances') === 'true';
  });

  const toggleHideBalances = useCallback(() => {
    setHideBalances((prev) => {
      const next = !prev;
      localStorage.setItem('hide_balances', String(next));
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const repo = FinanceService.getRepo();
      const [sumData, txData, accData, catData, profileData] = await Promise.all([
        repo.getSummary(),
        repo.getTransactions(),
        repo.getAccounts(),
        repo.getCategories(),
        repo.getProfile(),
      ]);
      setSummary(sumData);
      setTransactions(txData);
      setAccounts(accData);
      setCategories(catData);
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const repo = FinanceService.getRepo();
      const created = await repo.addTransaction(tx);
      await refreshData();
      return created;
    },
    [refreshData]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const repo = FinanceService.getRepo();
      const success = await repo.deleteTransaction(id);
      if (success) {
        await refreshData();
      }
      return success;
    },
    [refreshData]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const repo = FinanceService.getRepo();
      const updated = await repo.updateProfile(updates);
      setProfile(updated);
      await refreshData();
      return updated;
    },
    [refreshData]
  );

  return {
    summary,
    transactions,
    accounts,
    categories,
    profile,
    isLoading,
    hideBalances,
    toggleHideBalances,
    addTransaction,
    deleteTransaction,
    updateProfile,
    refreshData,
  };
}

