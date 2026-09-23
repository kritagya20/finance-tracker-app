import { Category } from '../models/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_dining',
    name: 'Dining',
    iconName: 'UtensilsCrossed',
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    isDefault: true,
  },
  {
    id: 'cat_groceries',
    name: 'Groceries',
    iconName: 'ShoppingCart',
    colorHex: '#10b981',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    isDefault: true,
  },
  {
    id: 'cat_fuel',
    name: 'Fuel/Travel',
    iconName: 'Fuel',
    colorHex: '#38bdf8',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-400',
    isDefault: true,
  },
  {
    id: 'cat_bills',
    name: 'Bills',
    iconName: 'Receipt',
    colorHex: '#a855f7',
    bgClass: 'bg-violet-500/15',
    textClass: 'text-violet-400',
    isDefault: true,
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment',
    iconName: 'Film',
    colorHex: '#ec4899',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-400',
    isDefault: true,
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    iconName: 'ShoppingBag',
    colorHex: '#f97316',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    isDefault: true,
  },
  {
    id: 'cat_salary',
    name: 'Salary',
    iconName: 'Briefcase',
    colorHex: '#10b981',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    isIncome: true,
    isDefault: true,
  },
  {
    id: 'cat_freelance',
    name: 'Freelance',
    iconName: 'DollarSign',
    colorHex: '#06b6d4',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-400',
    isIncome: true,
    isDefault: true,
  },
];

export function getCategoryById(id: string): Category {
  return (
    DEFAULT_CATEGORIES.find((c) => c.id === id) || {
      id: 'cat_other',
      name: 'Other',
      iconName: 'CircleDollarSign',
      colorHex: '#94a3b8',
      bgClass: 'bg-slate-700/30',
      textClass: 'text-slate-400',
    }
  );
}
