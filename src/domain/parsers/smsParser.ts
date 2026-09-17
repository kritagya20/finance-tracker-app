import { IntegerMoney, TransactionType } from '../models/types';

export interface ParsedSmsResult {
  success: boolean;
  amount: IntegerMoney;
  type: TransactionType;
  merchantName: string;
  accountMask?: string;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  rawSmsText: string;
}

export interface SmsTemplate {
  label: string;
  smsText: string;
}

export const SAMPLE_SMS_TEMPLATES: SmsTemplate[] = [
  {
    label: 'Swiggy Food Delivery (₹480)',
    smsText: 'Sent Rs.480.00 from HDFC Bank A/C **4102 to SWIGGY on 17-Sep-26. UPI Ref: 6291048821.',
  },
  {
    label: 'Amazon Shopping (₹1,499)',
    smsText: 'Debited Rs.1,499.00 from ICICI Card **8819 at AMAZON INDIA on 17-Sep-26. Avl Lmt: Rs.83,501.',
  },
  {
    label: 'Uber Ride (₹320)',
    smsText: 'Debited Rs.320.00 from HDFC Bank A/C **4102 at UBER INDIA on 18-Sep-26. Avl Bal: Rs.94,650.',
  },
  {
    label: 'Salary Credit (₹85,000)',
    smsText: 'INR 85,000.00 credited to HDFC Bank A/C **4102 on 01-Sep-26 by TECHCORP SOLUTIONS PAYROLL. Ref: SAL7721.',
  },
  {
    label: 'Electricity Utility Bill (₹2,150)',
    smsText: 'Paid Rs.2,150.00 from HDFC Bank A/C **4102 to BESCOM ELECTRICITY on 15-Sep-26. Transaction Successful.',
  },
];

export function parseBankSms(text: string): ParsedSmsResult {
  const trimmed = text.trim();

  // 1. Detect Type (Credit vs Debit)
  const isCredit =
    /(?:credited|deposited|received|refund)/i.test(trimmed) &&
    !/(?:debited|spent|paid|sent)/i.test(trimmed);
  const type: TransactionType = isCredit ? 'INCOME' : 'EXPENSE';

  // 2. Extract Amount
  // Matches "Rs. 450.00", "Rs.450", "INR 1,250.00", "INR 85,000"
  let amountPaise = 0;
  const amountMatch = trimmed.match(/(?:Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const rawVal = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(rawVal)) {
      amountPaise = Math.round(rawVal * 100);
    }
  }

  // 3. Extract Account Mask
  let accountMask = '4102';
  const accMatch = trimmed.match(/(?:\*{2}|ending\s+|A\/C\s*(?:ending\s*)?|Card\s*(?:\*{2})?)([0-9]{4})/i);
  if (accMatch && accMatch[1]) {
    accountMask = accMatch[1];
  }

  // 4. Extract Merchant Name / Counterparty
  let merchantName = isCredit ? 'Payroll / Deposit' : 'Merchant Payee';
  
  const toMatch = trimmed.match(/(?:to|at|towards|by)\s+([A-Za-z0-9\s&'-]+?)(?:\s+(?:on|via|ref|upi|avl|bal|\.))/i);
  if (toMatch && toMatch[1]) {
    merchantName = toMatch[1].trim();
  }

  // Clean merchant name if it picked up generic words
  if (merchantName.toLowerCase().startsWith('hdfc') || merchantName.toLowerCase().startsWith('icici')) {
    const secondaryMatch = trimmed.match(/(?:at|to|towards)\s+([A-Za-z0-9\s&'-]+?)(?:\s+(?:on|via|ref|avl|\.))/i);
    if (secondaryMatch && secondaryMatch[1]) {
      merchantName = secondaryMatch[1].trim();
    }
  }

  // Capitalize nicely
  merchantName = merchantName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // 5. Categorization heuristics
  let suggestedCategoryId = 'cat_other';
  let suggestedCategoryName = 'Other';

  const lower = trimmed.toLowerCase();
  if (isCredit || lower.includes('salary') || lower.includes('payroll')) {
    suggestedCategoryId = 'cat_salary';
    suggestedCategoryName = 'Salary & Income';
  } else if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('starbucks') || lower.includes('cafe') || lower.includes('food')) {
    suggestedCategoryId = 'cat_food';
    suggestedCategoryName = 'Food & Dining';
  } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('metro') || lower.includes('fuel') || lower.includes('petrol')) {
    suggestedCategoryId = 'cat_trans';
    suggestedCategoryName = 'Transport';
  } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('shopping')) {
    suggestedCategoryId = 'cat_shop';
    suggestedCategoryName = 'Shopping';
  } else if (lower.includes('bescom') || lower.includes('electricity') || lower.includes('airtel') || lower.includes('jio') || lower.includes('bill')) {
    suggestedCategoryId = 'cat_bills';
    suggestedCategoryName = 'Bills & Utilities';
  }

  return {
    success: amountPaise > 0,
    amount: amountPaise,
    type,
    merchantName: merchantName || (isCredit ? 'Income Deposit' : 'Card Transaction'),
    accountMask,
    suggestedCategoryId,
    suggestedCategoryName,
    rawSmsText: trimmed,
  };
}
