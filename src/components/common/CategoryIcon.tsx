import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Fuel,
  Receipt,
  Film,
  ShoppingBag,
  Briefcase,
  DollarSign,
  CircleDollarSign,
  Coffee,
  Heart,
  Zap,
  Home,
  Car,
  Plane,
  Dumbbell,
  Gift,
  Gamepad2,
  Smartphone,
  Book,
  GraduationCap,
  Music,
  Tv,
  PawPrint,
  Shield,
  Wallet,
  CreditCard,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingCart,
  Fuel,
  Receipt,
  Film,
  ShoppingBag,
  Briefcase,
  DollarSign,
  CircleDollarSign,
  Coffee,
  Heart,
  Zap,
  Home,
  Car,
  Plane,
  Dumbbell,
  Gift,
  Gamepad2,
  Smartphone,
  Book,
  GraduationCap,
  Music,
  Tv,
  PawPrint,
  Shield,
  Wallet,
  CreditCard,
  TrendingUp,
  Sparkles,
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'UtensilsCrossed', label: 'Food & Dining' },
  { name: 'Coffee', label: 'Coffee & Cafe' },
  { name: 'ShoppingCart', label: 'Groceries' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Fuel', label: 'Fuel' },
  { name: 'Car', label: 'Transport' },
  { name: 'Plane', label: 'Travel' },
  { name: 'Receipt', label: 'Bills & Utilities' },
  { name: 'Zap', label: 'Electricity' },
  { name: 'Home', label: 'Rent & Housing' },
  { name: 'Film', label: 'Entertainment' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'Music', label: 'Music & Audio' },
  { name: 'Heart', label: 'Health & Wellness' },
  { name: 'Dumbbell', label: 'Fitness & Gym' },
  { name: 'PawPrint', label: 'Pet Care' },
  { name: 'Gift', label: 'Gifts & Donations' },
  { name: 'GraduationCap', label: 'Education' },
  { name: 'Book', label: 'Books' },
  { name: 'Smartphone', label: 'Recharge & Mobile' },
  { name: 'Tv', label: 'Streaming' },
  { name: 'Briefcase', label: 'Career / Salary' },
  { name: 'DollarSign', label: 'Freelance' },
  { name: 'TrendingUp', label: 'Investments' },
  { name: 'Shield', label: 'Insurance' },
  { name: 'Wallet', label: 'Pocket Money' },
  { name: 'CircleDollarSign', label: 'General' },
];

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className,
  size = 20,
}) => {
  const IconComponent = ICON_MAP[name] || CircleDollarSign;
  return <IconComponent size={size} className={cn(className)} />;
};

