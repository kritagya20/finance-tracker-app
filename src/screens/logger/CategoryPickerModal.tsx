import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Category, SplitItem, TransactionType } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { CategorySplitEditor } from './CategorySplitEditor';
import { cn } from '../../lib/utils';

export interface CategoryPickerModalProps {
  isOpen: boolean;
  type: TransactionType;
  categories: Category[];
  selectedCategoryId: string;
  splits: SplitItem[];
  totalAmountPaise: number;
  onSelectCategory: (catId: string) => void;
  onUpdateSplits: (splits: SplitItem[]) => void;
  onClose: () => void;
}

/**
 * Standardized CategoryPickerModal sub-sheet.
 * Supports single category selection and multi-category bill splitting with live allocation.
 * Strictly isolates Expense vs Income categories.
 */
export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  isOpen,
  type,
  categories,
  selectedCategoryId,
  splits,
  totalAmountPaise,
  onSelectCategory,
  onUpdateSplits,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleToggleCategory = (catId: string) => {
    // If we already have split items, toggle category in/out of splits
    if (splits.length > 1) {
      const exists = splits.some((s) => s.categoryId === catId);
      if (exists) {
        const remaining = splits.filter((s) => s.categoryId !== catId);
        if (remaining.length === 1) {
          onSelectCategory(remaining[0].categoryId);
          onUpdateSplits([]);
        } else {
          // Re-balance equally among remaining
          const evenPaise = Math.floor(totalAmountPaise / remaining.length);
          const remainder = totalAmountPaise - evenPaise * remaining.length;
          const rebalanced = remaining.map((s, idx) => ({
            ...s,
            amount: idx === 0 ? evenPaise + remainder : evenPaise,
          }));
          onUpdateSplits(rebalanced);
        }
      } else {
        // Add to splits
        const nextSplits: SplitItem[] = [
          ...splits,
          {
            id: `split_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            categoryId: catId,
            amount: 0,
          },
        ];
        const evenPaise = Math.floor(totalAmountPaise / nextSplits.length);
        const remainder = totalAmountPaise - evenPaise * nextSplits.length;
        const rebalanced = nextSplits.map((s, idx) => ({
          ...s,
          amount: idx === 0 ? evenPaise + remainder : evenPaise,
        }));
        onUpdateSplits(rebalanced);
      }
      return;
    }

    // If tapping another category when 1 is already selected in expense mode, convert to 2-way split!
    if (selectedCategoryId && selectedCategoryId !== catId && type === 'EXPENSE') {
      const half = Math.floor(totalAmountPaise / 2);
      onUpdateSplits([
        {
          id: `split_1_${Date.now()}`,
          categoryId: selectedCategoryId,
          amount: totalAmountPaise - half,
        },
        {
          id: `split_2_${Date.now()}`,
          categoryId: catId,
          amount: half,
        },
      ]);
      onSelectCategory('');
      return;
    }

    // Default single selection
    onSelectCategory(catId);
    onUpdateSplits([]);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-theme-border/40 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-theme-primary uppercase tracking-wider">
            {type === 'EXPENSE'
              ? 'Select Expense Category'
              : type === 'INCOME'
              ? 'Select Income Category'
              : 'Select Category'}
          </span>
          <p className="text-[11px] text-theme-muted">
            {type === 'EXPENSE'
              ? splits.length > 1
                ? `${splits.length} categories selected • Split bill below`
                : 'Choose 1 category or tap multiple to split'
              : 'Choose 1 category'}
          </p>
        </div>
        <div className="size-10" />
      </div>

      {/* Scrollable Canvas: Category Grid + Categorization Breakdown */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {categories.map((cat) => {
            const isSelectedInSplit = splits.some((s) => s.categoryId === cat.id);
            const isSingleSelected = !splits.length && selectedCategoryId === cat.id;
            const isSelected = isSelectedInSplit || isSingleSelected;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-theme-card-subtle/50 active:scale-95 transition-all relative"
              >
                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl text-white transition-all relative shadow-xs',
                    cat.bgClass,
                    isSelected ? 'ring-2 ring-violet-500 scale-105 shadow-md' : ''
                  )}
                >
                  <CategoryIcon name={cat.iconName} size={20} />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    'text-center text-[11px] truncate w-full mt-1',
                    isSelected ? 'font-bold text-theme-primary' : 'text-theme-secondary'
                  )}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="py-8 text-center text-xs text-theme-muted">
            No {type === 'EXPENSE' ? 'expense' : 'income'} categories available.
          </div>
        )}

        {/* Categorization Split Breakdown */}
        {type === 'EXPENSE' && splits.length > 1 && (
          <div className="pt-4 border-t border-theme-border/40 animate-in fade-in duration-150">
            <CategorySplitEditor
              totalAmountPaise={totalAmountPaise}
              splits={splits}
              categories={categories}
              onChange={(updated) => {
                if (updated.length === 1) {
                  onSelectCategory(updated[0].categoryId);
                  onUpdateSplits([]);
                } else {
                  onUpdateSplits(updated);
                }
              }}
              allowRemoveToSingle={true}
            />
          </div>
        )}
      </div>

      {/* Pinned Bottom Apply Button */}
      <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 border-t border-theme-border/40 backdrop-blur-xs">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 shadow-lg active:scale-[0.97] transition-all"
        >
          <span>
            {splits.length > 1
              ? `Apply Split (${splits.length} Categories)`
              : currentCategory
              ? `Apply ${currentCategory.name}`
              : 'Done'}
          </span>
        </button>
      </div>
    </div>
  );
};
