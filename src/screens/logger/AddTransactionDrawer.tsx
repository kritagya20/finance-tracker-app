import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Category,
  Transaction,
  TransactionType,
  Account,
  SplitItem,
} from '../../domain/models/types';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { CalendarPicker } from '../../components/common/CalendarPicker';
import { DrawerShell } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { AmountKeypad } from './AmountKeypad';
import { TransactionFormFields } from './TransactionFormFields';
import { CategoryPickerModal } from './CategoryPickerModal';
import { AccountPickerModal, AccountOptionItem } from './AccountPickerModal';
import { useCurrency } from '../../context/CurrencyContext';

export interface AddTransactionDrawerProps {
  isOpen: boolean;
  categories: Category[];
  accounts?: Account[];
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_ACCOUNTS: AccountOptionItem[] = [
  { id: 'acc_hdfc', name: 'HDFC Bank', mask: '4102' },
  { id: 'acc_icici', name: 'ICICI Amazon Card', mask: '8819' },
  { id: 'acc_cash', name: 'Cash Wallet', mask: 'CASH' },
];

/**
 * Standardized AddTransactionDrawer refactored with modular UI primitives:
 * DrawerShell, DrawerHeader, AmountKeypad, TransactionFormFields, CategoryPickerModal,
 * and AccountPickerModal.
 */
export const AddTransactionDrawer: React.FC<AddTransactionDrawerProps> = ({
  isOpen,
  categories,
  accounts = [],
  onSave,
  onClose,
}) => {
  const { currency, currencySymbol, numberingSystem } = useCurrency();

  // 2-Step Journey State (1 = Amount Keypad, 2 = Details & Categorization)
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{
    amount?: boolean;
    category?: boolean;
    account?: boolean;
    date?: boolean;
    splitBalance?: boolean;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sub-picker states ('category' | 'account' | 'date' | null)
  const [activePicker, setActivePicker] = useState<'category' | 'account' | 'date' | null>(null);

  const accountOptions = useMemo(() => (accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS), [accounts]);

  const resetForm = useCallback(() => {
    setStep(1);
    setType('EXPENSE');
    setAmountStr('0');
    setSelectedCategoryId('');
    setSelectedAccountId(accountOptions[0]?.id || '');
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setMerchantName('');
    setNotes('');
    setSplits([]);
    setActivePicker(null);
    setErrors({});
    setErrorMessage(null);
  }, [accountOptions]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const filteredCategories = useMemo(() => {
    if (type === 'INCOME') {
      return categories.filter((c) => !!c.isIncome);
    }
    if (type === 'EXPENSE') {
      return categories.filter((c) => !c.isIncome);
    }
    return categories;
  }, [categories, type]);

  const currentAccount = accountOptions.find((a) => a.id === selectedAccountId);
  const activeCategoryId = selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '');
  const currentCategory = filteredCategories.find((c) => c.id === activeCategoryId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dateDisplayLabel = !selectedDate
    ? 'Select Date'
    : selectedDate === todayStr
    ? `Today (${formatDateDDMMYYYY(selectedDate)})`
    : selectedDate === yesterdayStr
    ? `Yesterday (${formatDateDDMMYYYY(selectedDate)})`
    : formatDateDDMMYYYY(selectedDate);

  const activeAmount = parseKeypadToPaise(amountStr);
  const formattedRupees = (activeAmount / 100).toLocaleString(
    numberingSystem === 'indian' ? 'en-IN' : 'en-US',
    { maximumFractionDigits: 2 }
  );

  const isSplit = splits.length > 1 && type === 'EXPENSE';

  const handleProceedToDetails = () => {
    if (activeAmount <= 0) {
      setErrors({ amount: true });
      setErrorMessage('Please enter an amount to proceed');
      return;
    }
    setErrors({});
    setErrorMessage(null);
    setStep(2);
  };

  const handleSave = async () => {
    const newErrors: {
      amount?: boolean;
      category?: boolean;
      account?: boolean;
      date?: boolean;
      splitBalance?: boolean;
    } = {};
    const missing: string[] = [];

    if (activeAmount <= 0) {
      newErrors.amount = true;
      missing.push('amount');
    }
    if (!selectedAccountId) {
      newErrors.account = true;
      missing.push('account');
    }
    if (!selectedDate) {
      newErrors.date = true;
      missing.push('date');
    } else if (selectedDate < '2026-01-01') {
      newErrors.date = true;
      setErrors(newErrors);
      setErrorMessage('Date cannot be prior to 01-01-2026');
      return;
    } else if (selectedDate > todayStr) {
      newErrors.date = true;
      setErrors(newErrors);
      setErrorMessage('Date cannot be in the future');
      return;
    }

    if (isSplit) {
      const allocatedPaise = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (allocatedPaise !== activeAmount) {
        newErrors.splitBalance = true;
        const diff = activeAmount - allocatedPaise;
        if (diff > 0) {
          missing.push(`remaining ${currencySymbol}${paiseToRupees(diff)} to allocate`);
        } else {
          missing.push(`reduce overage of ${currencySymbol}${paiseToRupees(Math.abs(diff))}`);
        }
      }
    } else {
      const effectiveCatId = selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '');
      if (!effectiveCatId) {
        newErrors.category = true;
        missing.push('category');
      }
    }

    if (missing.length > 0) {
      setErrors(newErrors);
      setErrorMessage(`Please select: ${missing.join(', ')}`);
      return;
    }

    setErrors({});
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      const fallbackCatId =
        filteredCategories[0]?.id || (type === 'INCOME' ? 'cat_salary' : 'cat_dining');
      const effectiveCategoryId = isSplit
        ? splits[0]?.categoryId || fallbackCatId
        : selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '') || fallbackCatId;
      const effectiveMerchant =
        merchantName.trim().slice(0, 256) ||
        (isSplit
          ? 'Multi-Category Expense'
          : type === 'EXPENSE'
          ? 'Expense'
          : type === 'INCOME'
          ? 'Income'
          : 'Transfer');

      await onSave({
        type,
        amount: activeAmount,
        currency: currency || 'INR',
        merchantName: effectiveMerchant,
        categoryId: effectiveCategoryId,
        accountId: selectedAccountId,
        notes: notes.trim() ? notes.trim().slice(0, 256) : undefined,
        date: new Date(selectedDate).toISOString(),
        source: 'MANUAL',
        isSplit,
        splits: isSplit ? splits : undefined,
      });

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrorMessage('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="add-transaction-title"
      defaultSnap="full"
      contentClassName="p-0 flex flex-col min-h-0 relative"
      header={
        step === 2 && !activePicker ? (
          <DrawerHeader
            title={
              type === 'EXPENSE'
                ? 'Add Expense Details'
                : type === 'INCOME'
                ? 'Add Income Details'
                : 'Add Transfer Details'
            }
            titleId="add-transaction-title"
            onBack={() => {
              setErrorMessage(null);
              setStep(1);
            }}
          />
        ) : undefined
      }
      footer={
        step === 2 && !activePicker ? (
          <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 border-t border-theme-border/40 backdrop-blur-xs select-none">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
            >
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isSplit
                  ? `Save Split Expense ${currencySymbol}${formattedRupees}`
                  : `Save ${type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'Income' : 'Transfer'} ${currencySymbol}${formattedRupees}`}
              </span>
            </button>
          </div>
        ) : undefined
      }
    >
      {step === 1 ? (
        <AmountKeypad
          type={type}
          onTypeChange={(t) => {
            if (type !== t) {
              setType(t);
              setSelectedCategoryId('');
              setSplits([]);
              setErrors((prev) => ({ ...prev, category: false, splitBalance: false }));
              setErrorMessage(null);
            }
          }}
          amountStr={amountStr}
          onAmountChange={(val) => {
            if (errors.amount) {
              setErrors((prev) => ({ ...prev, amount: false }));
              setErrorMessage(null);
            }
            setAmountStr(val);
          }}
          currencySymbol={currencySymbol}
          numberingSystem={numberingSystem}
          merchantName={merchantName}
          onMerchantNameChange={(val) => setMerchantName(val.slice(0, 256))}
          onProceed={handleProceedToDetails}
          onClose={onClose}
          errorMessage={errorMessage}
        />
      ) : (
        <TransactionFormFields
          type={type}
          amountPaise={activeAmount}
          formattedRupees={formattedRupees}
          currencySymbol={currencySymbol}
          merchantName={merchantName}
          onMerchantNameChange={(val) => setMerchantName(val.slice(0, 256))}
          notes={notes}
          onNotesChange={(val) => setNotes(val.slice(0, 256))}
          currentCategory={currentCategory}
          currentAccount={currentAccount}
          dateDisplayLabel={dateDisplayLabel}
          selectedDate={selectedDate}
          isSplit={isSplit}
          splits={splits}
          filteredCategories={filteredCategories}
          errors={errors}
          errorMessage={errorMessage}
          onEditAmount={() => {
            setErrorMessage(null);
            setStep(1);
          }}
          onOpenCategoryPicker={() => setActivePicker('category')}
          onOpenAccountPicker={() => setActivePicker('account')}
          onOpenDatePicker={() => setActivePicker('date')}
          onUpdateSplits={setSplits}
          onSingleCategoryFromSplit={(catId) => {
            setSelectedCategoryId(catId);
            setSplits([]);
          }}
        />
      )}

      {/* Sub-Picker: Category Selection */}
      <CategoryPickerModal
        isOpen={activePicker === 'category'}
        type={type}
        categories={filteredCategories}
        selectedCategoryId={selectedCategoryId}
        splits={splits}
        totalAmountPaise={activeAmount}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          setErrors((prev) => ({ ...prev, category: false }));
          setErrorMessage(null);
        }}
        onUpdateSplits={(updated) => {
          setSplits(updated);
          if (updated.length > 0) {
            setErrors((prev) => ({ ...prev, category: false }));
            setErrorMessage(null);
          }
        }}
        onClose={() => setActivePicker(null)}
      />

      {/* Sub-Picker: Account Selection */}
      <AccountPickerModal
        isOpen={activePicker === 'account'}
        accounts={accountOptions}
        selectedAccountId={selectedAccountId}
        onSelectAccount={(accId) => {
          setSelectedAccountId(accId);
          setErrors((prev) => ({ ...prev, account: false }));
          setErrorMessage(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      {/* Sub-Picker: Date Selection */}
      {activePicker === 'date' && (
        <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150 overflow-y-auto no-scrollbar select-none">
          <DrawerHeader title="Select Date" onBack={() => setActivePicker(null)} />
          <div className="flex items-center justify-center w-full p-4">
            <CalendarPicker
              mode="single"
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setErrors((prev) => ({ ...prev, date: false }));
                setErrorMessage(null);
                setActivePicker(null);
              }}
              showPresets={false}
              onClose={() => setActivePicker(null)}
            />
          </div>
        </div>
      )}
    </DrawerShell>
  );
};
