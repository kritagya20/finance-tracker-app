import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Category } from '../../domain/models/types';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from '../../components/common/CategoryIcon';
import { cn } from '../../lib/utils';

interface AddCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'>, monthlyLimitPaise?: number) => Promise<void>;
}

const COLOR_PRESETS = [
  { id: 'violet', hex: '#8b5cf6', bgClass: 'bg-violet-500/15', textClass: 'text-violet-400', label: 'Violet' },
  { id: 'emerald', hex: '#10b981', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400', label: 'Emerald' },
  { id: 'sky', hex: '#0ea5e9', bgClass: 'bg-sky-500/15', textClass: 'text-sky-400', label: 'Sky' },
  { id: 'amber', hex: '#f59e0b', bgClass: 'bg-amber-500/15', textClass: 'text-amber-400', label: 'Amber' },
  { id: 'pink', hex: '#ec4899', bgClass: 'bg-pink-500/15', textClass: 'text-pink-400', label: 'Pink' },
  { id: 'orange', hex: '#f97316', bgClass: 'bg-orange-500/15', textClass: 'text-orange-400', label: 'Orange' },
  { id: 'rose', hex: '#f43f5e', bgClass: 'bg-rose-500/15', textClass: 'text-rose-400', label: 'Rose' },
  { id: 'teal', hex: '#14b8a6', bgClass: 'bg-teal-500/15', textClass: 'text-teal-400', label: 'Teal' },
  { id: 'indigo', hex: '#6366f1', bgClass: 'bg-indigo-500/15', textClass: 'text-indigo-400', label: 'Indigo' },
  { id: 'cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500/15', textClass: 'text-cyan-400', label: 'Cyan' },
];

const BUDGET_PRESETS = [
  { label: '₹2,000', value: 2000 },
  { label: '₹5,000', value: 5000 },
  { label: '₹10,000', value: 10000 },
  { label: '₹25,000', value: 25000 },
];

export const AddCategoryDrawer: React.FC<AddCategoryDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [limitRupees, setLimitRupees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedLimitRupees = parseFloat(limitRupees) || 0;
  const parsedLimitPaise = Math.round(parsedLimitRupees * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a category name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(
        {
          name: cleanName,
          iconName: selectedIcon,
          colorHex: selectedColor.hex,
          bgClass: selectedColor.bgClass,
          textClass: selectedColor.textClass,
          isIncome,
        },
        !isIncome && parsedLimitPaise > 0 ? parsedLimitPaise : undefined
      );
      setName('');
      setLimitRupees('');
      onClose();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-theme-elevated mx-auto max-w-[390px] overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-theme-border/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>

        <span className="text-sm font-bold text-theme-primary">
          New Category
        </span>

        <div className="size-9" />
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Live Preview Card */}
        <div className="flex flex-col items-center justify-center py-4 px-4 rounded-2xl border border-theme-border bg-theme-card/60">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted mb-2.5">
            Preview Badge
          </span>
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-theme-border/60 bg-theme-card shadow-xs">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-xl text-white shadow-xs',
                selectedColor.bgClass
              )}
            >
              <CategoryIcon name={selectedIcon} size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-primary truncate max-w-[150px]">
                {name.trim() || 'Category Name'}
              </p>
              <div className="mt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                    isIncome
                      ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/25'
                  )}
                >
                  {isIncome ? 'Income' : 'Expense'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Type Switcher (Expense vs Income) */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Category Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-theme-card-subtle border border-theme-border">
            <button
              type="button"
              onClick={() => setIsIncome(false)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                !isIncome
                  ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 shadow-xs'
                  : 'text-theme-muted hover:text-theme-primary'
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setIsIncome(true)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                isIncome
                  ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : 'text-theme-muted hover:text-theme-primary'
              )}
            >
              Income
            </button>
          </div>
        </div>

        {/* Category Name Input */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Category Name <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pet Care, Gaming, Gym, Rent"
            className="w-full h-12 rounded-xl border border-theme-border bg-theme-input px-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
        </div>

        {/* Monthly Expense Limit (Budget) Section */}
        {!isIncome && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-theme-secondary">
                Monthly Expense Limit
              </label>
              {parsedLimitPaise > 0 && (
                <button
                  type="button"
                  onClick={() => setLimitRupees('')}
                  className="text-[11px] font-medium text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Clear Limit
                </button>
              )}
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-theme-muted font-mono font-bold text-sm">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={limitRupees}
                onChange={(e) => setLimitRupees(e.target.value)}
                placeholder="No limit set"
                className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-theme-border bg-theme-input text-sm font-mono font-semibold text-theme-primary placeholder:text-theme-muted placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {BUDGET_PRESETS.map((preset) => {
                const isSelected = parsedLimitRupees === preset.value;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setLimitRupees(preset.value.toString())}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all active:scale-95',
                      isSelected
                        ? 'border-violet-500 bg-violet-600 text-white font-semibold shadow-xs'
                        : 'border-theme-border bg-theme-card-subtle text-theme-secondary hover:text-theme-primary hover:bg-theme-card'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Color Accent
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {COLOR_PRESETS.map((color) => {
              const isSelected = selectedColor.id === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl border transition-all relative shadow-xs',
                    color.bgClass,
                    isSelected ? 'ring-2 ring-violet-500 scale-105 border-transparent' : 'border-theme-border/70 hover:scale-102'
                  )}
                  title={color.label}
                >
                  <span
                    className="size-3.5 rounded-full shadow-xs"
                    style={{ backgroundColor: color.hex }}
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Select Icon ({AVAILABLE_CATEGORY_ICONS.length})
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1 rounded-xl border border-theme-border bg-theme-card-subtle/50">
            {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
              const isSelected = selectedIcon === iconItem.name;
              return (
                <button
                  key={iconItem.name}
                  type="button"
                  onClick={() => setSelectedIcon(iconItem.name)}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl border transition-all active:scale-95',
                    isSelected
                      ? 'border-violet-500 bg-violet-500/20 text-violet-400 shadow-sm ring-1 ring-violet-500/40'
                      : 'border-transparent text-theme-muted hover:text-theme-primary hover:bg-theme-card'
                  )}
                  title={iconItem.label}
                >
                  <CategoryIcon name={iconItem.name} size={18} />
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* Pinned Sticky Bottom CTA */}
      <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs border-t border-theme-border/50">
        <button
          type="button"
          disabled={!name.trim() || isSubmitting}
          onClick={handleSubmit}
          className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
        >
          <Sparkles className="size-4" />
          <span>{isSubmitting ? 'Creating Category...' : 'Create Category'}</span>
        </button>
      </div>
    </div>
  );
};
