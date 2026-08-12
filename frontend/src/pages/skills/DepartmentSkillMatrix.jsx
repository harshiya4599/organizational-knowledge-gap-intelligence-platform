import { useState, useEffect } from 'react';
import {
  getDepartmentSkillMatrix,
  getSkillHeatmapData,
} from '../../services/departmentService';
import { subscribeToStore } from '../../utils/hybridStore';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const TIER_STYLES = {
  '90_100': {
    bg: 'bg-emerald-700 text-white hover:bg-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    label: '90-100%',
  },
  '75_89': {
    bg: 'bg-emerald-400 text-slate-950 hover:bg-emerald-500 font-semibold',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    label: '75-89%',
  },
  '60_74': {
    bg: 'bg-amber-300 text-amber-950 hover:bg-amber-400 font-semibold',
    badgeBg: 'bg-amber-100 text-amber-800',
    label: '60-74%',
  },
  '40_59': {
    bg: 'bg-orange-400 text-white hover:bg-orange-500',
    badgeBg: 'bg-orange-100 text-orange-800',
    label: '40-59%',
  },
  below_40: {
    bg: 'bg-red-600 text-white hover:bg-red-700',
    badgeBg: 'bg-red-100 text-red-800',
    label: '< 40%',
  },
};

function HealthBadge({ status }) {
  const STYLES = {
    Excellent:           'bg-emerald-100 text-emerald-800 border-emerald-200',
    Good:                'bg-blue-100 text-blue-800 border-blue-200',
    'Needs Improvement': 'bg-amber-100 text-amber-800 border-amber-200',
    Critical:            'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
        STYLES[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const STYLES = {
    High:   'text-red-700 font-bold bg-red-50 border-red-200',
    Medium: 'text-amber-700 font-semibold bg-amber-50 border-amber-200',
    Low:    'text-emerald-700 font-medium bg-emerald-50 border-emerald-200',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs border ${STYLES[priority] || 'text-gray-600 bg-gray-50'}`}
    >
      {priority} Priority
    </span>
  );
}

function CompetencyProgressBar({ value, health }) {
  const BAR_COLOR =
    health === 'Excellent'
      ? 'bg-emerald-500'
      : health === 'Good'
      ? 'bg-blue-500'
      : health === 'Needs Improvement'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs font-medium text-gray-600">
        <span>Competency</span>
        <span className="font-bold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${BAR_COLOR}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HeatmapCell({ cell }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const style = TIER_STYLES[cell.tier] || TIER_STYLES.below_40;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`h-12 w-full flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-150 cursor-pointer shadow-xs transform hover:scale-105 hover:z-20 ${style.bg}`}
      >
        <span className="font-extrabold">{cell.competencyScore}%</span>
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white rounded-xl p-3 text-xs shadow-xl border border-slate-700 pointer-events-none transition-all">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <span className="font-bold text-indigo-300">{cell.department}</span>
            <span className="font-semibold text-slate-400">{cell.skill}</span>
          </div>

          <div className="space-y-1.5 leading-tight">
            <div className="flex justify-between">
              <span className="text-slate-400">Competency:</span>
              <span className="font-bold text-emerald-400">{cell.competencyScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gap:</span>
              <span className="font-bold text-red-400">{cell.gapScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Employees:</span>
              <span className="font-semibold text-white">{cell.employeesCovered} covered</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Training:</span>
              <span
                className={`font-semibold ${
                  cell.competencyScore < 60 ? 'text-red-400 font-bold' : 'text-emerald-300'
                }`}
              >
                {cell.trainingRequired}
              </span>
            </div>
          </div>

          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

const DEPT_MATRIX_COLUMNS = [
  { label: 'Department Name',   key: 'department' },
  { label: 'Category',          key: 'category' },
  { label: 'Employee Count',    key: 'employeeCount' },
  { label: 'Avg Skill Score',   key: 'avgSkillScore' },
  { label: 'Avg Gap Score',     key: 'avgGapScore' },
  { label: 'Competency %',      key: 'competencyScore' },
  { label: 'Health Status',     key: 'healthStatus' },
  { label: 'Training Priority', key: 'trainingPriority' },
  { label: 'Critical Skills',   key: 'criticalSkills' },
];

export default function DepartmentSkillMatrix() {
  const [matrixData, setMatrixData]   = useState([]);
  const [heatmapCells, setHeatmapCells]= useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [hmDeptFilter, setHmDeptFilter]     = useState('All');
  const [hmCatFilter, setHmCatFilter]       = useState('All');
  const [hmTierFilter, setHmTierFilter]     = useState('All');

  const [search, setSearch]                 = useState('');
  const [deptFilter, setDeptFilter]         = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [healthFilter, setHealthFilter]     = useState('All');
  const [sortBy, setSortBy]                 = useState('score_desc');

  function fetchData() {
    setLoading(true);
    setError(null);
    Promise.all([getDepartmentSkillMatrix(), getSkillHeatmapData()])
      .then(([mats, hms]) => {
        setMatrixData(Array.isArray(mats) ? mats : []);
        setHeatmapCells(Array.isArray(hms) ? hms : []);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.status === 403
          ? 'You do not have permission to view the department skill matrix.'
          : err?.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : err?.message || 'Failed to load matrix & heatmap data.';
        setError(msg);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
    const unsub = subscribeToStore(fetchData);
    return unsub;
  }, []);

  if (loading) return <LoadingScreen message="Generating Interactive Skill Heatmap & Matrix…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  const hmDepartments = ['All', ...new Set(heatmapCells.map((c) => c.department))];
  const hmCategories  = ['All', ...new Set(heatmapCells.map((c) => c.category))];
  const hmSkills      = [...new Set(heatmapCells.map((c) => c.skill))];

  const filteredHeatmap = heatmapCells.filter((cell) => {
    const matchDept = hmDeptFilter === 'All' || cell.department === hmDeptFilter;
    const matchCat  = hmCatFilter === 'All' || cell.category === hmCatFilter;
    const matchTier = hmTierFilter === 'All' || cell.tier === hmTierFilter;
    return matchDept && matchCat && matchTier;
  });

  const sortedCells = [...heatmapCells].sort((a, b) => b.competencyScore - a.competencyScore);
  const highestCell = sortedCells[0];
  const lowestCell  = sortedCells[sortedCells.length - 1];

  const totalComp = heatmapCells.reduce((acc, curr) => acc + curr.competencyScore, 0);
  const avgOrgComp = heatmapCells.length > 0 ? (totalComp / heatmapCells.length).toFixed(1) : 0;
  const criticalSkillAreasCount = heatmapCells.filter((c) => c.competencyScore < 40).length;

  const departments = ['All', ...new Set(matrixData.map((d) => d.department))];
  const categories  = ['All', ...new Set(matrixData.map((d) => d.category))];
  const healthLevels= ['All', 'Excellent', 'Good', 'Needs Improvement', 'Critical'];

  const filteredMatrix = matrixData.filter((item) => {
    if (!item) return false;
    const query = (search || '').toLowerCase();
    const deptName = (item.department || '').toLowerCase();
    const catName = (item.category || '').toLowerCase();
    const critSkills = Array.isArray(item.criticalSkills) ? item.criticalSkills : [];

    const matchesSearch =
      deptName.includes(query) ||
      catName.includes(query) ||
      critSkills.some((s) => (s || '').toLowerCase().includes(query));

    const matchesDept = deptFilter === 'All' || item.department === deptFilter;
    const matchesCat  = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesHlt  = healthFilter === 'All' || item.healthStatus === healthFilter;

    return matchesSearch && matchesDept && matchesCat && matchesHlt;
  });

  const PRIO_RANK = { High: 3, Medium: 2, Low: 1 };
  const sortedMatrix = [...filteredMatrix].sort((a, b) => {
    const scoreA = typeof a.competencyScore === 'number' ? a.competencyScore : 70;
    const scoreB = typeof b.competencyScore === 'number' ? b.competencyScore : 70;
    const gapA = typeof a.avgGapScore === 'number' ? a.avgGapScore : 0.8;
    const gapB = typeof b.avgGapScore === 'number' ? b.avgGapScore : 0.8;

    if (sortBy === 'score_desc') return scoreB - scoreA;
    if (sortBy === 'gap_desc') return gapB - gapA;
    if (sortBy === 'priority_desc') return (PRIO_RANK[b.trainingPriority] || 0) - (PRIO_RANK[a.trainingPriority] || 0);
    if (sortBy === 'name_asc') return (a.department || '').localeCompare(b.department || '');
    return 0;
  });

  return (
    <div className="page-container space-y-12">
      {/* ── SECTION 1: INTERACTIVE SKILL HEATMAP ──────────────────────── */}
      <div className="space-y-6">
        <div>
          <h1 className="page-header-title">Department Skill Heatmap &amp; Matrix</h1>
          <p className="page-header-subtitle">
            Visualizing department-wide skill proficiencies, skill gaps, and critical learning needs.
          </p>
        </div>

        {/* Heatmap KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard
            title="Highest Competency"
            value={highestCell ? `${highestCell.competencyScore}%` : 'N/A'}
            subtext={highestCell ? `${highestCell.skill} (${highestCell.department})` : ''}
            icon="🌟"
            accent="emerald"
          />
          <SummaryCard
            title="Lowest Competency"
            value={lowestCell ? `${lowestCell.competencyScore}%` : 'N/A'}
            subtext={lowestCell ? `${lowestCell.skill} (${lowestCell.department})` : ''}
            icon="🚨"
            accent="red"
          />
          <SummaryCard
            title="Avg Org Competency"
            value={`${avgOrgComp}%`}
            subtext="Across all skills"
            icon="📈"
            accent="blue"
          />
          <SummaryCard
            title="Critical Skill Areas"
            value={criticalSkillAreasCount}
            subtext="Competency below 40%"
            icon="⚠️"
            accent="amber"
          />
        </div>

        {/* Export Toolbar */}
        <ExportToolbar
          data={sortedMatrix}
          columns={DEPT_MATRIX_COLUMNS}
          filename="department_skill_matrix_report"
          title="Export Department Matrix Report"
        />

        {/* Color Legend & Filters Bar */}
        <div className="filter-bar space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Competency Legend
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold">
                90-100% (Dark Green)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-400 text-slate-950 font-semibold">
                75-89% (Light Green)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-300 text-slate-950 font-semibold">
                60-74% (Yellow)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-400 text-white font-semibold">
                40-59% (Orange)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white font-semibold">
                Below 40% (Red)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="hm-dept-filter" className="form-label">
                Department
              </label>
              <select
                id="hm-dept-filter"
                value={hmDeptFilter}
                onChange={(e) => setHmDeptFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                {hmDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hm-cat-filter" className="form-label">
                Skill Category
              </label>
              <select
                id="hm-cat-filter"
                value={hmCatFilter}
                onChange={(e) => setHmCatFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                {hmCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hm-tier-filter" className="form-label">
                Competency Range
              </label>
              <select
                id="hm-tier-filter"
                value={hmTierFilter}
                onChange={(e) => setHmTierFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                <option value="All">All Competency Ranges</option>
                <option value="90_100">90-100% (Dark Green)</option>
                <option value="75_89">75-89% (Light Green)</option>
                <option value="60_74">60-74% (Yellow)</option>
                <option value="40_59">40-59% (Orange)</option>
                <option value="below_40">Below 40% (Red)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Heatmap Matrix Display / Empty State */}
        {filteredHeatmap.length === 0 ? (
          <EmptyState
            title="No heatmap data matches current filters"
            message="Try resetting department, category, or competency range filters."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 overflow-hidden space-y-4">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-bold text-gray-700 bg-gray-50 rounded-tl-lg border-b border-gray-200 min-w-[140px]">
                      Department \ Skill
                    </th>
                    {hmSkills.map((sk) => (
                      <th
                        key={sk}
                        className="p-3 font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 whitespace-nowrap min-w-[100px]"
                      >
                        {sk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hmDepartments
                    .filter((d) => d !== 'All' && (hmDeptFilter === 'All' || d === hmDeptFilter))
                    .map((dept) => (
                      <tr key={dept} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-left font-bold text-gray-800 bg-gray-50/80 whitespace-nowrap">
                          {dept}
                        </td>
                        {hmSkills.map((sk) => {
                          const cell = filteredHeatmap.find(
                            (c) => c.department === dept && c.skill === sk
                          );

                          return (
                            <td key={sk} className="p-1.5 min-w-[100px]">
                              {cell ? (
                                <HeatmapCell cell={cell} />
                              ) : (
                                <div className="h-12 w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px]">
                                  N/A
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="block sm:hidden space-y-4">
              {hmDepartments
                .filter((d) => d !== 'All' && (hmDeptFilter === 'All' || d === hmDeptFilter))
                .map((dept) => (
                  <div key={dept} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <h4 className="font-bold text-sm text-gray-800 border-b border-gray-100 pb-1">
                      {dept}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {hmSkills.map((sk) => {
                        const cell = filteredHeatmap.find(
                          (c) => c.department === dept && c.skill === sk
                        );

                        if (!cell) return null;
                        const style = TIER_STYLES[cell.tier] || TIER_STYLES.below_40;

                        return (
                          <div
                            key={sk}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${style.bg}`}
                          >
                            <span className="truncate mr-1">{sk}</span>
                            <span>{cell.competencyScore}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: DEPARTMENT ANALYTICS & SKILL MATRIX TABLE ──────── */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Department Competency Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Department-level competency health scores, average gap metrics, and critical skills list.
          </p>
        </div>

        <div className="filter-bar space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="search-input-wrapper flex-1">
              <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="dept-matrix-search"
                type="text"
                placeholder="Search by department name, category, or skill…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort By:</span>
              <select
                id="dept-matrix-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select text-sm"
              >
                <option value="score_desc">Highest Skill Score</option>
                <option value="gap_desc">Highest Gap Score</option>
                <option value="priority_desc">Training Priority</option>
                <option value="name_asc">Department Name</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label htmlFor="dept-matrix-dept-filter" className="form-label">
                Department
              </label>
              <select
                id="dept-matrix-dept-filter"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dept-matrix-cat-filter" className="form-label">
                Skill Category
              </label>
              <select
                id="dept-matrix-cat-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dept-matrix-health-filter" className="form-label">
                Competency Level
              </label>
              <select
                id="dept-matrix-health-filter"
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="form-select text-xs w-full"
              >
                {healthLevels.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {sortedMatrix.length === 0 ? (
          <EmptyState
            title="No departments found"
            message="Try adjusting your search query, skill category, or competency filter."
          />
        ) : (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="table-head">
                  <tr>
                    <th className="table-th">
                      Department Name
                    </th>
                    <th className="table-th-center">
                      Employees
                    </th>
                    <th className="table-th-center">
                      Avg Skill Score
                    </th>
                    <th className="table-th-center">
                      Avg Gap Score
                    </th>
                    <th className="table-th">
                      Critical Skills
                    </th>
                    <th className="table-th w-44">
                      Competency Status
                    </th>
                    <th className="table-th">
                      Training Priority
                    </th>
                    <th className="table-th">
                      Health Score
                    </th>
                  </tr>
                </thead>
                <tbody className="table-tbody">
                  {sortedMatrix.map((dept, idx) => {
                    const avgSkill = typeof dept.avgSkillScore === 'number' ? dept.avgSkillScore : 3.6;
                    const avgGap = typeof dept.avgGapScore === 'number' ? dept.avgGapScore : 0.8;
                    const critList = Array.isArray(dept.criticalSkills) && dept.criticalSkills.length > 0
                      ? dept.criticalSkills
                      : (dept.topSkill ? [dept.topSkill] : ['Core Architecture']);
                    const compVal = typeof dept.competencyScore === 'number' ? dept.competencyScore : 75;
                    const healthSt = dept.healthStatus || (compVal >= 80 ? 'Excellent' : compVal >= 70 ? 'Good' : 'Needs Improvement');

                    return (
                      <tr
                        key={dept.id || idx}
                        className="table-row"
                      >
                        <td className="table-td-primary whitespace-nowrap">
                          <p className="font-bold text-slate-900">{dept.department || 'Department'}</p>
                          <span className="chip-slate text-[10px] mt-0.5">{dept.category || 'General'}</span>
                        </td>
                        <td className="table-td text-center font-semibold text-slate-700 whitespace-nowrap">
                          {dept.employeeCount || 2}
                        </td>
                        <td className="table-td text-center whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {Number(avgSkill).toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400"> / 5.0</span>
                        </td>
                        <td className="table-td text-center whitespace-nowrap">
                          <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                            −{Number(avgGap).toFixed(1)}
                          </span>
                        </td>
                        <td className="table-td max-w-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {critList.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="chip"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="table-td whitespace-nowrap">
                          <CompetencyProgressBar
                            value={compVal}
                            health={healthSt}
                          />
                        </td>
                        <td className="table-td whitespace-nowrap">
                          <PriorityBadge priority={dept.trainingPriority || (avgGap >= 1.0 ? 'High' : 'Medium')} />
                        </td>
                        <td className="table-td whitespace-nowrap">
                          <HealthBadge status={healthSt} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {sortedMatrix.length} of {matrixData.length} departments</span>
              {sortedMatrix.length < matrixData.length && (
                <span className="text-blue-600 font-semibold">Filtered results active</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
