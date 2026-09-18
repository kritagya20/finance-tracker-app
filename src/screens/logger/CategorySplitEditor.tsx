import React, { useState } from 'react';
import {
  Plus,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Equal,
} from 'lucide-react';
import { Category, SplitItem } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { parseKeypadToPaise, paiseToRupees } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface CategorySplitEditorProps {
  totalAmountPaise: number;
  splits: SplitItem[];
  categories: Category[];
  onChange: (splits: SplitItem[]) => void;
  onAddCategoryClick?: () => void;
  allowRemoveToSingle?: boolean;
}

export const CategorySplitEditor: React.FC<CategorySplitEditorProps> = ({
  totalAmountPaise,
  splits,
  categories,
  onChange,
  onAddCategoryClick,
  allowRemoveToSingle = false,
}) => {
  const [activePickerRowIndex, setActivePickerRowIndex] = useState<number | null>(null);

  const allocatedPaise = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const remainingPaise = totalAmountPaise - allocatedPaise;

  const handleAmountChange = (index: number, rupeeStr: string) => {
    const cleanStr = rupeeStr.replace(/[^0-9.]/g, '');
    const parts = cleanStr.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    const newPaise = parseKeypadToPaise(cleanStr || '0');
    const updated = splits.map((s, i) => (i === index ? { ...s, amount: newPaise } : s));
    onChange(updated);
  };

  const handleNoteChange = (index: number, note: string) => {
    const updated = splits.map((s, i) => (i === index ? { ...s, note } : s));
    onChange(updated);
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    const updated = splits.map((s, i) => (i === index ? { ...s, categoryId } : s));
    onChange(updated);
    setActivePickerRowIndex(null);
  };

  const handleAddSplit = () => {
    if (onAddCategoryClick) {
      onAddCategoryClick();
      return;
    }
    const usedCategoryIds = new Set(splits.map((s) => s.categoryId));
    const nextCat = categories.find((c) => !usedCategoryIds.has(c.id)) || categories[0];
    const initialAmount = Math.max(0, remainingPaise);

    const newSplit: SplitItem = {
      id: `split_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      categoryId: nextCat?.id || 'cat_dining',
      amount: initialAmount,
      note: '',
    };
    onChange([...splits, newSplit]);
  };

  const handleRemoveSplit = (index: number) => {
    const minSplits = allowRemoveToSingle ? 1 : 2;
    if (splits.length <= minSplits) return;
    const updated = splits.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDistributeEvenly = () => {
    if (splits.length === 0 || totalAmountPaise <= 0) return;
    const count = splits.length;
    const basePaise = Math.floor(totalAmountPaise / count);
    const remainder = totalAmountPaise - basePaise * count;

    const updated = splits.map((s, idx) => ({
      ...s,
      amount: idx === 0 ? basePaise + remainder : basePaise,
    }));
    onChange(updated);
  };

  const minSplitsAllowed = allowRemoveToSingle ? 1 : 2;

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Subtle Sub-header: Title + Status + Even Split action */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-theme-secondary">Split breakdown</span>
          {remainingPaise === 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
              <CheckCircle2 className="size-3" />
              Balanced
            </span>
          ) : remainingPaise > 0 ? (
            <span className="text-[11px] font-medium font-mono text-amber-500">
              ₹{paiseToRupees(remainingPaise).toLocaleString('en-IN')} unallocated
            </span>
          ) : (
            <span className="text-[11px] font-medium font-mono text-rose-500">
              ₹{paiseToRupees(Math.abs(remainingPaise)).toLocaleString('en-IN')} over
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDistributeEvenly}
          className="flex items-center gap-1 text-[11px] font-medium text-violet-500 hover:text-violet-400 active:opacity-75 transition-opacity"
        >
          <Equal className="size-3" />
          <span>Split evenly</span>
        </button>
      </div>

      {/* Flat, Borderless List Rows (Matching GPay style) */}
      <div className="flex flex-col divide-y divide-theme-divider">
        {splits.map((split, index) => {
          const cat = categories.find((c) => c.id === split.categoryId) || categories[0];
          const rupeeVal = (split.amount / 100).toString();

          return (
            <div
              key={split.id || index}
              className="flex items-center justify-between py-2.5 px-1 gap-3 group"
            >
              {/* Left: Circular Category Avatar + Name & Note */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActivePickerRowIndex(index)}
                  className="relative shrink-0 active:scale-95 transition-transform"
                >
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full text-white shadow-xs',
                      cat?.bgClass || 'bg-violet-600'
                    )}
                  >
                    <CategoryIcon name={cat?.iconName || 'CircleDollarSign'} size={16} />
                  </div>
                </button>

                <div className="flex flex-col min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setActivePickerRowIndex(index)}
                    className="flex items-center gap-1 text-left text-xs font-semibold text-theme-primary hover:text-violet-400 transition-colors"
                  >
                    <span className="truncate">{cat?.name || 'Category'}</span>
                    <ChevronDown className="size-3 text-theme-muted shrink-0" />
                  </button>
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={split.note || ''}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    className="bg-transparent text-[11px] text-theme-muted placeholder:text-theme-muted/50 focus:text-theme-primary focus:outline-none truncate"
                  />
                </div>
              </div>

              {/* Right: Amount Input + Remove Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5 text-sm font-semibold font-mono text-theme-primary tabular-nums">
                  <span className="text-xs text-theme-muted font-mono">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rupeeVal === '0' ? '' : rupeeVal}
                    placeholder="0"
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    className="w-20 bg-transparent text-right text-sm font-semibold font-mono text-theme-primary placeholder:text-theme-muted/50 focus:outline-none border-b border-transparent focus:border-violet-500 tabular-nums py-0.5"
                  />
                </div>

                {splits.length > minSplitsAllowed && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSplit(index)}
                    className="p-1 rounded-full text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all"
                    title="Remove split"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Add Button */}
      <button
        type="button"
        onClick={handleAddSplit}
        className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-violet-500 hover:text-violet-400 active:opacity-75 transition-opacity"
      >
        <Plus className="size-3.5" />
        <span>Add another category</span>
      </button>

      {/* Category Picker Sub-Sheet */}
      {activePickerRowIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[360px] rounded-3xl bg-theme-elevated p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2.5 pb-3 border-b border-theme-divider">
              <button
                type="button"
                onClick={() => setActivePickerRowIndex(null)}
                aria-label="Back"
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <span className="text-sm font-bold text-theme-primary">Select Category</span>
            </div>

            <div className="grid grid-cols-4 gap-3 py-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {categories.map((cat) => {
                const isSelected = splits[activePickerRowIndex]?.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(activePickerRowIndex, cat.id)}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-theme-card-hover active:scale-95 transition-all"
                  >
                    <div
                      className={cn(
                        'flex size-11 items-center justify-center rounded-full text-white transition-all',
                        cat.bgClass,
                        isSelected ? 'ring-2 ring-violet-500 scale-105 shadow-md' : ''
                      )}
                    >
                      <CategoryIcon name={cat.iconName} size={18} />
                    </div>
                    <span
                      className={cn(
                        'text-center text-[10px] truncate w-full',
                        isSelected ? 'font-bold text-theme-primary' : 'text-theme-secondary'
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
