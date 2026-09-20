import React, { useMemo } from 'react';
import { formatCurrency } from '../../domain/engine/moneyUtils';

export interface CategorySpendItem {
  id: string;
  name: string;
  total: number;
  colorHex?: string;
  isIncome?: boolean;
}

interface CategoryDonutDialProps {
  categorySpending: CategorySpendItem[];
  totalExpense: number;
  hideBalances: boolean;
}

// Fallback high-contrast vibrant palette matching reference image 2
const DEFAULT_PALETTE = [
  '#f43f5e', // Rose/Red (Food & Dining)
  '#8b5cf6', // Violet/Purple (Housing & Rent)
  '#0ea5e9', // Sky/Cyan (Transportation)
  '#f59e0b', // Amber/Orange (Shopping)
  '#10b981', // Emerald (Groceries / Health)
  '#ec4899', // Pink (Entertainment)
  '#6366f1', // Indigo (Bills)
  '#94a3b8', // Slate (Other)
];

export const CategoryDonutDial: React.FC<CategoryDonutDialProps> = ({
  categorySpending,
  totalExpense,
  hideBalances,
}) => {
  // 1. Process category slices with percentages and colors
  const slices = useMemo(() => {
    if (totalExpense === 0 || categorySpending.length === 0) return [];

    // Filter to only expenses with spending > 0
    const active = categorySpending.filter((c) => c.total > 0 && !c.isIncome);
    if (active.length === 0) return [];

    // Take top 4 or all, group rest as "Other"
    const top = active.slice(0, 4);
    const rest = active.slice(4);
    const restTotal = rest.reduce((sum, c) => sum + c.total, 0);

    const result = top.map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      total: cat.total,
      percent: Math.round((cat.total / totalExpense) * 100),
      ratio: cat.total / totalExpense,
      color: cat.colorHex || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
    }));

    if (restTotal > 0) {
      result.push({
        id: 'cat_other',
        name: 'Other',
        total: restTotal,
        percent: Math.round((restTotal / totalExpense) * 100),
        ratio: restTotal / totalExpense,
        color: '#94a3b8',
      });
    }

    return result;
  }, [categorySpending, totalExpense]);

  // 2. SVG Donut Arc Geometry
  const size = 200;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2 - 4; // ~73
  const circumference = 2 * Math.PI * radius; // ~458.67

  // Calculate dasharrays and offsets with rounded cap gaps
  const arcs = useMemo(() => {
    if (slices.length === 0) return [];

    const hasMultiple = slices.length > 1;
    // Gap size in stroke-dasharray units (subtle spacing)
    const gap = hasMultiple ? 14 : 0;
    let accumulatedRatio = 0;

    return slices.map((slice) => {
      const sliceLength = slice.ratio * circumference;
      const visibleLength = Math.max(0, sliceLength - gap);
      // Rotation offset starting from 12 o'clock (-90 degrees)
      const offset = -(accumulatedRatio * circumference) - gap / 2;
      accumulatedRatio += slice.ratio;

      return {
        ...slice,
        strokeDasharray: `${visibleLength} ${circumference - visibleLength}`,
        strokeDashoffset: offset,
      };
    });
  }, [slices, circumference]);

  return (
    <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm transition-colors select-none">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-theme-primary">
          Category Breakdown
        </span>
      </div>

      {/* 2. Donut Dial Graphic with Center Total */}
      <div className="mt-4 flex flex-col items-center justify-center">
        <div className="relative size-[200px] flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="rotate-[-90deg] overflow-visible"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-theme-border/40"
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            ))}
          </svg>

          {/* Center Cutout Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-theme-muted">
              Total spent
            </span>
            <span className="mt-0.5 text-xl font-bold font-mono tracking-tight text-theme-primary tabular-nums">
              {hideBalances ? '••••••' : formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown List */}
      <div className="mt-6 flex flex-col divide-y divide-theme-border/50">
        {slices.length === 0 ? (
          <p className="py-4 text-center text-xs text-theme-muted">
            No categorized expenses recorded in this period.
          </p>
        ) : (
          slices.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              {/* Left: Indicator Dot & Name */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="size-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-theme-primary truncate">
                  {item.name}
                </span>
              </div>

              {/* Center: Percentage */}
              <div className="w-16 text-center shrink-0">
                <span className="text-xs font-mono text-theme-muted font-medium">
                  {item.percent}%
                </span>
              </div>

              {/* Right: Currency Amount */}
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-theme-primary tabular-nums">
                  {hideBalances ? '••••••' : formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
