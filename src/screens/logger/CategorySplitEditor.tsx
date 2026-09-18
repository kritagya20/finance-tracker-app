import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Equal,
  ChevronDown,
  X,
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
}

export const CategorySplitEditor: React.FC<CategorySplitEditorProps> = ({
  totalAmountPaise,
  splits,
  categories,
  onChange,
}) => {
  // Modal for selecting a category for a specific row
  const [activePickerRowIndex, setActivePickerRowIndex] = useState<number | null>(null);

  const allocatedPaise = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const remainingPaise = totalAmountPaise - allocatedPaise;

  const handleAmountChange = (index: number, rupeeStr: string) => {
    // Only allow valid decimal numbers
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
    // Pick the first category not already selected, or fallback to first
    const usedCategoryIds = new Set(splits.map((s) => s.categoryId));
    const nextCat = categories.find((c) => !usedCategoryIds.has(c.id)) || categories[0];
    
    // Automatically allocate any remaining balance to the new split!
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
    if (splits.length <= 2) return; // Keep at least 2 items for a split
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

  const handleAssignRemaining = (index: number) => {
    if (remainingPaise === 0) return;
    const current = splits[index]?.amount || 0;
    const newAmount = Math.max(0, current + remainingPaise);
    const updated = splits.map((s, i) => (i === index ? { ...s, amount: newAmount } : s));
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-theme-border bg-theme-card p-3.5 shadow-xs transition-colors">
      {/* Allocation Header & Visual Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-theme-primary">Category Breakdown</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDistributeEvenly}
              className="flex items-center gap-1 rounded-lg border border-theme-border bg-theme-card-subtle px-2 py-0.5 text-[10px] font-semibold text-theme-secondary hover:text-theme-primary active:scale-95 transition-all shadow-xs"
              title="Divide total bill equally between categories"
            >
              <Equal className="size-2.5" />
              <span>Even Split</span>
            </button>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-theme-border flex">
          {splits.map((split, i) => {
            const cat = categories.find((c) => c.id === split.categoryId);
            const pct = totalAmountPaise > 0 ? (split.amount / totalAmountPaise) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={split.id || i}
                style={{ width: `${pct}%` }}
                className={cn('h-full transition-all duration-300', cat?.bgClass || 'bg-violet-500')}
              />
            );
          })}
        </div>

        {/* Live Allocation Metrics */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-theme-secondary">
            Allocated: <strong className="font-bold text-theme-primary">₹{paiseToRupees(allocatedPaise).toLocaleString('en-IN')}</strong> of ₹{paiseToRupees(totalAmountPaise).toLocaleString('en-IN')}
          </span>

          {remainingPaise === 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Balanced (100%)
            </span>
          ) : remainingPaise > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              ₹{paiseToRupees(remainingPaise).toLocaleString('en-IN')} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
              <AlertCircle className="size-3" />
              ₹{paiseToRupees(Math.abs(remainingPaise)).toLocaleString('en-IN')} over!
            </span>
          )}
        </div>
      </div>

      {/* Split Rows */}
      <div className="flex flex-col gap-2 pt-1">
        {splits.map((split, index) => {
          const cat = categories.find((c) => c.id === split.categoryId) || categories[0];
          const rupeeVal = (split.amount / 100).toString();
          const pct = totalAmountPaise > 0 ? Math.round((split.amount / totalAmountPaise) * 100) : 0;

          return (
            <div
              key={split.id || index}
              className="flex flex-col gap-1.5 rounded-xl border border-theme-border bg-theme-elevated p-2.5 shadow-xs transition-colors"
            >
              {/* Top Row: Category Picker + Amount + Actions */}
              <div className="flex items-center justify-between gap-2">
                {/* Category Button */}
                <button
                  type="button"
                  onClick={() => setActivePickerRowIndex(index)}
                  className="flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-card px-2 py-1 text-xs font-semibold text-theme-primary hover:bg-theme-card-hover active:scale-95 transition-all shrink-0 shadow-xs"
                >
                  <div className={cn('size-2 rounded-full', cat?.bgClass || 'bg-violet-500')} />
                  <span className="max-w-[100px] truncate">{cat?.name || 'Category'}</span>
                  <ChevronDown className="size-3 text-theme-muted" />
                </button>

                {/* Amount Input with Currency Symbol */}
                <div className="flex items-center gap-1 flex-1 justify-end">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-xs font-bold text-theme-muted">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rupeeVal === '0' ? '' : rupeeVal}
                      placeholder="0"
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      className="w-24 rounded-lg border border-theme-border bg-theme-input py-1 pl-5 pr-2 text-right text-xs font-bold text-theme-primary focus:border-violet-500/60 focus:outline-none tabular-nums shadow-xs"
                    />
                  </div>

                  <span className="min-w-[34px] text-right text-[10px] font-semibold text-theme-muted">
                    {pct}%
                  </span>

                  {/* Remove Row Button (if > 2 rows) */}
                  {splits.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(index)}
                      className="flex size-7 items-center justify-center rounded-lg text-theme-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      title="Remove category split"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Row: Note & Quick Balance Helper */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Optional item note (e.g. Veggies)..."
                  value={split.note || ''}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  className="w-full bg-transparent px-1 text-[11px] text-theme-primary placeholder:text-theme-muted focus:outline-none"
                />

                {remainingPaise !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleAssignRemaining(index)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all"
                  >
                    {remainingPaise > 0 ? `+₹${paiseToRupees(remainingPaise)} remainder` : 'Reduce overage'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Split Row Button */}
      <button
        type="button"
        onClick={handleAddSplit}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 active:scale-[0.99] transition-all shadow-xs"
      >
        <Plus className="size-3.5" />
        <span>Add Another Category Split</span>
      </button>

      {/* Row Category Picker Modal */}
      {activePickerRowIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[360px] rounded-2xl border border-theme-border bg-theme-elevated p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <span className="text-sm font-bold text-theme-primary">Select Split Category</span>
              <button
                type="button"
                onClick={() => setActivePickerRowIndex(null)}
                className="rounded-full p-1 text-theme-secondary hover:text-theme-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {categories.map((cat) => {
                const isSelected = splits[activePickerRowIndex]?.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(activePickerRowIndex, cat.id)}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-theme-card-hover active:scale-95 transition-all"
                  >
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl border transition-all',
                        cat.bgClass,
                        cat.textClass,
                        isSelected ? 'border-violet-500 ring-2 ring-violet-500/40 scale-105' : 'border-theme-border'
                      )}
                    >
                      <CategoryIcon name={cat.iconName} size={16} />
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
