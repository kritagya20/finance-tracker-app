/**
 * Integer-based money representation in the lowest currency unit (e.g., paise or cents).
 * For example: 10050 represents ₹100.50.
 * Eliminates floating point drift across the entire application.
 */
export type IntegerMoney = number;

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type TransactionSource = 'MANUAL' | 'AUTO_SMS' | 'CSV_IMPORT';
export type AccountType = 'CASH' | 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT';

export interface SplitItem {
  id: string;
  categoryId: string;
  amount: IntegerMoney;
  note?: string;
}

export interface SplitParticipant {
  id: string;
  name: string;
  avatar?: string;
  amount: IntegerMoney;      // Share in paise
  isPaidByMe: boolean;       // True if current user paid
}

export interface SplitDetails {
  splitType: 'EQUAL' | 'EXACT';
  totalAmount: IntegerMoney;
  myShare: IntegerMoney;
  lentAmount: IntegerMoney;
  participants: SplitParticipant[];
}

export interface FriendContact {
  id: string;
  name: string;
  avatar?: string;
  emailOrPhone?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: IntegerMoney;
  currency: string;             // ISO 4217 code, e.g. "INR"
  merchantName: string;
  date: string;                 // ISO 8601 string (e.g. "2026-09-16T20:30:00.000Z")
  source: TransactionSource;
  notes?: string;
  isSplit?: boolean;
  splitDetails?: SplitDetails;
  splits?: SplitItem[];
  rawSmsText?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  currentBalance: IntegerMoney;
  maskNumber?: string;          // e.g. "4102"
  institutionName?: string;     // e.g. "HDFC Bank"
  color?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;             // Lucide icon identifier
  colorHex: string;             // Theme color
  bgClass: string;              // Tailwind class (e.g. "bg-orange-500/15")
  textClass: string;            // Tailwind class (e.g. "text-orange-400")
  isIncome?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: IntegerMoney;
  period: 'MONTHLY' | 'WEEKLY';
  alertThresholdPercent: number; // e.g. 80
}

export interface FinanceSummary {
  totalBalance: IntegerMoney;
  monthlyIncome: IntegerMoney;
  monthlySpent: IntegerMoney;
  monthlyBudgetLimit: IntegerMoney;
  monthlyBudgetSpent: IntegerMoney;
  budgetUsedPercent: number;
  budgetRemaining: IntegerMoney;
}

export type DatePreset =
  | 'ALL'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_60_DAYS'
  | 'LAST_90_DAYS'
  | 'THIS_YEAR'
  | 'CUSTOM';
export type FilterType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface ActivityFilterState {
  type: FilterType;
  datePreset: DatePreset;
  startDate?: string;
  endDate?: string;
  categoryIds: string[];
  source: 'ALL' | 'AUTO_SMS' | 'MANUAL';
}

export type FinancialGoal =
  | 'EMERGENCY_FUND'
  | 'SAVINGS_INVESTING'
  | 'EXPENSE_CONTROL'
  | 'DEBT_FREE';

export type EmploymentType = 'SALARIED' | 'FREELANCE_BUSINESS' | 'STUDENT_OTHER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  currencySymbol: string;
  monthlyIncome: IntegerMoney;
  primaryGoal: FinancialGoal;
  employmentType: EmploymentType;
  savingsTargetPercent: number;
  budgetStartDay: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialInsightItem {
  id: string;
  type: 'POSITIVE' | 'WARNING' | 'NEUTRAL';
  title: string;
  description: string;
  metric?: string;
}

export interface FinancialInsights {
  savingsRate: number;
  savingsTargetPercent: number;
  emergencyFundMonths: number;
  burnRatePerDay: IntegerMoney;
  runwayDays: number;
  budgetAdherenceScore: number;
  needsVsWantsRatio: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };
  keyInsights: FinancialInsightItem[];
}

