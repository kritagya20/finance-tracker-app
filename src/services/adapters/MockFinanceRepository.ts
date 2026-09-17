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
      id: 'tx_starbucks',
      accountId: 'acc_hdfc',
      categoryId: 'cat_dining',
      type: 'EXPENSE',
      amount: 28000, // ₹280.00
      currency: 'INR',
      merchantName: 'Starbucks',
      date: new Date().toISOString(),
      source: 'AUTO_SMS',
      rawSmsText: 'Sent Rs.280.00 from HDFC Bank A/C **4102 to STARBUCKS',
      notes: 'Coffee & snack',
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
      updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    },
    {
      id: 'tx_uber_today',
      accountId: 'acc_hdfc',
      categoryId: 'cat_fuel',
      type: 'EXPENSE',
      amount: 45000, // ₹450.00
      currency: 'INR',
      merchantName: 'Uber Ride',
      date: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
      source: 'AUTO_SMS',
      rawSmsText: 'Debited Rs.450.00 at UBER TRIP',
      notes: 'Morning commute',
      createdAt: Date.now() - 1000 * 60 * 60 * 7,
      updatedAt: Date.now() - 1000 * 60 * 60 * 7,
    },
    {
      id: 'tx_amazon_yesterday',
      accountId: 'acc_hdfc',
      categoryId: 'cat_shopping',
      type: 'EXPENSE',
      amount: 120000, // ₹1,200.00
      currency: 'INR',
      merchantName: 'Amazon India',
      date: new Date(Date.now() - 86400000).toISOString(),
      source: 'MANUAL',
      notes: 'Home essentials (2 items)',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'tx_freelance_12sep',
      accountId: 'acc_hdfc',
      categoryId: 'cat_freelance',
      type: 'INCOME',
      amount: 1500000, // ₹15,000.00
      currency: 'INR',
      merchantName: 'Freelance Payment',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      source: 'MANUAL',
      notes: 'UI/UX consulting project',
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'tx_salary',
      accountId: 'acc_hdfc',
      categoryId: 'cat_salary',
      type: 'INCOME',
      amount: 8500000, // ₹85,000.00
      currency: 'INR',
      merchantName: 'Salary Deposit',
      date: new Date(Date.now() - 86400000 * 15).toISOString(),
      source: 'MANUAL',
      notes: 'Monthly corporate salary',
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'tx_electricity',
      accountId: 'acc_hdfc',
      categoryId: 'cat_bills',
      type: 'EXPENSE',
      amount: 185000, // ₹1,850.00
      currency: 'INR',
      merchantName: 'Electricity Bill',
      date: new Date(Date.now() - 86400000 * 18).toISOString(),
      source: 'MANUAL',
      notes: 'Power utilities payment',
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now() - 86400000 * 18,
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
    const monthlyIncome = 10000000; // ₹1,00,000.00
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
