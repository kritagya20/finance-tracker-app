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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingCart,
  Fuel,
  Receipt,
  Film,
  ShoppingBag,
  Briefcase,
  DollarSign,
  CircleDollarSign,
};

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
