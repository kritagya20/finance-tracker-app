import React, { useState, useMemo, useRef } from 'react';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { Transaction } from '../../domain/models/types';

interface SpendingVelocityCardProps {
  transactions: Transaction[];
  totalExpense: number;
  totalBudget: number;
  periodStart: Date;
  periodEnd: Date;
  hideBalances: boolean;
}

interface DataPoint {
  day: number;
  dateStr: string;
  cumulative: number;
  daily: number;
}

export const SpendingVelocityCard: React.FC<SpendingVelocityCardProps> = ({
  transactions,
  totalExpense,
  totalBudget,
  periodStart,
  periodEnd,
  hideBalances,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 1. Calculate number of days in the period
  const totalDays = useMemo(() => {
    const diffTime = Math.abs(periodEnd.getTime() - periodStart.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(days, 1);
  }, [periodStart, periodEnd]);

  // 2. Aggregate cumulative expenses day-by-day across the period
  const { dataPoints, maxScale } = useMemo(() => {
    const points: DataPoint[] = [];
    const dailyMap = new Map<number, number>();

    // Map each expense transaction to day index (1-based)
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

    let runningTotal = 0;
    const today = new Date();
    // Determine how many days have elapsed if the period encompasses today
    const isCurrentPeriod = today >= periodStart && today <= periodEnd;
    const elapsedDays = isCurrentPeriod
      ? Math.min(totalDays, Math.max(1, Math.floor((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1))
      : totalDays;

    for (let day = 1; day <= totalDays; day++) {
      const dailySpend = dailyMap.get(day) || 0;
      if (day <= elapsedDays) {
        runningTotal += dailySpend;
      }
      
      const pointDate = new Date(periodStart);
      pointDate.setDate(periodStart.getDate() + (day - 1));
      const dateStr = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      points.push({
        day,
        dateStr,
        cumulative: day <= elapsedDays ? runningTotal : runningTotal,
        daily: dailySpend,
      });
    }

    // Determine scale: max of totalExpense, totalBudget, or minimum baseline (e.g. ₹10,000)
    const rawMax = Math.max(totalExpense, totalBudget, 100000); // 100000 paise = ₹1,000
    // Round scale up to a clean multiple
    const maxScaleVal = Math.ceil((rawMax * 1.1) / 50000) * 50000;

    return { dataPoints: points, maxScale: maxScaleVal };
  }, [transactions, periodStart, periodEnd, totalDays, totalExpense, totalBudget]);

  // 3. SVG Coordinates Mapping
  const chartWidth = 320;
  const chartHeight = 150;
  const paddingLeft = 38;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

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

  // 4. Generate smooth spline path
  const curvePoints = dataPoints.map((p) => ({
    x: getX(p.day),
    y: getY(p.cumulative),
  }));

  const pathD = useMemo(() => {
    if (curvePoints.length === 0) return '';
    if (curvePoints.length === 1) return `M ${curvePoints[0].x} ${curvePoints[0].y}`;

    let d = `M ${curvePoints[0].x} ${curvePoints[0].y}`;
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p0 = curvePoints[i];
      const p1 = curvePoints[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [curvePoints]);

  // Closed area for subtle gradient fill under curve
  const areaD = useMemo(() => {
    if (curvePoints.length < 2) return '';
    const first = curvePoints[0];
    const last = curvePoints[curvePoints.length - 1];
    const bottomY = paddingTop + plotHeight;
    return `${pathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [curvePoints, pathD, paddingTop, plotHeight]);

  // 5. Y-Axis Ticks (5 clean tiers)
  const yTicks = useMemo(() => {
    const tiers = [1, 0.75, 0.5, 0.25, 0];
    return tiers.map((ratio) => {
      const value = maxScale * ratio;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      // Format as "34k", "25.5k", "0k"
      const inRupees = value / 100;
      let label = '0k';
      if (inRupees >= 1000) {
        const kVal = inRupees / 1000;
        label = kVal % 1 === 0 ? `${kVal}k` : `${kVal.toFixed(1)}k`;
      } else if (inRupees > 0) {
        label = `${Math.round(inRupees)}`;
      }
      return { y, label, value };
    });
  }, [maxScale, paddingTop, plotHeight]);

  // 6. Interactive Scrubber Event Handlers
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

  return (
    <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm transition-colors select-none">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-theme-primary">
          Spending Velocity
        </span>
        <span className="text-xs font-medium text-theme-muted">
          Cumulative
        </span>
      </div>

      {/* 2. Hero Spend vs Budget Metric */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-theme-primary tabular-nums">
          {hideBalances ? '••••••' : formatCurrency(hoveredPoint ? hoveredPoint.cumulative : totalExpense)}
        </span>
        <span className="text-xs text-theme-muted font-medium">
          of {formatCurrency(totalBudget)} budget
        </span>
      </div>

      {/* 3. Scrubber Status Subtitle */}
      <div className="mt-1 h-4 flex items-center text-[11px] text-theme-muted font-medium">
        {hoveredPoint ? (
          <span className="text-violet-500 dark:text-violet-400 font-mono">
            {hoveredPoint.dateStr} (Day {hoveredPoint.day}) · +{formatCurrency(hoveredPoint.daily)} daily
          </span>
        ) : (
          <span>Traversing {totalDays} days in period</span>
        )}
      </div>

      {/* 4. The Velocity SVG Spline Canvas */}
      <div className="mt-3 relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair touch-none"
          onMouseMove={(e) => handleTouchOrMouse(e.clientX)}
          onMouseLeave={() => setHoveredPoint(null)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) handleTouchOrMouse(e.touches[0].clientX);
          }}
          onTouchEnd={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines and Y-Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={paddingLeft + plotWidth}
                y2={tick.y}
                stroke="currentColor"
                className="text-theme-border/50"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                className="fill-theme-muted text-[10px] font-mono select-none"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#velocityGradient)" />}

          {/* Cumulative Spending Velocity Spline Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Touch Scrubber Indicator */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.day)}
                y1={paddingTop}
                x2={getX(hoveredPoint.day)}
                y2={paddingTop + plotHeight}
                stroke="#8b5cf6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <circle
                cx={getX(hoveredPoint.day)}
                cy={getY(hoveredPoint.cumulative)}
                r="5"
                fill="#8b5cf6"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-md"
              />
            </g>
          )}

          {/* X-Axis Bound Labels (Day 1 on Left, Day N on Right) */}
          <text
            x={paddingLeft}
            y={chartHeight - 4}
            textAnchor="start"
            className="fill-theme-muted text-[11px] font-mono select-none font-medium"
          >
            1
          </text>
          <text
            x={paddingLeft + plotWidth}
            y={chartHeight - 4}
            textAnchor="end"
            className="fill-theme-muted text-[11px] font-mono select-none font-medium"
          >
            {totalDays}
          </text>
        </svg>
      </div>
    </div>
  );
};
