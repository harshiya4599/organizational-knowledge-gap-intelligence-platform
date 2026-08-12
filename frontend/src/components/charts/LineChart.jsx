import { useState } from 'react';

/**
 * LineChart.jsx
 * SVG-based Line Chart for Monthly Skill Improvement Trend.
 */
const DEFAULT_TREND = [
  { label: 'Jan', value: 64, target: 80 },
  { label: 'Feb', value: 68, target: 80 },
  { label: 'Mar', value: 71, target: 80 },
  { label: 'Apr', value: 75, target: 80 },
  { label: 'May', value: 79, target: 80 },
  { label: 'Jun', value: 84, target: 80 },
];

export default function LineChart({ data = [], title = 'Monthly Skill Improvement (%)' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeData = Array.isArray(data) && data.length > 0 ? data : DEFAULT_TREND;

  const width = 500;
  const height = 220;
  const padding = 35;

  const maxValue = 100;
  const minValue = 0;

  const getVal = (d) => (typeof d?.value === 'number' ? d.value : typeof d?.rate === 'number' ? d.rate : 70);
  const getLabel = (d, i) => d?.label || d?.month || `M${i + 1}`;

  const getX = (idx) => padding + (idx * (width - 2 * padding)) / Math.max(1, safeData.length - 1);
  const getY = (val) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 70;
    const clamped = Math.max(minValue, Math.min(maxValue, num));
    return height - padding - ((clamped - minValue) / (maxValue - minValue)) * (height - 2 * padding);
  };

  const points = safeData.map((d, idx) => `${getX(idx)},${getY(getVal(d))}`).join(' ');

  // Gradient area points
  const firstX = getX(0);
  const lastX = getX(safeData.length - 1);
  const bottomY = height - padding;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-gray-500 font-medium">Actual Score</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-gray-400 inline-block" />
            <span className="text-gray-400 font-medium">Target</span>
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                <text x={padding - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Target line */}
          <line
            x1={padding}
            y1={getY(80)}
            x2={width - padding}
            y2={getY(80)}
            stroke="#94A3B8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Fill Area under line */}
          <polygon points={areaPoints} fill="url(#lineAreaGrad)" />

          {/* Spark line */}
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data Points */}
          {safeData.map((d, idx) => {
            const cx = getX(idx);
            const cy = getY(getVal(d));
            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#2563EB"
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
                      x={cx - 24}
                      y={cy - 26}
                      width={48}
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
                      {getVal(d)}%
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
