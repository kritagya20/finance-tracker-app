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

// Exactly 4 vibrant, high-contrast colors matching reference image 2
const REFERENCE_PALETTE = [
  '#f43f5e', // Coral / Rose
  '#8b5cf6', // Violet / Purple
  '#38bdf8', // Sky / Cyan
  '#f59e0b', // Amber / Orange
];

export const CategoryDonutDial: React.FC<CategoryDonutDialProps> = ({
  categorySpending,
  totalExpense,
  hideBalances,
}) => {
  // 1. Process category slices: strictly top 4 categories (or top 3 + Other)
  const slices = useMemo(() => {
    if (totalExpense === 0 || categorySpending.length === 0) return [];

    const active = categorySpending.filter((c) => c.total > 0 && !c.isIncome);
    if (active.length === 0) return [];

    // If more than 4 categories, take top 3 and aggregate the rest into "Other"
    let displayList: { id: string; name: string; total: number; color: string }[] = [];
    if (active.length <= 4) {
      displayList = active.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        total: cat.total,
        color: REFERENCE_PALETTE[idx % REFERENCE_PALETTE.length],
      }));
    } else {
      const top3 = active.slice(0, 3);
      const rest = active.slice(3);
      const restTotal = rest.reduce((sum, c) => sum + c.total, 0);

      displayList = [
        ...top3.map((cat, idx) => ({
          id: cat.id,
          name: cat.name,
          total: cat.total,
          color: REFERENCE_PALETTE[idx],
        })),
        {
          id: 'cat_other',
          name: 'Other',
          total: restTotal,
          color: REFERENCE_PALETTE[3], // Orange for the 4th slice
        },
      ];
    }

    return displayList.map((item) => {
      const ratio = item.total / totalExpense;
      const percent = Math.round(ratio * 100);
      return {
        ...item,
        ratio,
        percent,
      };
    });
  }, [categorySpending, totalExpense]);

  // 2. SVG Donut Arc Geometry: Mathematical non-overlapping rounded caps
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2 - 6; // radius = 86
  const circumference = 2 * Math.PI * radius; // ~540.35

  const arcs = useMemo(() => {
    if (slices.length === 0) return [];

    const hasMultiple = slices.length > 1;
    // Each strokeLinecap="round" extends by strokeWidth (strokeWidth/2 at each end).
    // To have a visible dark gap of 10px between the rounded ends of adjacent slices:
    const visibleGap = 10;
    const deduction = hasMultiple ? strokeWidth + visibleGap : 0;
    let accumulatedRatio = 0;

    return slices.map((slice) => {
      const arcLength = slice.ratio * circumference;
      const visibleLength = Math.max(2, arcLength - deduction);
      // Offset starts at 12 o'clock (-90 deg), shifted forward by half deduction so caps center in slice slot
      const offset = -(accumulatedRatio * circumference + deduction / 2);
      accumulatedRatio += slice.ratio;

      return {
        ...slice,
        strokeDasharray: `${visibleLength} ${circumference - visibleLength}`,
        strokeDashoffset: offset,
      };
    });
  }, [slices, circumference, strokeWidth]);

  return (
    <div className="rounded-3xl border border-white/5 bg-[#14151a] p-6 shadow-xl transition-colors select-none">
      {/* 1. Card Header */}
      <h2 className="text-base font-semibold tracking-tight text-white">
        Category Breakdown
      </h2>

      {/* 2. Donut Graphic with Center Total */}
      <div className="mt-5 flex flex-col items-center justify-center">
        <div className="relative size-[220px] flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="rotate-[-90deg] overflow-visible"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Slices: zero background ring underneath to prevent visual artifacts */}
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

          {/* Center Cutout Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs font-medium text-slate-400">
              Total spent
            </span>
            <span className="mt-1 text-3xl font-bold font-sans tracking-tight text-white leading-none">
              {hideBalances ? '••••••' : formatCurrency(totalExpense, undefined, false)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Legend: Calm, spacious rows without harsh divider lines */}
      <div className="mt-7 flex flex-col space-y-3.5">
        {slices.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            No categorized expenses recorded in this period.
          </p>
        ) : (
          slices.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              {/* Left: Indicator Dot & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="size-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-slate-200 truncate">
                  {item.name}
                </span>
              </div>

              {/* Right: Percentage & Currency Amount */}
              <div className="flex items-center gap-6 shrink-0">
                <span className="text-sm font-sans text-slate-400 font-normal w-10 text-right">
                  {item.percent}%
                </span>
                <span className="text-sm font-sans font-semibold text-white w-20 text-right">
                  {hideBalances ? '••••••' : formatCurrency(item.total, undefined, false)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
