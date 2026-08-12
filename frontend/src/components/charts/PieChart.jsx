import { useState } from 'react';

const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

/**
 * PieChart.jsx
 * SVG-based Doughnut / Pie Chart for Skill Distribution by Category.
 */
export default function PieChart({ data = [], title = 'Skill Distribution by Category' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center text-xs text-slate-400">
        No category distribution data available.
      </div>
    );
  }

  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Safe normalized items
  const totalVal = data.reduce((acc, d) => acc + (d?.percentage ?? d?.value ?? 1), 0) || 100;
  const normalizedItems = data.map((item, idx) => {
    const rawPct = item?.percentage ?? (item?.value ? Math.round((item.value / totalVal) * 100) : 25);
    const pct = typeof rawPct === 'number' && !isNaN(rawPct) ? Math.max(1, rawPct) : 25;
    const cat = item?.category || item?.name || `Category ${idx + 1}`;
    const col = item?.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    return { category: cat, percentage: pct, color: col };
  });

  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Doughnut SVG */}
        <div className="relative shrink-0 w-[180px] h-[180px]">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
            {normalizedItems.map((item, idx) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percentage;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-gray-400">Total Skills</span>
            <span className="text-xl font-extrabold text-gray-800">100%</span>
          </div>
        </div>

        {/* Category Legend */}
        <div className="space-y-2 flex-1 w-full">
          {normalizedItems.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 font-medium">{item.category}</span>
                </div>
                <span className="font-bold text-gray-900">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
