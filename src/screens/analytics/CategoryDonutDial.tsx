import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';
import { CategorySpendDrawer } from './CategorySpendDrawer';

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
  transactions: Transaction[];
  periodLabel?: string;
  hideBalances: boolean;
}

// Exactly 4 vibrant, high-contrast colors matching category_breakdown_donut_reference.png
const REFERENCE_PALETTE = [
  '#f43f5e', // Coral / Rose
  '#8b5cf6', // Violet / Purple
  '#38bdf8', // Sky / Cyan
  '#f59e0b', // Amber / Orange
];

interface DonutArcPath {
  id: string;
  name: string;
  total: number;
  percent: number;
  color: string;
  d: string;
  dx: number;
  dy: number;
}

/**
 * Generates an SVG path for a true 2D annular sector (donut wedge)
 * with exact circular outer/inner arcs, straight radial divider cuts,
 * and smooth corner fillets on all four corners.
 */
function describeAnnularSector({
  cx,
  cy,
  r,
  R,
  a1,
  a2,
  rc = 6,
}: {
  cx: number;
  cy: number;
  r: number;
  R: number;
  a1: number;
  a2: number;
  rc?: number;
}): string {
  const span = a2 - a1;
  if (span <= 0.001) return '';

  // Ensure corner fillet radius never exceeds physical sector geometry
  const maxRc = Math.min(rc, (R - r) / 2.1, (r * span) / 3.2);
  const effectiveRc = Math.max(0.5, maxRc);

  // Angular offset of fillet centers
  const dThetaOuter = Math.asin(effectiveRc / (R - effectiveRc));
  const dThetaInner = Math.asin(effectiveRc / (r + effectiveRc));

  // Radial distances to tangency points along the radial cut ray
  const dRadOuter = (R - effectiveRc) * Math.cos(dThetaOuter);
  const dRadInner = (r + effectiveRc) * Math.cos(dThetaInner);

  // Polar to Cartesian conversion (0 = 12 o'clock, clockwise)
  const toCartesian = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  // 1. Outer start tangent point on circle R
  const pOuterStart = toCartesian(a1 + dThetaOuter, R);
  // 2. Outer end tangent point on circle R
  const pOuterEnd = toCartesian(a2 - dThetaOuter, R);
  // 3. Radial cut at a2, outer fillet tangent
  const pRadOuterEnd = toCartesian(a2, dRadOuter);
  // 4. Radial cut at a2, inner fillet tangent
  const pRadInnerEnd = toCartesian(a2, dRadInner);
  // 5. Inner end tangent point on circle r
  const pInnerEnd = toCartesian(a2 - dThetaInner, r);
  // 6. Inner start tangent point on circle r
  const pInnerStart = toCartesian(a1 + dThetaInner, r);
  // 7. Radial cut at a1, inner fillet tangent
  const pRadInnerStart = toCartesian(a1, dRadInner);
  // 8. Radial cut at a1, outer fillet tangent
  const pRadOuterStart = toCartesian(a1, dRadOuter);

  const largeArcOuter = a2 - dThetaOuter - (a1 + dThetaOuter) > Math.PI ? 1 : 0;
  const largeArcInner = a2 - dThetaInner - (a1 + dThetaInner) > Math.PI ? 1 : 0;

  return [
    `M ${pOuterStart.x.toFixed(2)} ${pOuterStart.y.toFixed(2)}`,
    // Outer circular arc
    `A ${R} ${R} 0 ${largeArcOuter} 1 ${pOuterEnd.x.toFixed(2)} ${pOuterEnd.y.toFixed(2)}`,
    // Top-right corner fillet
    `A ${effectiveRc.toFixed(2)} ${effectiveRc.toFixed(2)} 0 0 1 ${pRadOuterEnd.x.toFixed(2)} ${pRadOuterEnd.y.toFixed(2)}`,
    // Straight radial cut at a2
    `L ${pRadInnerEnd.x.toFixed(2)} ${pRadInnerEnd.y.toFixed(2)}`,
    // Bottom-right corner fillet
    `A ${effectiveRc.toFixed(2)} ${effectiveRc.toFixed(2)} 0 0 1 ${pInnerEnd.x.toFixed(2)} ${pInnerEnd.y.toFixed(2)}`,
    // Inner circular arc (counter-clockwise)
    `A ${r} ${r} 0 ${largeArcInner} 0 ${pInnerStart.x.toFixed(2)} ${pInnerStart.y.toFixed(2)}`,
    // Bottom-left corner fillet
    `A ${effectiveRc.toFixed(2)} ${effectiveRc.toFixed(2)} 0 0 1 ${pRadInnerStart.x.toFixed(2)} ${pRadInnerStart.y.toFixed(2)}`,
    // Straight radial cut at a1
    `L ${pRadOuterStart.x.toFixed(2)} ${pRadOuterStart.y.toFixed(2)}`,
    // Top-left corner fillet
    `A ${effectiveRc.toFixed(2)} ${effectiveRc.toFixed(2)} 0 0 1 ${pOuterStart.x.toFixed(2)} ${pOuterStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export const CategoryDonutDial: React.FC<CategoryDonutDialProps> = ({
  categorySpending,
  totalExpense,
  transactions,
  periodLabel,
  hideBalances,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [drawerCategory, setDrawerCategory] = useState<DonutArcPath | null>(null);

  // Track IDs belonging to 'Other' when there are > 4 categories
  const otherCategoryIds = useMemo(() => {
    const active = categorySpending.filter((c) => c.total > 0 && !c.isIncome);
    if (active.length <= 4) return [];
    return active.slice(3).map((c) => c.id);
  }, [categorySpending]);

  // Global screen listener: clicking anywhere on the screen automatically resets selection
  useEffect(() => {
    if (!selectedId) return;
    const handleGlobalClick = () => {
      setSelectedId(null);
      setHoveredId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [selectedId]);

  // 1. Process category slices: top 3 + Other (or top 4)
  const slices = useMemo(() => {
    if (totalExpense === 0 || categorySpending.length === 0) return [];

    const active = categorySpending.filter((c) => c.total > 0 && !c.isIncome);
    if (active.length === 0) return [];

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
          color: REFERENCE_PALETTE[3],
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

  // 2. Exact Annular Sector Geometry matching category_breakdown_donut_reference.png
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const R = 93; // Outer radius
  const r = 69; // Inner radius (sleek 24px ring thickness)
  const rc = 3.5; // Subtle 3.5px corner fillet
  const gapAngle = 0.024; // Refined ~1.9px slim border gap between individual pies

  const arcPaths = useMemo<DonutArcPath[]>(() => {
    if (slices.length === 0) return [];

    // When only 1 slice exists, render a clean full hollow donut ring
    if (slices.length === 1) {
      return [
        {
          ...slices[0],
          d: `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A ${R} ${R} 0 1 0 ${cx} ${cy - R} M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`,
          dx: 0,
          dy: 0,
        },
      ];
    }

    // Start with a slight counter-clockwise angle offset (-0.3 rad / -17 deg) so top slice arches like the reference
    let currentAngle = -0.3;

    return slices.map((slice) => {
      const nominalSpan = slice.ratio * 2 * Math.PI;
      const a1 = currentAngle + gapAngle / 2;
      const a2 = currentAngle + nominalSpan - gapAngle / 2;
      currentAngle += nominalSpan;

      const d = describeAnnularSector({ cx, cy, r, R, a1, a2, rc });

      // Radial pop-out vector along bisector angle (6px outward slide)
      const centerAngle = (a1 + a2) / 2;
      const popDist = 6;
      const dx = popDist * Math.sin(centerAngle);
      const dy = -popDist * Math.cos(centerAngle);

      return {
        ...slice,
        d,
        dx,
        dy,
      };
    });
  }, [slices, cx, cy, R, r, rc, gapAngle]);

  const activeId = selectedId || hoveredId;
  const activeItem = arcPaths.find((a) => a.id === activeId);

  return (
    <div
      className="relative rounded-[28px] border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-6 shadow-xl select-none transition-colors overflow-hidden"
      onClick={() => setSelectedId(null)}
    >
      {/* Top Hairline Specular Reflection */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 dark:via-white/10 to-transparent" />

      {/* 1. Card Header matching reference */}
      <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
        Category Breakdown
      </h2>

      {/* 2. Donut Graphic with Center Total and Slice Pop-Out */}
      <div className="mt-4 flex flex-col items-center justify-center">
        <div className="relative size-[220px] flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
          >
            {arcPaths.map((arc) => {
              const isSelected = arc.id === activeId;
              const isDimmed = activeId !== null && !isSelected;

              return (
                <g
                  key={arc.id}
                  style={{
                    transform: isSelected
                      ? `translate(${arc.dx.toFixed(2)}px, ${arc.dy.toFixed(2)}px)`
                      : 'translate(0px, 0px)',
                    transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <path
                    d={arc.d}
                    fill={arc.color}
                    fillRule="evenodd"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId((prev) => (prev === arc.id ? null : arc.id));
                    }}
                    onMouseEnter={() => setHoveredId(arc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'cursor-pointer transition-all duration-300',
                      isSelected
                        ? 'filter drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] brightness-110'
                        : isDimmed
                        ? 'opacity-35 hover:opacity-75'
                        : 'opacity-100 hover:brightness-105'
                    )}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center Cutout Text with Dynamic Spotlight */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2 transition-all duration-300">
            {activeItem ? (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerCategory(activeItem);
                }}
                className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 pointer-events-auto cursor-pointer group select-none"
                title={`View ${activeItem.name} breakdown`}
              >
                <div className="flex items-center gap-1.5 justify-center max-w-[120px]">
                  <span
                    className="size-2 rounded-full shrink-0 animate-pulse"
                    style={{ backgroundColor: activeItem.color }}
                  />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {activeItem.name}
                  </span>
                </div>
                <span className="mt-1 text-2xl sm:text-[26px] font-bold font-mono tracking-tight text-slate-900 dark:text-white leading-none">
                  {hideBalances ? '••••••' : formatCurrency(activeItem.total, undefined, false)}
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 group-hover:brightness-110 font-mono transition-all">
                  <span>{activeItem.percent}% of spent</span>
                  <ChevronRight className="size-3" />
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in fade-in duration-200">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total spent
                </span>
                <span className="mt-1 text-2xl sm:text-[28px] font-bold font-mono tracking-tight text-slate-900 dark:text-white leading-none">
                  {hideBalances ? '••••••' : formatCurrency(totalExpense, undefined, false)}
                </span>
                <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {arcPaths.length} categories
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Category Legend matching category_breakdown_donut_reference.png */}
      <div className="mt-6 flex flex-col space-y-1.5">
        {arcPaths.map((item) => {
          const isSelected = item.id === activeId;
          const isDimmed = activeId !== null && !isSelected;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setDrawerCategory(item);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setDrawerCategory(item);
                }
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer select-none group',
                isSelected
                  ? 'bg-slate-100 dark:bg-white/[0.08] ring-1 ring-slate-300 dark:ring-white/15 shadow-sm'
                  : isDimmed
                  ? 'opacity-40 hover:opacity-80'
                  : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              )}
            >
              {/* Left: Indicator Dot & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="size-2.5 rounded-full shrink-0 shadow-sm transition-transform duration-200"
                  style={{
                    backgroundColor: item.color,
                    transform: isSelected ? 'scale(1.35)' : 'scale(1)',
                  }}
                />
                <span
                  className={cn(
                    'text-sm truncate transition-colors',
                    isSelected ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'
                  )}
                >
                  {item.name}
                </span>
              </div>

              {/* Right: Percentage & Currency Amount + Chevron */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-sm font-sans text-slate-400 font-normal w-9 text-right">
                  {item.percent}%
                </span>
                <span
                  className={cn(
                    'text-sm font-mono text-right transition-colors',
                    isSelected ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'
                  )}
                >
                  {hideBalances ? '••••••' : formatCurrency(item.total, undefined, false)}
                </span>
                <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Hint */}
      <p className="mt-4 text-center text-xs text-slate-500 font-normal select-none">
        Tap slice or category to inspect transactions
      </p>

      {/* 5. Deep Inspection Category Spend Drawer */}
      {drawerCategory && (
        <CategorySpendDrawer
          isOpen={!!drawerCategory}
          onClose={() => setDrawerCategory(null)}
          categoryId={drawerCategory.id === 'cat_other' ? otherCategoryIds : drawerCategory.id}
          categoryName={drawerCategory.name}
          categoryColor={drawerCategory.color}
          totalSpent={drawerCategory.total}
          periodLabel={periodLabel}
          transactions={transactions}
          hideBalances={hideBalances}
        />
      )}
    </div>
  );
};
