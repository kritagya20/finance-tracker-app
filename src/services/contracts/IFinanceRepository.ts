import {
  Account,
  Budget,
  Category,
  FinanceSummary,
  Transaction,
  TransactionType,
  UserProfile,
} from '../../domain/models/types';

export interface TransactionFilter {
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  query?: string;
  source?: string;
}

export interface IFinanceRepository {
  getSummary(): Promise<FinanceSummary>;
  getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  addTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  getAccounts(): Promise<Account[]>;
  getCategories(): Promise<Category[]>;
  getBudgets(): Promise<Budget[]>;
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
}

