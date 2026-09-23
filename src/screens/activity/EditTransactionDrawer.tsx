import React, { useState, useEffect, useMemo } from 'react';
import {
  Category,
  Transaction,
  TransactionType,
  Account,
  SplitItem,
  TransactionEditLog,
} from '../../domain/models/types';
import { parseKeypadToPaise, paiseToRupees, formatCurrency } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { CalendarPicker } from '../../components/common/CalendarPicker';
import { DrawerShell } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { AmountKeypad } from '../logger/AmountKeypad';
import { TransactionFormFields } from '../logger/TransactionFormFields';
import { CategoryPickerModal } from '../logger/CategoryPickerModal';
import { AccountPickerModal, AccountOptionItem } from '../logger/AccountPickerModal';
import { useCurrency } from '../../context/CurrencyContext';

export interface EditTransactionDrawerProps {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: Category[];
  accounts?: Account[];
  onSave: (updates: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_ACCOUNTS: AccountOptionItem[] = [
  { id: 'acc_hdfc', name: 'HDFC Bank', mask: '4102' },
  { id: 'acc_icici', name: 'ICICI Amazon Card', mask: '8819' },
  { id: 'acc_cash', name: 'Cash Wallet', mask: 'CASH' },
];

/**
 * Standardized EditTransactionDrawer refactored with modular UI primitives:
 * DrawerShell, DrawerHeader, AmountKeypad, TransactionFormFields, CategoryPickerModal,
 * and AccountPickerModal.
 * Enforces single ArrowLeft navigation, design system buttons, and maintains full edit history auditing.
 */
export const EditTransactionDrawer: React.FC<EditTransactionDrawerProps> = ({
  isOpen,
  transaction: tx,
  categories,
  accounts = [],
  onSave,
  onClose,
}) => {
  const { currencySymbol, numberingSystem } = useCurrency();

  // 2-Step Navigation (Defaults to Step 2 for editing details, can switch to Step 1 for Keypad)
  const [step, setStep] = useState<1 | 2>(2);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
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

  // Active Sub-Sheet Picker ('category' | 'account' | 'date' | null)
  const [activePicker, setActivePicker] = useState<'category' | 'account' | 'date' | null>(null);

  const accountOptions = useMemo(() => (accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS), [accounts]);

  // Initialize values when transaction changes or opens
  useEffect(() => {
    if (tx && isOpen) {
      setStep(2);
      setType(tx.type);
      const rupees = (tx.amount / 100).toString();
      setAmountStr(rupees);
      setMerchantName(tx.merchantName || '');
      setNotes(tx.notes || '');
      setSelectedCategoryId(tx.categoryId);
      setSelectedAccountId(tx.accountId || accountOptions[0]?.id || 'acc_hdfc');
      setSelectedDate(tx.date.slice(0, 10));

      const hasSplits = Boolean(tx.isSplit && tx.splits && tx.splits.length > 0);
      setSplits(hasSplits ? tx.splits! : []);
      if (hasSplits) {
        setSelectedCategoryId('');
      }

      setErrors({});
      setErrorMessage(null);
      setActivePicker(null);
    }
  }, [tx, isOpen, accountOptions]);

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

  const handleSave = async () => {
    if (!tx) return;
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
      const updatedDate = new Date(selectedDate);
      const origDate = new Date(tx.date);
      updatedDate.setHours(origDate.getHours(), origDate.getMinutes(), origDate.getSeconds());

      const effectiveCategoryId = isSplit
        ? splits[0]?.categoryId || tx.categoryId
        : selectedCategoryId || (splits.length === 1 ? splits[0].categoryId : '') || tx.categoryId;
      const effectiveMerchant = (merchantName.trim() || tx.merchantName).slice(0, 256);
      const cleanNotes = notes.trim() ? notes.trim().slice(0, 256) : undefined;

      // Track human-readable change summaries for timeline
      const changes: string[] = [];
      if (activeAmount !== tx.amount) {
        changes.push(`Amount changed to ${formatCurrency(activeAmount, undefined, false)}`);
      }
      if (effectiveMerchant !== tx.merchantName) {
        changes.push(`Payee updated to "${effectiveMerchant}"`);
      }
      if (effectiveCategoryId !== tx.categoryId) {
        const oldCat = categories.find((c) => c.id === tx.categoryId)?.name || 'Previous category';
        const newCat = categories.find((c) => c.id === effectiveCategoryId)?.name || 'New category';
        changes.push(`Category reclassified from ${oldCat} to ${newCat}`);
      }
      if (selectedAccountId && selectedAccountId !== tx.accountId) {
        const newAcc = accountOptions.find((a) => a.id === selectedAccountId)?.name || 'New account';
        changes.push(`Payment account changed to ${newAcc}`);
      }
      if (cleanNotes !== tx.notes) {
        changes.push(cleanNotes ? `Notes updated: "${cleanNotes}"` : 'Notes cleared');
      }
      if (isSplit !== tx.isSplit) {
        changes.push(isSplit ? 'Converted to multi-category bill split' : 'Removed bill split');
      }

      const newLogs: TransactionEditLog[] =
        changes.length > 0
          ? changes.map((summary) => ({
              timestamp: Date.now(),
              summary,
            }))
          : [
              {
                timestamp: Date.now(),
                summary: 'Transaction details reviewed & updated',
              },
            ];

      const updatedHistory: TransactionEditLog[] = [...(tx.editHistory || []), ...newLogs];

      await onSave({
        type,
        amount: activeAmount,
        merchantName: effectiveMerchant,
        categoryId: effectiveCategoryId,
        accountId: selectedAccountId,
        notes: cleanNotes,
        date: updatedDate.toISOString(),
        isSplit,
        splits: isSplit ? splits : undefined,
        editHistory: updatedHistory,
      });

      onClose();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setErrorMessage('Failed to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !tx) return null;

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="edit-transaction-title"
      defaultSnap="full"
      contentClassName="p-0 flex flex-col min-h-0 relative"
      header={
        step === 2 && !activePicker ? (
          <DrawerHeader
            title="Edit Transaction"
            titleId="edit-transaction-title"
            onBack={onClose}
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
              <span>{isSubmitting ? 'Saving changes...' : 'Save Changes'}</span>
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
          title="Edit Amount"
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
          showMerchantInput={false}
          onProceed={() => setStep(2)}
          onClose={() => setStep(2)}
          proceedLabel={`Done editing amount (${currencySymbol}${formattedRupees})`}
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
