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
  updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  getAccounts(): Promise<Account[]>;
  addAccount(account: Omit<Account, 'id'>): Promise<Account>;
  deleteAccount(id: string): Promise<boolean>;
  getCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getBudgets(): Promise<Budget[]>;
  setCategoryBudget(categoryId: string, limitAmount: number): Promise<Budget | null>;
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
}

