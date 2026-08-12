import { useState } from 'react';

/**
 * BarChart.jsx
 * SVG/CSS-based Bar Chart for Training Completion by Department.
 */
export default function BarChart({ data = [], title = 'Training Completion by Department (%)' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center text-xs text-slate-400">
        No department training data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400 font-medium">Completion Rate (%)</span>
      </div>

      <div className="space-y-3 pt-1">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const deptName = item?.department || item?.name || `Department ${idx + 1}`;
          const rawRate = item?.completionRate ?? item?.value ?? 50;
          const rate = typeof rawRate === 'number' && !isNaN(rawRate) ? Math.max(0, Math.min(100, rawRate)) : 50;

          return (
            <div
              key={idx}
              className="space-y-1 cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex justify-between text-xs">
                <span className={`font-semibold transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-700'}`}>
                  {deptName}
                </span>
                <span className="font-bold text-gray-900">{rate}%</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    rate >= 80
                      ? 'bg-emerald-500 group-hover:bg-emerald-600'
                      : rate >= 60
                      ? 'bg-blue-500 group-hover:bg-blue-600'
                      : 'bg-amber-500 group-hover:bg-amber-600'
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
