import {
  Account,
  Budget,
  Category,
  FinanceSummary,
  Transaction,
} from '../../domain/models/types';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { IFinanceRepository, TransactionFilter } from '../contracts/IFinanceRepository';

export class MockFinanceRepository implements IFinanceRepository {
  private accounts: Account[] = [
    {
      id: 'acc_hdfc',
      name: 'HDFC Bank',
      type: 'SAVINGS',
      currency: 'INR',
      currentBalance: 9545000,
      maskNumber: '4102',
      institutionName: 'HDFC Bank',
      isActive: true,
    },
    {
      id: 'acc_cash',
      name: 'Cash Wallet',
      type: 'CASH',
      currency: 'INR',
      currentBalance: 1240000,
      maskNumber: 'CASH',
      institutionName: 'Physical Cash',
      isActive: true,
    },
    {
      id: 'acc_icici',
      name: 'ICICI Amazon Pay Card',
      type: 'CREDIT_CARD',
      currency: 'INR',
      currentBalance: -1500000,
      maskNumber: '8819',
      institutionName: 'ICICI Bank',
      isActive: true,
    },
  ];

  private transactions: Transaction[] = [
    {
      id: 'tx_1',
      accountId: 'acc_hdfc',
      categoryId: 'cat_dining',
      type: 'EXPENSE',
      amount: 45000, // ₹450.00
      currency: 'INR',
      merchantName: 'Swiggy',
      date: new Date().toISOString(),
      source: 'AUTO_SMS',
      rawSmsText: 'Sent Rs.450.00 from HDFC Bank A/C **4102 to SWIGGY on 16-Sep-26',
      notes: 'Dinner with friends',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
      id: 'tx_2',
      accountId: 'acc_hdfc',
      categoryId: 'cat_salary',
      type: 'INCOME',
      amount: 8500000, // ₹85,000.00
      currency: 'INR',
      merchantName: 'Salary Deposit',
      date: new Date(Date.now() - 86400000).toISOString(),
      source: 'MANUAL',
      notes: 'Monthly corporate salary',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'tx_3',
      accountId: 'acc_hdfc',
      categoryId: 'cat_fuel',
      type: 'EXPENSE',
      amount: 28000, // ₹280.00
      currency: 'INR',
      merchantName: 'Uber',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      source: 'AUTO_SMS',
      rawSmsText: 'Debited Rs.280.00 at UBER TRIP MUMBAI',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'tx_4',
      accountId: 'acc_hdfc',
      categoryId: 'cat_bills',
      type: 'EXPENSE',
      amount: 185000, // ₹1,850.00
      currency: 'INR',
      merchantName: 'Electricity Bill',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      source: 'MANUAL',
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 4,
    },
  ];

  private budgets: Budget[] = [
    {
      id: 'b_overall',
      categoryId: 'all',
      limitAmount: 5000000, // ₹50,000.00
      period: 'MONTHLY',
      alertThresholdPercent: 80,
    },
  ];

  async getSummary(): Promise<FinanceSummary> {
    const totalBalance = 14285000; // ₹1,42,850.00
    const monthlyIncome = 8500000; // ₹85,000.00
    const monthlySpent = 3215000;  // ₹32,150.00
    const monthlyBudgetLimit = 5000000; // ₹50,000.00
    const monthlyBudgetSpent = monthlySpent;
    const budgetUsedPercent = Math.round((monthlyBudgetSpent / monthlyBudgetLimit) * 100);
    const budgetRemaining = Math.max(0, monthlyBudgetLimit - monthlyBudgetSpent);

    return {
      totalBalance,
      monthlyIncome,
      monthlySpent,
      monthlyBudgetLimit,
      monthlyBudgetSpent,
      budgetUsedPercent,
      budgetRemaining,
    };
  }

  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    let result = [...this.transactions];

    if (filter?.type) {
      result = result.filter((t) => t.type === filter.type);
    }
    if (filter?.categoryId) {
      result = result.filter((t) => t.categoryId === filter.categoryId);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchantName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.find((t) => t.id === id) || null;
  }

  async addTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.transactions.unshift(newTx);
    return newTx;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const initialLen = this.transactions.length;
    this.transactions = this.transactions.filter((t) => t.id !== id);
    return this.transactions.length < initialLen;
  }

  async getAccounts(): Promise<Account[]> {
    return [...this.accounts];
  }

  async getCategories(): Promise<Category[]> {
    return [...DEFAULT_CATEGORIES];
  }

  async getBudgets(): Promise<Budget[]> {
    return [...this.budgets];
  }
}
