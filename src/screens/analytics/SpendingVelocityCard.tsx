import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatAdaptiveCardCurrency } from '../../domain/engine/moneyUtils';
import { formatDateDDMMYYYY } from '../../domain/engine/dateUtils';
import { Transaction } from '../../domain/models/types';
import { VelocitySpendDrawer } from './VelocitySpendDrawer';

interface SpendingVelocityCardProps {
  transactions: Transaction[];
  totalExpense: number;
  totalBudget: number;
  periodStart: Date;
  periodEnd: Date;
  hideBalances: boolean;
  timeframe?: 'WEEK' | 'MONTH' | 'YEAR';
  onSelectTransaction?: (tx: Transaction) => void;
}

interface DataPoint {
  day: number;
  dateStr: string;
  cumulative: number;
  daily: number;
}

interface XTick {
  day: number;
  label: string;
  x: number;
}

export const SpendingVelocityCard: React.FC<SpendingVelocityCardProps> = ({
  transactions,
  totalExpense,
  totalBudget,
  periodStart,
  periodEnd,
  hideBalances,
  timeframe,
  onSelectTransaction,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [selectedDayPoint, setSelectedDayPoint] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const activePoint = hoveredPoint || selectedDayPoint;

  // 1. Calculate number of days in the period
  const totalDays = useMemo(() => {
    const diffTime = Math.abs(periodEnd.getTime() - periodStart.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(days, 1);
  }, [periodStart, periodEnd]);


  // 3. Aggregate and smoothly interpolate cumulative velocity
  const { dataPoints, maxScale } = useMemo(() => {
    const dailyMap = new Map<number, number>();

    // Map expense transactions to day index
    transactions.forEach((tx) => {
      if (tx.type !== 'EXPENSE') return;
      const txDate = new Date(tx.date);
      if (txDate >= periodStart && txDate <= periodEnd) {
        const dayIndex = Math.min(
          totalDays,
          Math.max(1, Math.floor((txDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        );
        dailyMap.set(dayIndex, (dailyMap.get(dayIndex) || 0) + tx.amount);
      }
    });

    // Build raw cumulative trajectory
    const rawCumulatives: number[] = [];
    let running = 0;
    for (let day = 1; day <= totalDays; day++) {
      running += dailyMap.get(day) || 0;
      rawCumulatives.push(running);
    }

    const points: DataPoint[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const pointDate = new Date(periodStart);
      pointDate.setDate(periodStart.getDate() + (day - 1));
      const dateStr = formatDateDDMMYYYY(pointDate);

      points.push({
        day,
        dateStr,
        cumulative: rawCumulatives[day - 1],
        daily: dailyMap.get(day) || 0,
      });
    }

    // Dynamic Y-axis ceiling: 4 clean interval tiers matching reference image
    const effectiveSpend = Math.max(totalExpense, 100000);
    const targetCeiling = effectiveSpend * 1.05;
    const rawStep = targetCeiling / 4;
    // Choose clean step increment (multiples of ₹500 or ₹1,000)
    let step = 50000; // ₹500
    if (rawStep > 500000) {
      step = Math.ceil(rawStep / 50000) * 50000;
    } else {
      step = Math.ceil(rawStep / 25000) * 25000;
    }
    const maxScaleVal = Math.max(step * 4, 100000);

    return { dataPoints: points, maxScale: maxScaleVal };
  }, [transactions, periodStart, periodEnd, totalDays, totalExpense]);

  // 4. SVG Coordinates Mapping
  const chartWidth = 320;
  const chartHeight = 150;
  const paddingLeft = 36;
  const paddingRight = 10;
  const paddingTop = 14;
  const paddingBottom = 22;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (day: number) => {
    if (totalDays <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + ((day - 1) / (totalDays - 1)) * plotWidth;
  };

  const getY = (amount: number) => {
    if (maxScale === 0) return paddingTop + plotHeight;
    const ratio = Math.min(1, Math.max(0, amount / maxScale));
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  // 5. Generate smooth Monotone Cubic Hermite Spline (Fritsch-Carlson)
  const curvePoints = useMemo(() => {
    return dataPoints.map((p) => ({
      x: getX(p.day),
      y: getY(p.cumulative),
    }));
  }, [dataPoints, maxScale]);

  const pathD = useMemo(() => {
    const n = curvePoints.length;
    if (n === 0) return '';
    if (n === 1) return `M ${curvePoints[0].x.toFixed(2)} ${curvePoints[0].y.toFixed(2)}`;
    if (n === 2) {
      return `M ${curvePoints[0].x.toFixed(2)} ${curvePoints[0].y.toFixed(2)} L ${curvePoints[1].x.toFixed(2)} ${curvePoints[1].y.toFixed(2)}`;
    }

    // Calculate secant slopes between adjacent points
    const dxs: number[] = new Array(n - 1);
    const dys: number[] = new Array(n - 1);
    const slopes: number[] = new Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
      const dx = curvePoints[i + 1].x - curvePoints[i].x;
      const dy = curvePoints[i + 1].y - curvePoints[i].y;
      dxs[i] = dx;
      dys[i] = dy;
      slopes[i] = dx !== 0 ? dy / dx : 0;
    }

    // Tangents initialization
    const m: number[] = new Array(n);
    m[0] = slopes[0];
    m[n - 1] = slopes[n - 2];

    for (let i = 1; i < n - 1; i++) {
      if (slopes[i - 1] * slopes[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (slopes[i - 1] + slopes[i]) / 2;
      }
    }

    // Fritsch-Carlson monotonicity condition
    for (let i = 0; i < n - 1; i++) {
      if (slopes[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / slopes[i];
        const beta = m[i + 1] / slopes[i];
        const hyp = alpha * alpha + beta * beta;
        if (hyp > 9) {
          const tau = 3 / Math.sqrt(hyp);
          m[i] = tau * alpha * slopes[i];
          m[i + 1] = tau * beta * slopes[i];
        }
      }
    }

    // Convert Hermite intervals to cubic Bézier control points
    let d = `M ${curvePoints[0].x.toFixed(2)} ${curvePoints[0].y.toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = curvePoints[i];
      const p1 = curvePoints[i + 1];
      const dx = dxs[i];

      const cp1x = p0.x + dx / 3;
      const cp1y = p0.y + (m[i] * dx) / 3;
      const cp2x = p1.x - dx / 3;
      const cp2y = p1.y - (m[i + 1] * dx) / 3;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    }
    return d;
  }, [curvePoints]);

  // Closed area for subtle ambient gradient fill
  const areaD = useMemo(() => {
    if (curvePoints.length < 2 || !pathD) return '';
    const first = curvePoints[0];
    const last = curvePoints[curvePoints.length - 1];
    const bottomY = paddingTop + plotHeight;
    return `${pathD} L ${last.x.toFixed(2)} ${bottomY} L ${first.x.toFixed(2)} ${bottomY} Z`;
  }, [curvePoints, pathD, paddingTop, plotHeight]);

  // 6. Y-Axis Ticks (clean 5-tier grid with Cr, L, k scaling)
  const yTicks = useMemo(() => {
    const tiers = [1, 0.75, 0.5, 0.25, 0];
    return tiers.map((ratio) => {
      const value = maxScale * ratio;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      const inRupees = value / 100;
      let label = '0';
      if (inRupees >= 10000000) {
        const crVal = inRupees / 10000000;
        label = crVal % 1 === 0 ? `${crVal}Cr` : `${crVal.toFixed(1)}Cr`;
      } else if (inRupees >= 100000) {
        const lVal = inRupees / 100000;
        label = lVal % 1 === 0 ? `${lVal}L` : `${lVal.toFixed(1)}L`;
      } else if (inRupees >= 1000) {
        const kVal = inRupees / 1000;
        label = kVal % 1 === 0 ? `${kVal}k` : `${kVal.toFixed(1)}k`;
      } else if (inRupees > 0) {
        label = `${Math.round(inRupees)}`;
      }
      return { y, label, value };
    });
  }, [maxScale, paddingTop, plotHeight]);

  // 7. X-Axis Ticks dynamically computed based on selected timeline
  const xTicks = useMemo<XTick[]>(() => {
    if (totalDays <= 1) {
      return [{ day: 1, label: '1', x: paddingLeft + plotWidth / 2 }];
    }

    // A. Weekly Timeline (<= 7 days): show key weekdays (Mon, Wed, Fri, Sun)
    if (timeframe === 'WEEK' || totalDays <= 7) {
      const days = [1, 3, 5, 7].filter((d) => d <= totalDays);
      if (days[days.length - 1] !== totalDays) {
        days.push(totalDays);
      }
      return days.map((day) => {
        const d = new Date(periodStart);
        d.setDate(periodStart.getDate() + (day - 1));
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          day,
          label,
          x: getX(day),
        };
      });
    }

    // B. Monthly Timeline (8 to 35 days): show key milestone days (1, 10, 20, end of month)
    if (timeframe === 'MONTH' || (totalDays >= 8 && totalDays <= 35)) {
      const dayCandidates = [1, 10, 20, totalDays];
      const uniqueDays = Array.from(new Set(dayCandidates)).sort((a, b) => a - b);
      return uniqueDays.map((day) => ({
        day,
        label: `${day}`,
        x: getX(day),
      }));
    }

    // C. Yearly Timeline (>= 120 days): show quarterly/seasonal month labels (Jan, Apr, Jul, Oct, Dec)
    if (timeframe === 'YEAR' || totalDays >= 120) {
      const ratios = [0, 0.25, 0.5, 0.75, 1];
      return ratios.map((ratio) => {
        const day = Math.max(1, Math.min(totalDays, Math.round(1 + ratio * (totalDays - 1))));
        const d = new Date(periodStart);
        d.setDate(periodStart.getDate() + (day - 1));
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        return {
          day,
          label,
          x: getX(day),
        };
      });
    }

    // D. Custom intermediate range: 4 evenly spaced milestone dates
    const count = 4;
    const ticks: XTick[] = [];
    for (let i = 0; i < count; i++) {
      const ratio = i / (count - 1);
      const day = Math.max(1, Math.min(totalDays, Math.round(1 + ratio * (totalDays - 1))));
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + (day - 1));
      const label = formatDateDDMMYYYY(d);
      ticks.push({
        day,
        label,
        x: getX(day),
      });
    }
    return ticks;
  }, [timeframe, totalDays, periodStart, plotWidth, paddingLeft]);

  // 7. Interactive Scrubber Event Handlers (Scrubbing only - no sudden drawer jumps!)
  const handleTouchOrMouse = (clientX: number) => {
    if (!svgRef.current || dataPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedX = Math.max(paddingLeft, Math.min(paddingLeft + plotWidth, relativeX));
    const ratio = (clampedX - paddingLeft) / plotWidth;
    const targetDay = Math.round(ratio * (totalDays - 1)) + 1;
    const found = dataPoints.find((p) => p.day === targetDay) || dataPoints[dataPoints.length - 1];
    setHoveredPoint(found);
  };

  const handlePointClick = (clientX: number) => {
    if (!svgRef.current || dataPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedX = Math.max(paddingLeft, Math.min(paddingLeft + plotWidth, relativeX));
    const ratio = (clampedX - paddingLeft) / plotWidth;
    const targetDay = Math.round(ratio * (totalDays - 1)) + 1;
    const found = dataPoints.find((p) => p.day === targetDay) || dataPoints[dataPoints.length - 1];
    setHoveredPoint(found);
    setSelectedDayPoint(found);
  };

  return (
    <div
      ref={cardRef}
      className="relative rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-[#13151f] dark:to-[#0c0d14] p-5 sm:p-6 shadow-xl transition-all select-none overflow-hidden"
    >
      {/* Top Hairline Specular Reflection */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 dark:via-white/10 to-transparent" />

      {/* 1. Card Header: Clean title with view all chevron button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          Spending Velocity
        </h2>
        <button
          type="button"
          onClick={() => {
            setSelectedDayPoint(null);
            setIsDrawerOpen(true);
          }}
          aria-label="View all spending velocity details"
          className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all active:scale-90"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* 2. Hero Spend vs Budget Metric */}
      <div className="mt-3 flex items-baseline">
        <span className="text-3xl sm:text-[34px] font-bold font-mono tracking-tight text-slate-900 dark:text-white leading-none">
          {hideBalances
            ? '••••••'
            : formatAdaptiveCardCurrency(activePoint ? activePoint.cumulative : totalExpense, true, undefined, true)}
        </span>
        <span className="ml-2.5 text-sm font-sans text-slate-500 dark:text-slate-400 font-normal truncate">
          {activePoint
            ? `on ${activePoint.dateStr}`
            : `of ${formatAdaptiveCardCurrency(totalBudget, true, undefined, true)} budget`}
        </span>
      </div>

      {/* 3. The Velocity SVG Spline Canvas */}
      <div className="mt-4 relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair touch-none"
          onClick={(e) => {
            e.stopPropagation();
            handlePointClick(e.clientX);
          }}
          onMouseMove={(e) => handleTouchOrMouse(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) handleTouchOrMouse(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) handleTouchOrMouse(e.touches[0].clientX);
          }}
        >
          <defs>
            <linearGradient
              id="velocityGradient"
              x1="0"
              y1={paddingTop}
              x2="0"
              y2={paddingTop + plotHeight}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Hairline Gridlines and Y-Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={paddingLeft + plotWidth}
                y2={tick.y}
                stroke="currentColor"
                className="text-slate-200 dark:text-white/[0.07]"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-sans select-none"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Soft Glow Area Fill */}
          {areaD && <path d={areaD} fill="url(#velocityGradient)" />}

          {/* Smooth Cumulative Spending Velocity Spline Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Touch Scrubber Indicator */}
          {activePoint && (
            <g className="transition-all duration-150 ease-out">
              {/* Vertical inspection hairline */}
              <line
                x1={getX(activePoint.day)}
                y1={paddingTop}
                x2={getX(activePoint.day)}
                y2={paddingTop + plotHeight}
                stroke="#a78bfa"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.85"
              />

              {/* Concentric glowing radar beacon */}
              <circle
                cx={getX(activePoint.day)}
                cy={getY(activePoint.cumulative)}
                r="8"
                fill="#8b5cf6"
                opacity="0.25"
                className="animate-ping"
              />
              <circle
                cx={getX(activePoint.day)}
                cy={getY(activePoint.cumulative)}
                r="4.5"
                fill="#a78bfa"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-md"
              />

              {/* Floating micro-pill badge above/below scrubber point */}
              {(() => {
                const ptX = getX(activePoint.day);
                const ptY = getY(activePoint.cumulative);
                const isNearTop = ptY < paddingTop + 24;
                const badgeY = isNearTop ? ptY + 16 : ptY - 14;
                const badgeText = formatAdaptiveCardCurrency(activePoint.cumulative, true, undefined, true);
                const badgeW = Math.max(50, badgeText.length * 7 + 12);
                const clampedBadgeX = Math.max(paddingLeft + badgeW / 2, Math.min(paddingLeft + plotWidth - badgeW / 2, ptX));

                return (
                  <g>
                    <rect
                      x={clampedBadgeX - badgeW / 2}
                      y={badgeY - 8}
                      width={badgeW}
                      height="16"
                      rx="4"
                      className="fill-slate-900 dark:fill-[#1e1f29] stroke-violet-500/40"
                      strokeWidth="1"
                    />
                    <text
                      x={clampedBadgeX}
                      y={badgeY + 3.5}
                      textAnchor="middle"
                      className="fill-white text-[9px] font-mono font-semibold select-none"
                    >
                      {badgeText}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Dynamic Timeline Milestones and Ticks */}
          {xTicks.map((tick, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === xTicks.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            return (
              <g key={idx}>
                <line
                  x1={tick.x}
                  y1={paddingTop + plotHeight}
                  x2={tick.x}
                  y2={paddingTop + plotHeight + 3}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-white/15"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={chartHeight - 4}
                  textAnchor={anchor}
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] sm:text-[11px] font-sans select-none font-medium"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Single button appearing ONLY when user clicks on any date on the graph */}
      {selectedDayPoint && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.08] animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(true);
            }}
            className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-violet-900/20 active:scale-[0.98] transition-all"
          >
            <span>
              View transactions for {selectedDayPoint.dateStr}
              {selectedDayPoint.daily > 0
                ? ` (${formatAdaptiveCardCurrency(selectedDayPoint.daily, true, undefined, true)})`
                : ''}
            </span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* 5. Velocity Spend Drawer (Bottom Sheet) */}
      <VelocitySpendDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dayPoint={selectedDayPoint}
        transactions={transactions}
        periodStart={periodStart}
        periodEnd={periodEnd}
        totalExpense={totalExpense}
        totalBudget={totalBudget}
        hideBalances={hideBalances}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
};
