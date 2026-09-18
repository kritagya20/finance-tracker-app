import {
  Account,
  Budget,
  Category,
  FinanceSummary,
  FinancialInsights,
  Transaction,
  UserProfile,
} from '../domain/models/types';
import { DEFAULT_CATEGORIES } from '../domain/engine/categories';

/**
 * Standard REST API Envelope matching future backend endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    totalCount?: number;
    [key: string]: unknown;
  };
}

export function createApiResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  message?: string,
  statusCode = 200
): ApiResponse<T> {
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data,
    meta,
  };
}

// -------------------------------------------------------------
// 1. SEED USER PROFILE
// -------------------------------------------------------------
export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@domain.com',
  currency: 'INR',
  currencySymbol: '₹',
  monthlyIncome: 8500000, // ₹85,000.00
  primaryGoal: 'SAVINGS_INVESTING',
  employmentType: 'SALARIED',
  savingsTargetPercent: 20,
  budgetStartDay: 1,
  onboardingCompleted: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-17T00:00:00.000Z',
};

// -------------------------------------------------------------
// 2. SEED ACCOUNTS
// -------------------------------------------------------------
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_hdfc',
    name: 'HDFC Bank',
    type: 'SAVINGS',
    currency: 'INR',
    currentBalance: 9545000, // ₹95,450.00
    maskNumber: '4102',
    institutionName: 'HDFC Bank',
    isActive: true,
  },
  {
    id: 'acc_cash',
    name: 'Cash Wallet',
    type: 'CASH',
    currency: 'INR',
    currentBalance: 1240000, // ₹12,400.00
    maskNumber: 'CASH',
    institutionName: 'Physical Cash',
    isActive: true,
  },
  {
    id: 'acc_icici',
    name: 'ICICI Amazon Pay Card',
    type: 'CREDIT_CARD',
    currency: 'INR',
    currentBalance: -1500000, // -₹15,000.00
    maskNumber: '8819',
    institutionName: 'ICICI Bank',
    isActive: true,
  },
];

// -------------------------------------------------------------
// 3. SEED CATEGORIES
// -------------------------------------------------------------
export const INITIAL_CATEGORIES: Category[] = DEFAULT_CATEGORIES;

// -------------------------------------------------------------
// 4. SEED TRANSACTIONS (28 items matching live reference)
// -------------------------------------------------------------
const now = Date.now();
const oneHour = 1000 * 60 * 60;
const oneDay = 1000 * 60 * 60 * 24;

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // TODAY
  {
    id: 'tx_starbucks_today',
    accountId: 'acc_hdfc',
    categoryId: 'cat_dining',
    type: 'EXPENSE',
    amount: 28000, // ₹280.00
    currency: 'INR',
    merchantName: 'Starbucks',
    date: new Date(now - oneHour * 3).toISOString(),
    source: 'AUTO_SMS',
    rawSmsText: 'Sent Rs.280.00 from HDFC Bank A/C **4102 to STARBUCKS',
    notes: 'Coffee & snack',
    createdAt: now - oneHour * 3,
    updatedAt: now - oneHour * 3,
  },
  {
    id: 'tx_uber_today',
    accountId: 'acc_hdfc',
    categoryId: 'cat_fuel',
    type: 'EXPENSE',
    amount: 45000, // ₹450.00
    currency: 'INR',
    merchantName: 'Uber Ride',
    date: new Date(now - oneHour * 7).toISOString(),
    source: 'AUTO_SMS',
    rawSmsText: 'Debited Rs.450.00 at UBER TRIP',
    notes: 'Morning commute',
    createdAt: now - oneHour * 7,
    updatedAt: now - oneHour * 7,
  },

  // YESTERDAY
  {
    id: 'tx_amazon_yesterday',
    accountId: 'acc_hdfc',
    categoryId: 'cat_shopping',
    type: 'EXPENSE',
    amount: 120000, // ₹1,200.00
    currency: 'INR',
    merchantName: 'Amazon India',
    date: new Date(now - oneDay).toISOString(),
    source: 'MANUAL',
    notes: 'Home essentials (2 items)',
    createdAt: now - oneDay,
    updatedAt: now - oneDay,
  },

  // 12 SEPTEMBER
  {
    id: 'tx_freelance_12sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_freelance',
    type: 'INCOME',
    amount: 1500000, // ₹15,000.00
    currency: 'INR',
    merchantName: 'Freelance Payment',
    date: new Date(now - oneDay * 5).toISOString(),
    source: 'MANUAL',
    notes: 'UI/UX consulting project',
    createdAt: now - oneDay * 5,
    updatedAt: now - oneDay * 5,
  },
  {
    id: 'tx_swiggy_12sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_dining',
    type: 'EXPENSE',
    amount: 68000, // ₹680.00
    currency: 'INR',
    merchantName: 'Swiggy Gourmet',
    date: new Date(now - oneDay * 5 - oneHour * 2).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Dinner with friends',
    createdAt: now - oneDay * 5 - oneHour * 2,
    updatedAt: now - oneDay * 5 - oneHour * 2,
  },
  {
    id: 'tx_blinkit_12sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_groceries',
    type: 'EXPENSE',
    amount: 84000, // ₹840.00
    currency: 'INR',
    merchantName: 'Blinkit Instant',
    date: new Date(now - oneDay * 5 - oneHour * 5).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Weekly fresh groceries',
    createdAt: now - oneDay * 5 - oneHour * 5,
    updatedAt: now - oneDay * 5 - oneHour * 5,
  },

  // 10 SEPTEMBER
  {
    id: 'tx_netflix_10sep',
    accountId: 'acc_icici',
    categoryId: 'cat_entertainment',
    type: 'EXPENSE',
    amount: 64900, // ₹649.00
    currency: 'INR',
    merchantName: 'Netflix India',
    date: new Date(now - oneDay * 7).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Premium 4K plan',
    createdAt: now - oneDay * 7,
    updatedAt: now - oneDay * 7,
  },
  {
    id: 'tx_shell_fuel_10sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_fuel',
    type: 'EXPENSE',
    amount: 250000, // ₹2,500.00
    currency: 'INR',
    merchantName: 'Shell Petrol Pump',
    date: new Date(now - oneDay * 7 - oneHour * 3).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Full tank petrol',
    createdAt: now - oneDay * 7 - oneHour * 3,
    updatedAt: now - oneDay * 7 - oneHour * 3,
  },

  // 08 SEPTEMBER
  {
    id: 'tx_electricity_08sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_bills',
    type: 'EXPENSE',
    amount: 345000, // ₹3,450.00
    currency: 'INR',
    merchantName: 'Bescom Electricity',
    date: new Date(now - oneDay * 9).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Monthly electricity bill',
    createdAt: now - oneDay * 9,
    updatedAt: now - oneDay * 9,
  },
  {
    id: 'tx_cultfit_08sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_entertainment',
    type: 'EXPENSE',
    amount: 180000, // ₹1,800.00
    currency: 'INR',
    merchantName: 'Cult.fit Gym',
    date: new Date(now - oneDay * 9 - oneHour * 4).toISOString(),
    source: 'MANUAL',
    notes: 'Gym subscription renewal',
    createdAt: now - oneDay * 9 - oneHour * 4,
    updatedAt: now - oneDay * 9 - oneHour * 4,
  },

  // 05 SEPTEMBER
  {
    id: 'tx_zara_05sep',
    accountId: 'acc_icici',
    categoryId: 'cat_shopping',
    type: 'EXPENSE',
    amount: 499000, // ₹4,990.00
    currency: 'INR',
    merchantName: 'Zara Apparel',
    date: new Date(now - oneDay * 12).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Autumn wardrobe',
    createdAt: now - oneDay * 12,
    updatedAt: now - oneDay * 12,
  },
  {
    id: 'tx_blue_tokai_05sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_dining',
    type: 'EXPENSE',
    amount: 32000, // ₹320.00
    currency: 'INR',
    merchantName: 'Blue Tokai Coffee',
    date: new Date(now - oneDay * 12 - oneHour * 2).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Iced latte',
    createdAt: now - oneDay * 12 - oneHour * 2,
    updatedAt: now - oneDay * 12 - oneHour * 2,
  },

  // 01 SEPTEMBER (Payday & Major Expenses)
  {
    id: 'tx_salary_01sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_salary',
    type: 'INCOME',
    amount: 7000000, // ₹70,000.00
    currency: 'INR',
    merchantName: 'TechCorp Salary',
    date: new Date(now - oneDay * 16).toISOString(),
    source: 'AUTO_SMS',
    notes: 'Monthly salary credited',
    createdAt: now - oneDay * 16,
    updatedAt: now - oneDay * 16,
  },
  {
    id: 'tx_rent_01sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_bills',
    type: 'EXPENSE',
    amount: 1500000, // ₹15,000.00
    currency: 'INR',
    merchantName: 'Apartment House Rent',
    date: new Date(now - oneDay * 16 - oneHour).toISOString(),
    source: 'MANUAL',
    notes: 'Monthly flat rent transfer',
    createdAt: now - oneDay * 16 - oneHour,
    updatedAt: now - oneDay * 16 - oneHour,
  },
  {
    id: 'tx_wifi_01sep',
    accountId: 'acc_hdfc',
    categoryId: 'cat_bills',
    type: 'EXPENSE',
    amount: 119900, // ₹1,199.00
    currency: 'INR',
    merchantName: 'Airtel Fiber Broadband',
    date: new Date(now - oneDay * 16 - oneHour * 3).toISOString(),
    source: 'AUTO_SMS',
    notes: 'High speed fiber bill',
    createdAt: now - oneDay * 16 - oneHour * 3,
    updatedAt: now - oneDay * 16 - oneHour * 3,
  },
];

// -------------------------------------------------------------
// 5. SEED BUDGETS
// -------------------------------------------------------------
export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bgt_overall',
    categoryId: 'ALL',
    limitAmount: 5000000, // ₹50,000.00
    period: 'MONTHLY',
    alertThresholdPercent: 80,
  },
  {
    id: 'bgt_dining',
    categoryId: 'cat_dining',
    limitAmount: 1000000, // ₹10,000.00
    period: 'MONTHLY',
    alertThresholdPercent: 80,
  },
  {
    id: 'bgt_fuel',
    categoryId: 'cat_fuel',
    limitAmount: 600000, // ₹6,000.00
    period: 'MONTHLY',
    alertThresholdPercent: 80,
  },
];

// -------------------------------------------------------------
// 6. SEED FINANCIAL INSIGHTS (Future Analysis Engine Output)
// -------------------------------------------------------------
export const INITIAL_INSIGHTS: FinancialInsights = {
  savingsRate: 38.5,
  savingsTargetPercent: 20,
  emergencyFundMonths: 4.4,
  burnRatePerDay: 107166, // ₹1,071.66 / day
  runwayDays: 133,
  budgetAdherenceScore: 84,
  needsVsWantsRatio: {
    needsPercent: 48,
    wantsPercent: 24,
    savingsPercent: 28,
  },
  keyInsights: [
    {
      id: 'ins_01',
      type: 'POSITIVE',
      title: 'Strong Savings Cushion',
      description: 'You saved 38.5% of your income this month, outperforming your 20% target.',
      metric: '+18.5%',
    },
    {
      id: 'ins_02',
      type: 'WARNING',
      title: 'Dining Acceleration',
      description: 'Dining out is currently trending at 26% of your monthly expenditure.',
      metric: '₹7,280',
    },
    {
      id: 'ins_03',
      type: 'NEUTRAL',
      title: 'Emergency Fund Runway',
      description: 'Your current liquid assets cover 4.4 months of living expenses.',
      metric: '4.4 mo',
    },
  ],
};

// -------------------------------------------------------------
// 7. CENTRAL REPOSITORY STATE & LOCALSTORAGE PERSISTENCE
// -------------------------------------------------------------
export interface MockDatabaseState {
  profile: UserProfile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  insights: FinancialInsights;
}

import seedData from './seedData.json';

export const SEED_DATA: MockDatabaseState = seedData as MockDatabaseState;

const STORAGE_KEY = 'finance_tracker_mock_db_v1';

/**
 * Load database state from localStorage or initialize with seed defaults from seedData.json
 */
export function getMockDatabase(): MockDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabaseState;
      if (parsed && parsed.transactions && parsed.profile) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read database from localStorage, using seeds:', err);
  }

  const defaultState: MockDatabaseState = {
    profile: SEED_DATA.profile,
    accounts: SEED_DATA.accounts,
    categories: SEED_DATA.categories,
    transactions: SEED_DATA.transactions,
    budgets: SEED_DATA.budgets,
    insights: SEED_DATA.insights,
  };

  saveMockDatabase(defaultState);
  return defaultState;
}

/**
 * Persist database state to localStorage
 */
export function saveMockDatabase(state: MockDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

/**
 * Reset database state to pristine initial seed data from seedData.json
 */
export function resetMockDatabase(): MockDatabaseState {
  const defaultState: MockDatabaseState = {
    profile: { ...SEED_DATA.profile },
    accounts: [...SEED_DATA.accounts],
    categories: [...SEED_DATA.categories],
    transactions: [...SEED_DATA.transactions],
    budgets: [...SEED_DATA.budgets],
    insights: { ...SEED_DATA.insights },
  };
  saveMockDatabase(defaultState);
  return defaultState;
}

// -------------------------------------------------------------
// 8. SIMULATED REST API CLIENT (Consumable by UI & Repositories)
// -------------------------------------------------------------
export const MockApiClient = {
  // --- Profile ---
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const db = getMockDatabase();
    return createApiResponse(db.profile, undefined, 'User profile fetched successfully');
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const db = getMockDatabase();
    db.profile = {
      ...db.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveMockDatabase(db);
    return createApiResponse(db.profile, undefined, 'User profile updated successfully');
  },

  // --- Transactions ---
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    const db = getMockDatabase();
    const totalSpent = db.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = db.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    return createApiResponse(db.transactions, {
      totalCount: db.transactions.length,
      totalSpent,
      totalIncome,
    });
  },

  async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>> {
    const db = getMockDatabase();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.transactions.unshift(newTx);
    saveMockDatabase(db);
    return createApiResponse(newTx, undefined, 'Transaction added successfully', 201);
  },

  async deleteTransaction(id: string): Promise<ApiResponse<{ id: string }>> {
    const db = getMockDatabase();
    db.transactions = db.transactions.filter((t) => t.id !== id);
    saveMockDatabase(db);
    return createApiResponse({ id }, undefined, 'Transaction deleted successfully');
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    const db = getMockDatabase();
    const idx = db.transactions.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error(`Transaction with id "${id}" not found`);
    }
    const updated: Transaction = {
      ...db.transactions[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    db.transactions[idx] = updated;
    saveMockDatabase(db);
    return createApiResponse(updated, undefined, 'Transaction updated successfully');
  },

  // --- Accounts ---
  async getAccounts(): Promise<ApiResponse<Account[]>> {
    const db = getMockDatabase();
    return createApiResponse(db.accounts);
  },

  // --- Categories ---
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const db = getMockDatabase();
    return createApiResponse(db.categories);
  },

  // --- Budgets ---
  async getBudgets(): Promise<ApiResponse<Budget[]>> {
    const db = getMockDatabase();
    return createApiResponse(db.budgets);
  },

  // --- Financial Insights ---
  async getInsights(): Promise<ApiResponse<FinancialInsights>> {
    const db = getMockDatabase();
    return createApiResponse(db.insights);
  },

  // --- Summary ---
  async getSummary(): Promise<ApiResponse<FinanceSummary>> {
    const db = getMockDatabase();
    const totalBalance = db.accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const monthlyTxs = db.transactions.filter((t) => {
      const d = new Date(t.date).getTime();
      return d >= startOfMonth && d <= endOfMonth;
    });

    const monthlyIncome = monthlyTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySpent = monthlyTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBudgetLimit = db.budgets.find((b) => b.categoryId === 'ALL')?.limitAmount || 5000000;
    const budgetRemaining = Math.max(0, monthlyBudgetLimit - monthlySpent);
    const budgetUsedPercent =
      monthlyBudgetLimit > 0 ? Math.min(100, Math.round((monthlySpent / monthlyBudgetLimit) * 100)) : 0;

    const summary: FinanceSummary = {
      totalBalance,
      monthlyIncome,
      monthlySpent,
      monthlyBudgetLimit,
      monthlyBudgetSpent: monthlySpent,
      budgetUsedPercent,
      budgetRemaining,
    };

    return createApiResponse(summary);
  },
};

