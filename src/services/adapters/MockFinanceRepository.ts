import {
  Account,
  Budget,
  Category,
  FinanceSummary,
  Transaction,
  UserProfile,
} from '../../domain/models/types';
import { IFinanceRepository, TransactionFilter } from '../contracts/IFinanceRepository';
import { MockApiClient } from '../../data/data';

/**
 * MockFinanceRepository delegates to the centralized MockApiClient & data.ts store.
 * Changes persist automatically across the application in localStorage.
 */
export class MockFinanceRepository implements IFinanceRepository {
  async getSummary(): Promise<FinanceSummary> {
    const res = await MockApiClient.getSummary();
    return res.data;
  }

  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    const res = await MockApiClient.getTransactions();
    let txs = res.data;

    if (filter) {
      if (filter.type) {
        txs = txs.filter((t) => t.type === filter.type);
      }
      if (filter.categoryId) {
        txs = txs.filter((t) => t.categoryId === filter.categoryId);
      }
      if (filter.source) {
        txs = txs.filter((t) => t.source === filter.source);
      }
      if (filter.query) {
        const q = filter.query.toLowerCase();
        txs = txs.filter(
          (t) =>
            t.merchantName.toLowerCase().includes(q) ||
            (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
      if (filter.limit) {
        txs = txs.slice(0, filter.limit);
      }
    }

    return txs;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const res = await MockApiClient.getTransactions();
    return res.data.find((t) => t.id === id) || null;
  }

  async addTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> {
    const res = await MockApiClient.addTransaction(tx);
    return res.data;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const res = await MockApiClient.updateTransaction(id, updates);
    return res.data;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const res = await MockApiClient.deleteTransaction(id);
    return res.success;
  }

  async getAccounts(): Promise<Account[]> {
    const res = await MockApiClient.getAccounts();
    return res.data;
  }

  async getCategories(): Promise<Category[]> {
    const res = await MockApiClient.getCategories();
    return res.data;
  }

  async getBudgets(): Promise<Budget[]> {
    const res = await MockApiClient.getBudgets();
    return res.data;
  }

  async getProfile(): Promise<UserProfile> {
    const res = await MockApiClient.getProfile();
    return res.data;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await MockApiClient.updateProfile(updates);
    return res.data;
  }
}

export const financeRepository = new MockFinanceRepository();
