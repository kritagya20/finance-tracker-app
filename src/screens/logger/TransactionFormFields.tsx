import React from 'react';
import {
  Calendar,
  CreditCard,
  ChevronDown,
  Pencil,
  Split,
  Store,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  Category,
  TransactionType,
  Account,
  SplitItem,
} from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CategorySplitEditor } from './CategorySplitEditor';
import { AccountOptionItem } from './AccountPickerModal';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { cn } from '../../lib/utils';

export interface TransactionFormFieldsProps {
  type: TransactionType;
  amountPaise: number;
  formattedRupees: string;
  currencySymbol: string;
  merchantName: string;
  onMerchantNameChange: (name: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  currentCategory?: Category;
  currentAccount?: Account | AccountOptionItem;
  dateDisplayLabel: string;
  selectedDate: string;
  isSplit: boolean;
  splits: SplitItem[];
  filteredCategories: Category[];
  errors: {
    amount?: boolean;
    category?: boolean;
    account?: boolean;
    date?: boolean;
    splitBalance?: boolean;
  };
  errorMessage: string | null;
  onEditAmount: () => void;
  onOpenCategoryPicker: () => void;
  onOpenAccountPicker: () => void;
  onOpenDatePicker: () => void;
  onUpdateSplits: (splits: SplitItem[]) => void;
  onSingleCategoryFromSplit: (catId: string) => void;
}

/**
 * Standardized TransactionFormFields component.
 * Renders the Step 2 details form: Hero amount, merchant name, category selector,
 * split editor, payment account selector, date selector, and notes.
 */
export const TransactionFormFields: React.FC<TransactionFormFieldsProps> = ({
  type,
  amountPaise,
  formattedRupees,
  currencySymbol,
  merchantName,
  onMerchantNameChange,
  notes,
  onNotesChange,
  currentCategory,
  currentAccount,
  dateDisplayLabel,
  selectedDate,
  isSplit,
  splits,
  filteredCategories,
  errors,
  errorMessage,
  onEditAmount,
  onOpenCategoryPicker,
  onOpenAccountPicker,
  onOpenDatePicker,
  onUpdateSplits,
  onSingleCategoryFromSplit,
}) => {
  const accountMask =
    currentAccount && 'maskNumber' in currentAccount && currentAccount.maskNumber
      ? currentAccount.maskNumber
      : currentAccount && 'mask' in currentAccount && currentAccount.mask
      ? currentAccount.mask
      : '';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4 select-none">
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 transition-all">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Centered Hero: Amount + Edit Button */}
      <div className="flex flex-col items-center justify-center pt-1 pb-2">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border',
              type === 'EXPENSE'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : type === 'INCOME'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
            )}
          >
            {isSplit ? 'Split Expense' : type}
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-1 select-none">
          <span className="text-2xl font-semibold text-theme-muted font-mono">{currencySymbol}</span>
          <span className="text-4xl font-bold tracking-tight text-theme-primary font-mono tabular-nums">
            {formattedRupees}
          </span>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onEditAmount}
            className="inline-flex items-center gap-1.5 rounded-full bg-theme-card-subtle hover:bg-theme-card border border-theme-border px-3.5 py-1.5 text-xs font-medium text-theme-secondary hover:text-theme-primary active:scale-95 transition-all shadow-xs"
            title="Change amount"
          >
            <Pencil className="size-3 text-theme-muted" />
            <span>Edit amount</span>
          </button>
        </div>
      </div>

      {/* 1. Merchant / Payee Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-theme-secondary">
            Merchant / Payee
          </label>
          {merchantName.length > 0 && (
            <span className="text-[10px] font-mono text-theme-muted">
              {merchantName.length}/256
            </span>
          )}
        </div>
        <div className="relative flex items-center">
          <Store className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. Starbucks, Amazon, Salary"
            value={merchantName}
            maxLength={256}
            onChange={(e) => onMerchantNameChange(e.target.value.slice(0, 256))}
            className="w-full h-12 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 2. Category Section */}
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1.5">
          {type === 'INCOME' ? 'Income Category' : 'Category'}
          <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
        </label>
        {isSplit ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-theme-secondary">
                Split into {splits.length} categories
              </span>
              <button
                type="button"
                onClick={onOpenCategoryPicker}
                className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
              >
                Edit categories
              </button>
            </div>

            <CategorySplitEditor
              totalAmountPaise={amountPaise}
              splits={splits}
              categories={filteredCategories}
              onChange={(updated) => {
                if (updated.length === 1) {
                  onSingleCategoryFromSplit(updated[0].categoryId);
                } else {
                  onUpdateSplits(updated);
                }
              }}
              onAddCategoryClick={onOpenCategoryPicker}
              allowRemoveToSingle={true}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenCategoryPicker}
              className={cn(
                'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
                errors.category
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
                  : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg text-white shadow-xs',
                    currentCategory ? currentCategory.bgClass : 'bg-violet-600'
                  )}
                >
                  <CategoryIcon name={currentCategory ? currentCategory.iconName : 'Tag'} size={18} />
                </div>
                <div>
                  <div className={cn('text-xs font-semibold', errors.category ? 'text-rose-500' : 'text-theme-primary')}>
                    {currentCategory
                      ? currentCategory.name
                      : type === 'INCOME'
                      ? 'Choose income category'
                      : 'Choose category'}
                  </div>
                  <div className="text-[11px] text-theme-muted">
                    {currentCategory
                      ? 'Tap to change' + (type === 'EXPENSE' ? ' or split' : '')
                      : 'Tap to select' + (type === 'EXPENSE' ? ' or split' : '')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-theme-muted">
                <span>{currentCategory ? (type === 'EXPENSE' ? 'Change / Split' : 'Change') : 'Select'}</span>
                <ChevronDown className="size-3.5" />
              </div>
            </button>

            {currentCategory && type === 'EXPENSE' && (
              <button
                type="button"
                onClick={onOpenCategoryPicker}
                className="flex items-center gap-1.5 self-start px-1 py-0.5 text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
              >
                <Split className="size-3" />
                <span>Split into multiple categories</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Payment Account Field */}
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1.5">
          Payment Account
          <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
        </label>
        <button
          type="button"
          onClick={onOpenAccountPicker}
          className={cn(
            'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
            errors.account
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
              : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/50">
              <CreditCard className="size-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-theme-primary">
                {currentAccount ? currentAccount.name : 'Select Account'}
              </div>
              <div className="text-[11px] text-theme-muted font-mono">
                {accountMask ? `···· ${accountMask}` : 'Tap to choose payment account'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-theme-muted">
            <span>Change</span>
            <ChevronDown className="size-3.5" />
          </div>
        </button>
      </div>

      {/* 4. Date Field */}
      <div>
        <label className="block text-xs font-medium text-theme-secondary mb-1.5">
          Date
          <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
        </label>
        <button
          type="button"
          onClick={onOpenDatePicker}
          className={cn(
            'flex w-full items-center justify-between py-3 px-3.5 rounded-xl transition-all shadow-xs border text-left',
            errors.date
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/40'
              : 'bg-theme-input hover:bg-theme-card text-theme-primary border-theme-border'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/50">
              <Calendar className="size-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-theme-primary">
                {dateDisplayLabel}
              </div>
              <div className="text-[11px] text-theme-muted font-mono">
                {selectedDate ? formatDateDDMMYYYY(selectedDate) : 'Tap to select date'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-theme-muted">
            <span>Change</span>
            <ChevronDown className="size-3.5" />
          </div>
        </button>
      </div>

      {/* 5. Notes Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-theme-secondary">
            Notes
          </label>
          {notes.length > 0 && (
            <span className="text-[10px] font-mono text-theme-muted">
              {notes.length}/256
            </span>
          )}
        </div>
        <div className="relative flex items-center">
          <FileText className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Add note, bill number or memo"
            value={notes}
            maxLength={256}
            onChange={(e) => onNotesChange(e.target.value.slice(0, 256))}
            className="w-full h-12 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};
