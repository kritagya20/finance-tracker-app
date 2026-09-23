import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Lock, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Category, Budget } from '../../domain/models/types';
import { DEFAULT_CATEGORIES } from '../../domain/engine/categories';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from '../../components/common/CategoryIcon';
import { cn } from '../../lib/utils';

interface EditCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  existingBudget?: Budget | null;
  onSave: (
    id: string,
    updates: Partial<Category>,
    monthlyLimitPaise?: number
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
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
  { label: '₹50,000', value: 50000 },
];

export const EditCategoryDrawer: React.FC<EditCategoryDrawerProps> = ({
  isOpen,
  onClose,
  category,
  existingBudget,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [limitRupees, setLimitRupees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read default system state from category entity (or fallback check)
  const isDefaultCategory = Boolean(
    category &&
      (category.isDefault ||
        DEFAULT_CATEGORIES.some((dc) => dc.id === category.id) ||
        [
          'cat_dining',
          'cat_groceries',
          'cat_fuel',
          'cat_bills',
          'cat_entertainment',
          'cat_shopping',
          'cat_salary',
          'cat_freelance',
        ].includes(category.id))
  );

  // Initialize form state when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedIcon(category.iconName || 'Tag');

      const matchedColor =
        COLOR_PRESETS.find((c) => c.hex.toLowerCase() === category.colorHex?.toLowerCase()) ||
        COLOR_PRESETS.find((c) => c.bgClass === category.bgClass) ||
        COLOR_PRESETS[0];
      setSelectedColor(matchedColor);

      if (existingBudget && existingBudget.limitAmount > 0) {
        setLimitRupees(Math.round(existingBudget.limitAmount / 100).toString());
      } else {
        setLimitRupees('');
      }

      setError(null);
      setIsConfirmDeleteOpen(false);
    }
  }, [category, existingBudget, isOpen]);

  if (!isOpen || !category) return null;

  const parsedLimitRupees = parseFloat(limitRupees) || 0;
  const parsedLimitPaise = Math.round(parsedLimitRupees * 100);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isDefaultCategory) {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter a category name');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updates: Partial<Category> = {};
      if (!isDefaultCategory) {
        updates.name = name.trim();
        updates.iconName = selectedIcon;
        updates.colorHex = selectedColor.hex;
        updates.bgClass = selectedColor.bgClass;
        updates.textClass = selectedColor.textClass;
      }

      await onSave(category.id, updates, parsedLimitPaise);
      onClose();
    } catch (err) {
      console.error('Failed to update category:', err);
      setError('Failed to update category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!onDelete || isDefaultCategory) return;
    try {
      setIsDeleting(true);
      await onDelete(category.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-theme-elevated mx-auto max-w-[390px] overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Navigation Bar adhering to Single ArrowLeft Navigation Invariant */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-theme-border/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to categories"
          className="flex size-10 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors active:scale-95 shadow-xs"
        >
          <ArrowLeft className="size-5" />
        </button>

        <h1 className="text-base font-bold text-theme-primary">
          Edit Category
        </h1>

        <div className="size-10" />
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Minimal Category Identity Header */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          <div
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl text-white shadow-sm transition-all',
              isDefaultCategory ? category.bgClass : selectedColor.bgClass
            )}
          >
            <CategoryIcon
              name={isDefaultCategory ? category.iconName : selectedIcon}
              size={28}
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-sm font-bold text-theme-primary">
              {isDefaultCategory ? category.name : name.trim() || 'Untitled Category'}
            </span>
            {isDefaultCategory && (
              <Lock className="size-3 text-theme-muted" />
            )}
          </div>
          <span
            className={cn(
              'mt-1 inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
              category.isIncome
                ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/25'
            )}
          >
            {category.isIncome ? 'Income' : 'Expense'}
          </span>
        </div>

        {/* Category Name Field */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Category Name {!isDefaultCategory && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
          {isDefaultCategory ? (
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={category.name}
                  className="w-full h-12 rounded-xl border border-theme-border/60 bg-theme-card-subtle/50 px-3.5 pr-10 text-sm font-medium text-theme-secondary cursor-not-allowed select-none shadow-xs"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-theme-muted">
                  <Lock className="size-4" />
                </div>
              </div>
              <p className="text-[11px] text-theme-muted">
                System default category name cannot be edited.
              </p>
            </div>
          ) : (
            <input
              type="text"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full h-12 rounded-xl border border-theme-border bg-theme-input px-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
            />
          )}
        </div>

        {/* Monthly Expense Limit (Budget) Section */}
        {!category.isIncome && (
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

            {/* Quick Preset Chips */}
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

        {/* Custom Category Specific Controls: Color, Icon, and Delete */}
        {!isDefaultCategory && (
          <>
            {/* Color Accent: Minimal horizontal scroll */}
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                Color Accent
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {COLOR_PRESETS.map((color) => {
                  const isSelected = selectedColor.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95',
                        isSelected
                          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-theme-elevated scale-110 border-transparent'
                          : 'border-theme-border/60 hover:scale-105'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    >
                      {isSelected && <Check className="size-3 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Picker: Compact 6-col scrollable grid */}
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1.5">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1.5 rounded-xl border border-theme-border bg-theme-card-subtle/40">
                {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
                  const isSelected = selectedIcon === iconItem.name;
                  return (
                    <button
                      key={iconItem.name}
                      type="button"
                      onClick={() => setSelectedIcon(iconItem.name)}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl border transition-all active:scale-95',
                        isSelected
                          ? 'border-violet-500 bg-violet-500/20 text-violet-400 shadow-xs ring-1 ring-violet-500/30'
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

            {/* Destructive Delete Button */}
            {onDelete && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all text-xs font-semibold"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Category</span>
                </button>
              </div>
            )}
          </>
        )}
      </form>

      {/* Sticky Bottom Primary CTA */}
      <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs border-t border-theme-border/50">
        <button
          type="button"
          disabled={(!isDefaultCategory && !name.trim()) || isSubmitting}
          onClick={() => handleSubmit()}
          className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-md shadow-violet-900/25 active:scale-[0.97] transition-all"
        >
          <Save className="size-4" />
          <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-60 mx-auto max-w-[430px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            onClick={() => !isDeleting && setIsConfirmDeleteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="relative z-10 w-full rounded-3xl border border-theme-border/80 bg-theme-elevated p-6 shadow-2xl animate-in zoom-in-95 duration-200 transition-colors"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-400 shadow-inner">
                <AlertTriangle className="size-7" />
              </div>

              <h3
                id="confirm-delete-title"
                className="mt-4 text-lg font-bold tracking-tight text-theme-primary"
              >
                Delete Category?
              </h3>
              <p className="mt-1 text-xs text-theme-muted max-w-[270px] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-theme-primary">{category.name}</span>? Existing transactions will retain their history.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="h-12 rounded-xl border border-theme-border bg-theme-card-subtle text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.97] transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
