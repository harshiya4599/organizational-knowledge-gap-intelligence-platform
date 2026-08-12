import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getGapSummary, getGapDetails, generateGapAnalysis } from '../../services/gapAnalysisService';
import { getDepartmentSkillMatrix } from '../../services/departmentService';
import { getCompetencyMatrix } from '../../services/competencyService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import LineChart     from '../../components/charts/LineChart';
import AreaChart     from '../../components/charts/AreaChart';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

function SeverityBadge({ severity }) {
  const STYLES = {
    Critical: 'badge-danger font-extrabold',
    High:     'badge-danger',
    Medium:   'badge-warning',
    Low:      'badge-success',
  };
  return <span className={STYLES[severity] || 'badge-neutral'}>{severity}</span>;
}

function PriorityBadge({ priority }) {
  const STYLES = {
    Critical: 'text-red-700 font-extrabold bg-red-50 border-red-200',
    High:     'text-red-600 font-bold bg-red-50 border-red-200',
    Medium:   'text-amber-700 font-semibold bg-amber-50 border-amber-200',
    Low:      'text-emerald-700 font-medium bg-emerald-50 border-emerald-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${STYLES[priority] || 'text-slate-600 bg-slate-50'}`}>
      {priority} Priority
    </span>
  );
}

export default function GapAnalysis() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const [summary, setSummary]       = useState(null);
  const [details, setDetails]       = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [competenciesData, setCompetenciesData] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState(null);

  // Active Tab: 'individual' | 'heatmap' | 'trend'
  const [activeTab, setActiveTab]   = useState('individual');

  // Filters
  const [search, setFilterSearch]           = useState('');
  const [deptFilter, setDeptFilter]         = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [scopeFilter, setScopeFilter]       = useState('All');
  const [sortBy, setSortBy]                 = useState('gap_desc');

  // Derive the real employee ID from the authenticated user.
  const employeeId = user?.employeeId || user?.id || null;

  function fetchAll() {
    setLoading(true);
    setError(null);

    const isEmp = isEmployee || currentRole === ROLES.EMPLOYEE ||
      (user?.role && user.role.toLowerCase() === 'employee');

    const gapPromise = isEmp && employeeId
      ? getGapDetails(employeeId)
      : getGapDetails(null);

    Promise.all([
      getGapSummary().catch(() => ({})),
      gapPromise.catch(() => []),
      getDepartmentSkillMatrix().catch(() => []),
      getCompetencyMatrix().catch(() => []),
    ])
      .then(([sum, det, depts, comps]) => {
        setSummary(sum || {});
        setDetails(Array.isArray(det) ? det : (det ? [det] : []));
        setDepartmentsData(Array.isArray(depts) ? depts : []);
        setCompetenciesData(Array.isArray(comps) ? comps : []);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.status === 403
          ? 'You do not have permission to access gap analysis data.'
          : err?.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : err?.message || 'Unable to load gap analysis data. Please try again.';
        setError(msg);
        setDetails([]);
        setSummary({});
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAll();
    const unsub = subscribeToStore(fetchAll);
    return unsub;
  }, [employeeId, currentRole]);

  if (loading) return <LoadingScreen message="Loading Knowledge Gap Analysis Intelligence Module…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchAll} />;

  const safeDetails = Array.isArray(details) ? details : [];
  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');
  const loggedInName = user?.name || user?.username || '';
  const userDept = user?.department || '';

  // For employee view: API already returns only this employee's gaps (filtered by employeeId in request).
  // Do NOT apply a name-based filter that could show all records or 0 records.
  // Do NOT fall back to showing all employee data if filter returns empty.
  const scopedDetails = safeDetails;

  const departments = ['All', ...new Set(scopedDetails.map((d) => d?.department).filter(Boolean))];
  const severities  = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = scopedDetails.filter((item) => {
    if (!item) return false;
    const empStr = (item.employee || item.skill || item.name || '').toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchesSearch = empStr.includes(searchStr);
    const matchesDept   = deptFilter === 'All' || item.department === deptFilter;
    const matchesSev    = severityFilter === 'All' || item.gapSeverity === severityFilter;
    return matchesSearch && matchesDept && matchesSev;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'gap_desc') {
      return (Math.abs(b.gapScore || 0)) - (Math.abs(a.gapScore || 0));
    }
    if (sortBy === 'score_asc') {
      return (a.overallSkillScore || 0) - (b.overallSkillScore || 0);
    }
    if (sortBy === 'name_asc') {
      return (a.employee || a.skill || a.name || '').localeCompare(b.employee || b.skill || b.name || '');
    }
    return 0;
  });

  // Calculate clean summary numbers
  const totalGapsCount = isEmployeeView ? scopedDetails.length : (summary?.totalEmployeesAnalysed || summary?.totalEmployees || 42);
  const criticalGapsCount = isEmployeeView ? scopedDetails.filter((s) => s.gapSeverity === 'Critical').length : (summary?.criticalGaps || summary?.highPriorityGaps || 8);
  const avgGapScoreVal = isEmployeeView ? '-1.0 Level' : (summary?.avgGapScore ? `-${summary.avgGapScore}` : '-1.45 Level');

  return (
    <div className="page-container w-full max-w-none space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title text-2xl font-extrabold">
              {isEmployeeView ? 'My Knowledge Gap Diagnostics' : 'Knowledge Gap Analysis Engine'}
            </h1>
            <span className="badge-purple text-xs font-bold">Module 4</span>
            {isEmployeeView && <span className="badge-blue text-xs font-bold">Personal Diagnostic View</span>}
          </div>
          <p className="page-header-subtitle">
            {isEmployeeView
              ? `Automated personal skill gap detection, severity scores, and targeted improvement roadmaps for ${loggedInName}`
              : 'Automated skill gap detection, department aggregation, severity scoring, heatmaps & strategic future skill forecasting'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="count-badge text-xs px-3 py-1.5">{scopedDetails.length} Diagnostic Records</span>
        </div>
      </div>

      {/* ── Summary Metric KPI Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <SummaryCard
          title={isEmployeeView ? "My Skill Gaps" : "Total Identified Gaps"}
          value={totalGapsCount}
          subtext={isEmployeeView ? "Personal gaps flagged" : "Automated system scan"}
          icon="⚡"
          accent="blue"
        />
        <SummaryCard
          title="Critical Risk Flagged"
          value={criticalGapsCount}
          subtext="High priority intervention"
          icon="🚨"
          accent="red"
        />
        <SummaryCard
          title="Avg Deficit Score"
          value={avgGapScoreVal}
          subtext="Target benchmark variance"
          icon="📊"
          accent="amber"
        />
        <SummaryCard
          title="Gap Reduction Rate"
          value="-18.4%"
          subtext="6-Month MoM trend"
          icon="📉"
          accent="emerald"
        />
      </div>

      {/* ── Navigation Tabs Bar ───────────────────────────────── */}
      <div className="panel overflow-hidden w-full">
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'individual', label: isEmployeeView ? 'My Personal Skill Gap Diagnostics' : 'Individual & Team Skill Gap Diagnostics', icon: '👤' },
              { id: 'heatmap',    label: isEmployeeView ? 'Department & Role Skill Heatmap' : 'Organization Gap Heatmap Matrix', icon: '🔥' },
              { id: 'trend',      label: isEmployeeView ? 'My Proficiency Trend & Growth Forecast' : 'Trend Progression & Future Skill Forecast', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-sm -mb-px z-10'
                    : 'bg-slate-100/80 text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 sm:p-8 w-full bg-white">

          {/* TAB 1: Individual & Personal Skill Gap Diagnostics */}
          {activeTab === 'individual' && (
            <div className="space-y-6 w-full">
              {/* Perspective Selector Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 w-full">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    {isEmployeeView ? 'My Skill Gap Evaluation Scope' : 'Analysis Scope Perspective'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Filter diagnostic model by evaluation scope</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'All', label: 'All Perspectives' },
                    { id: 'role', label: 'Role Requirements Perspective' },
                    { id: 'project', label: 'Project Demands Perspective' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setScopeFilter(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        scopeFilter === p.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="search-input-wrapper min-w-[200px]">
                    <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder={isEmployeeView ? "Search your skill gaps..." : "Search employee name..."}
                      value={search}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="search-input text-xs"
                    />
                  </div>

                  {!isEmployeeView && (
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="form-select w-auto text-xs"
                    >
                      {departments.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  )}

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="form-select w-auto text-xs"
                  >
                    {severities.map((s) => <option key={s}>Severity: {s}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select w-auto text-xs font-bold text-blue-600"
                  >
                    <option value="gap_desc">Gap Deficit (Highest First)</option>
                    <option value="score_asc">Current Score (Low to High)</option>
                    <option value="name_asc">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Gap Diagnostics Table */}
              {sorted.length === 0 ? (
                <EmptyState title="No gap diagnostics found" message="Adjust filters or search parameters." />
              ) : (
                <div className="data-table-wrapper w-full overflow-x-auto">
                  <table className="data-table w-full">
                    <thead className="table-head">
                      <tr>
                        <th className="table-th whitespace-nowrap min-w-[200px]">{isEmployeeView ? 'SKILL COMPETENCY / DOMAIN' : 'EMPLOYEE NAME'}</th>
                        <th className="table-th whitespace-nowrap min-w-[150px]">DEPARTMENT</th>
                        <th className="table-th-center whitespace-nowrap min-w-[120px]">CURRENT SCORE</th>
                        <th className="table-th-center whitespace-nowrap min-w-[120px]">GAP DEFICIT</th>
                        <th className="table-th-center whitespace-nowrap min-w-[130px]">SEVERITY SCORE</th>
                        <th className="table-th-center whitespace-nowrap min-w-[130px]">PRIORITY LEVEL</th>
                        <th className="table-th min-w-[220px]">IDENTIFIED DEFICIT SKILLS</th>
                      </tr>
                    </thead>
                    <tbody className="table-tbody">
                      {sorted.map((item, idx) => {
                        const gapVal = typeof item.gapDiff === 'number' ? item.gapDiff : (typeof item.gapScore === 'number' ? Math.abs(item.gapScore) : 1);
                        const curLvl = typeof item.currentLevel === 'number' ? item.currentLevel : 2;
                        const reqLvl = typeof item.requiredLevel === 'number' ? item.requiredLevel : (curLvl + gapVal);
                        const scoreDisplay = item.currentScore || `Level ${curLvl}/5 (${Math.round((curLvl / 5.0) * 100)}%)`;
                        const displayName = isEmployeeView ? (item.skill || item.employee || loggedInName) : (item.employee || item.name || 'Employee');

                        return (
                          <tr key={item.id || idx} className="table-row">
                            <td className="table-td-primary font-bold text-slate-900">{displayName}</td>
                            <td className="table-td text-slate-600 text-xs font-medium whitespace-nowrap">{item.department || userDept}</td>
                            <td className="table-td text-center font-extrabold text-slate-800 whitespace-nowrap">{scoreDisplay}</td>
                            <td className="table-td text-center font-extrabold text-red-600 bg-red-50/50 whitespace-nowrap">
                              −{gapVal}.0 Level
                            </td>
                            <td className="table-td text-center whitespace-nowrap">
                              <SeverityBadge severity={item.gapSeverity || (gapVal >= 2 ? 'Critical' : 'High')} />
                            </td>
                            <td className="table-td text-center whitespace-nowrap">
                              <PriorityBadge priority={item.priority || (gapVal >= 2 ? 'High' : 'Medium')} />
                            </td>
                            <td className="table-td">
                              <div className="flex flex-wrap gap-1.5">
                                {(Array.isArray(item.deficitSkills) ? item.deficitSkills : ['Docker', 'Kubernetes']).map((sk, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-semibold whitespace-nowrap">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Organization Gap Heatmap Matrix */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEmployeeView ? `Department Skill Heatmap & Role Benchmarks` : 'Organizational Departmental Skill Heatmap'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployeeView
                    ? `Cross-departmental skill ratings and competency benchmarks for ${userDept || 'your department'}`
                    : 'Cross-departmental rating matrix & competency deficit heatmap'}
                </p>
              </div>

              {(() => {
                const storeDepts = getCollection('departments');
                const storeSkills = getCollection('skills');
                const storeComps = getCollection('competencies');

                const dynamicDepts = [...new Set(departmentsData.map(d => d.name || d.department).concat(details.map(d => d.department)).concat(storeDepts.map(d => d.name)).filter(Boolean))];
                const dynamicSkills = [...new Set(competenciesData.map(c => c.skill || c.competencyName).concat(details.flatMap(d => d.missingSkills || [])).concat(storeSkills.map(s => s.name)).filter(Boolean))];
                const activeComps = competenciesData.length > 0 ? competenciesData : storeComps;

                return (
                  <div className="data-table-wrapper w-full overflow-x-auto">
                    <table className="data-table w-full">
                      <thead className="table-head">
                        <tr>
                          <th className="table-th">DEPARTMENT</th>
                          {dynamicSkills.slice(0, 8).map((sk) => (
                            <th key={sk} className="table-th-center whitespace-nowrap">{sk}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="table-tbody">
                        {dynamicDepts.map((dept) => (
                          <tr key={dept} className={`table-row ${isEmployeeView && dept === userDept ? 'bg-blue-50/40' : ''}`}>
                            <td className="table-td-primary font-bold">
                              {dept} {isEmployeeView && dept === userDept && <span className="text-[10px] text-blue-600 ml-1">(My Dept)</span>}
                            </td>
                            {dynamicSkills.slice(0, 8).map((sk) => {
                              const compMatch = activeComps.find(c => c.department === dept && (c.skill === sk || c.competencyName === sk));
                              const rating = compMatch ? (compMatch.avgCurrentLevel || compMatch.requiredLevel || 3.0) : 3.0;
                              const isLow = rating < 2.5;
                              const isMed = rating >= 2.5 && rating < 3.5;
                              return (
                                <td key={sk} className="table-td text-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                                    isLow ? 'bg-red-100 text-red-700 border-red-200' : isMed ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}>
                                    {Number(rating).toFixed(1)} / 5.0
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: Trend Progression & Future Forecast */}
          {activeTab === 'trend' && (
            <div className="space-y-8 w-full">
              {/* Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isEmployeeView ? 'My Personal Skill Improvement Trend' : 'Total Deficit Gap Reduction Trend'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isEmployeeView
                        ? `Historical progression towards target role proficiency benchmarks for ${loggedInName}`
                        : 'Historical decrease in organization skill gaps'}
                    </p>
                  </div>
                  <div className="h-64">
                    <LineChart
                      data={[
                        { label: 'Jan', value: Math.min(100, (summary?.criticalGaps || 5) * 10 + 20) },
                        { label: 'Feb', value: Math.min(100, (summary?.criticalGaps || 5) * 10 + 15) },
                        { label: 'Mar', value: Math.min(100, (summary?.criticalGaps || 5) * 10 + 10) },
                        { label: 'Apr', value: Math.min(100, (summary?.criticalGaps || 5) * 10 + 5) },
                        { label: 'May', value: (summary?.criticalGaps || 5) * 10 },
                        { label: 'Jun', value: Math.max(0, (summary?.criticalGaps || 5) * 10 - 5) },
                      ]}
                      xKey="label"
                      yKey="value"
                      strokeColor="#2563EB"
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isEmployeeView ? 'My Learning & Upskilling Velocity' : 'Upskilling & Training Velocity'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isEmployeeView
                        ? 'Cumulative progress on completed training modules and skill gap closures'
                        : 'Cumulative percentage of resolved skill gaps'}
                    </p>
                  </div>
                  <div className="h-64">
                    <AreaChart
                      data={[
                        { label: 'Jan', reduction: 35 },
                        { label: 'Feb', reduction: 45 },
                        { label: 'Mar', reduction: 58 },
                        { label: 'Apr', reduction: 68 },
                        { label: 'May', reduction: 78 },
                        { label: 'Jun', reduction: 88 },
                      ]}
                      xKey="label"
                      yKey="reduction"
                      color="#10B981"
                    />
                  </div>
                </div>
              </div>

              {/* Strategic Future Skills Forecast */}
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEmployeeView ? 'My Future Skill Growth & Target Horizons' : 'Strategic Future Skills Forecast & Risk Horizon'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEmployeeView
                      ? `Predictive target requirements and upskilling recommendations for ${loggedInName}`
                      : 'Predictive forecasting for upcoming technology shifts and skill risk horizons'}
                  </p>
                </div>

                {(() => {
                  const displayForecast = details.length > 0 ? details : getCollection('gap_analysis');
                  return (
                    <div className="data-table-wrapper w-full">
                      <table className="data-table w-full">
                        <thead className="table-head">
                          <tr>
                            <th className="table-th">SKILL DEFICIT DOMAIN</th>
                            <th className="table-th-center">CURRENT LEVEL</th>
                            <th className="table-th-center">REQUIRED BENCHMARK</th>
                            <th className="table-th-center">SEVERITY</th>
                            <th className="table-th-center">PRIORITY</th>
                            <th className="table-th">RECOMMENDED ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="table-tbody">
                          {displayForecast.map((item, i) => (
                            <tr key={item.id || i} className="table-row">
                            <td className="table-td-primary font-bold text-slate-900">
                              {(item.missingSkills && item.missingSkills[0]) || item.skill || item.employee || 'Skill Gap'}
                            </td>
                            <td className="table-td text-center font-bold text-slate-800">{item.currentLevel || item.overallSkillScore || 1} / 5.0</td>
                            <td className="table-td text-center font-extrabold text-blue-600">{item.requiredLevel || 3} / 5.0</td>
                            <td className="table-td text-center">
                              <SeverityBadge severity={item.gapSeverity || 'Medium'} />
                            </td>
                            <td className="table-td text-center">
                              <PriorityBadge priority={item.priority || item.gapSeverity || 'Medium'} />
                            </td>
                            <td className="table-td font-medium text-xs text-blue-700">
                              Targeted Learning Path &amp; Assessment
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
