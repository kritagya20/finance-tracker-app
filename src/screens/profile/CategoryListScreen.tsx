import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { Category } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { AddCategoryDrawer } from './AddCategoryDrawer';
import { EmptyState } from '../../components/common/EmptyState';
import { cn } from '../../lib/utils';

interface CategoryListScreenProps {
  categories: Category[];
  onBack: () => void;
  onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

type TypeFilter = 'ALL' | 'EXPENSE' | 'INCOME';

export const CategoryListScreen: React.FC<CategoryListScreenProps> = ({
  categories,
  onBack,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [filter, setFilter] = useState<TypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Type match
      if (filter === 'EXPENSE' && cat.isIncome) return false;
      if (filter === 'INCOME' && !cat.isIncome) return false;

      // Query match
      if (searchQuery.trim()) {
        return cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [categories, filter, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !onDeleteCategory) return;
    try {
      setIsDeleting(true);
      await onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200 select-none">
      {/* 1. Uncluttered Top Header (Level 1 Navigation Invariant) */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover hover:text-theme-primary transition-all active:scale-[0.92] shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            Categories
          </h1>
        </div>
      </header>

      {/* 2. Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full h-11 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-xs font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-xs text-theme-muted hover:text-theme-primary"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3. Filter Tabs (Without counts) */}
      <div className="flex gap-2">
        {(['ALL', 'EXPENSE', 'INCOME'] as TypeFilter[]).map((tab) => {
          const isSelected = filter === tab;
          const label = tab === 'ALL' ? 'All' : tab === 'EXPENSE' ? 'Expenses' : 'Income';

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs',
                isSelected
                  ? 'border-violet-500/40 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Inline Quick-Add Card (Shown when not actively searching) */}
      {!searchQuery && (
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 active:scale-[0.98] transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 group-hover:scale-105 transition-transform">
            <Plus className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">
              Create Custom Category
            </span>
            <span className="text-[10px] text-theme-muted truncate block">
              Personalized income or expense bucket with custom icon & color
            </span>
          </div>
        </button>
      )}

      {/* 5. Grouped Categories Listing */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={searchQuery ? 'No matching categories' : 'No categories yet'}
          description={
            searchQuery
              ? `No categories match "${searchQuery}". Try a different keyword or create a new category.`
              : 'Create your first custom category to organize your income and expenses.'
          }
          actionLabel="+ Add New Category"
          onAction={() => setIsAddOpen(true)}
          secondaryActionLabel={searchQuery ? 'Clear Search' : undefined}
          onSecondaryAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
          {filteredCategories.map((cat) => {
            const isCustom =
              cat.id.startsWith('cat_custom_') ||
              !['cat_dining', 'cat_groceries', 'cat_fuel', 'cat_bills', 'cat_entertainment', 'cat_shopping', 'cat_salary', 'cat_freelance'].includes(cat.id);

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3.5 hover:bg-theme-card-hover/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs',
                      cat.bgClass
                    )}
                  >
                    <CategoryIcon name={cat.iconName} size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-theme-primary truncate">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                          cat.isIncome
                            ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-theme-card-subtle text-theme-muted border border-theme-border'
                        )}
                      >
                        {cat.isIncome ? 'Income' : 'Expense'}
                      </span>
                      {isCustom && (
                        <span className="text-[9px] font-medium text-violet-500 dark:text-violet-400">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isCustom && onDeleteCategory && (
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(cat)}
                    title="Delete custom category"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all ml-2"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Ergonomic Thumb-Zone Primary Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold shadow-md shadow-violet-900/25 hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* 7. Add Category Drawer */}
      <AddCategoryDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={onAddCategory}
      />

      {/* 8. Delete Confirmation Modal Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 mx-auto max-w-[430px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            onClick={() => !isDeleting && setCategoryToDelete(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cat-title"
            className="relative z-10 w-full rounded-3xl border border-theme-border/80 bg-theme-elevated p-6 shadow-2xl animate-in zoom-in-95 duration-200 transition-colors"
          >
            {/* Header Alert Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-400 shadow-inner">
                <AlertTriangle className="size-7" />
              </div>

              <h3
                id="delete-cat-title"
                className="mt-4 text-lg font-bold tracking-tight text-theme-primary"
              >
                Delete Category?
              </h3>
              <p className="mt-1 text-xs text-theme-muted max-w-[270px] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-theme-primary">{categoryToDelete.name}</span>? Existing transactions will retain their history.
              </p>
            </div>

            {/* Category Summary Card */}
            <div className="mt-5 rounded-2xl border border-theme-border/60 bg-theme-card-subtle/70 p-3.5 flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs',
                  categoryToDelete.bgClass
                )}
              >
                <CategoryIcon name={categoryToDelete.iconName} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-theme-primary truncate">
                  {categoryToDelete.name}
                </p>
                <p className="text-[10px] text-theme-muted mt-0.5">
                  {categoryToDelete.isIncome ? 'Income Category' : 'Expense Category'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCategoryToDelete(null)}
                className="h-12 rounded-xl border border-theme-border bg-theme-card-subtle text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.97] transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
