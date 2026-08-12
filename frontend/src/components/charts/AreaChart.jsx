import { useState } from 'react';

/**
 * AreaChart.jsx
 * SVG-based Area Chart for Gap Reduction Trend.
 */
const DEFAULT_AREA_TREND = [
  { label: 'Jan', criticalGaps: 18, totalGaps: 34 },
  { label: 'Feb', criticalGaps: 15, totalGaps: 28 },
  { label: 'Mar', criticalGaps: 11, totalGaps: 22 },
  { label: 'Apr', criticalGaps: 8,  totalGaps: 16 },
  { label: 'May', criticalGaps: 5,  totalGaps: 11 },
  { label: 'Jun', criticalGaps: 3,  totalGaps: 6 },
];

export default function AreaChart({ data = [], title = 'Gap Reduction Trend' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeData = Array.isArray(data) && data.length > 0 ? data : DEFAULT_AREA_TREND;

  const width = 500;
  const height = 220;
  const padding = 35;

  const getGaps = (d) => (typeof d?.criticalGaps === 'number' ? d.criticalGaps : typeof d?.critical === 'number' ? d.critical : typeof d?.value === 'number' ? d.value : 10);
  const getLabel = (d, i) => d?.label || d?.month || `M${i + 1}`;

  const gapVals = safeData.map(getGaps);
  const maxGap = Math.max(20, ...gapVals);
  const minGap = 0;

  const getX = (idx) => padding + (idx * (width - 2 * padding)) / Math.max(1, safeData.length - 1);
  const getY = (val) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    const clamped = Math.max(minGap, Math.min(maxGap, num));
    return height - padding - ((clamped - minGap) / Math.max(1, maxGap - minGap)) * (height - 2 * padding);
  };

  const criticalPoints = safeData.map((d, idx) => `${getX(idx)},${getY(getGaps(d))}`).join(' ');
  const firstX = getX(0);
  const lastX = getX(safeData.length - 1);
  const bottomY = height - padding;

  const criticalArea = `${firstX},${bottomY} ${criticalPoints} ${lastX},${bottomY}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span className="text-gray-500 font-medium">Critical Gaps</span>
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, Math.round(maxGap * 0.33), Math.round(maxGap * 0.66), maxGap].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                <text x={padding - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area polygon */}
          <polygon points={criticalArea} fill="url(#areaGrad)" />

          {/* Stroke line */}
          <polyline
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={criticalPoints}
          />

          {/* Data Points */}
          {safeData.map((d, idx) => {
            const cx = getX(idx);
            const cy = getY(getGaps(d));
            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#7C3AED"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* X-axis Label */}
                <text x={cx} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="500">
                  {getLabel(d, idx)}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 28}
                      y={cy - 26}
                      width={56}
                      height={20}
                      rx={4}
                      fill="#1E293B"
                    />
                    <text
                      x={cx}
                      y={cy - 13}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#FFFFFF"
                      fontWeight="bold"
                    >
                      {getGaps(d)} Gaps
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
