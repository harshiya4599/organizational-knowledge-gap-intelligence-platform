import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getGapSummary, getGapDetails } from '../../services/gapAnalysisService';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import LineChart     from '../../components/charts/LineChart';
import AreaChart     from '../../components/charts/AreaChart';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

function SeverityBadge({ severity }) {
  const SEVERITY_STYLES = {
    Critical: 'badge-danger',
    High:     'badge-orange',
    Medium:   'badge-warning',
    Low:      'badge-success',
  };

  return (
    <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${SEVERITY_STYLES[severity] || 'badge-neutral'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        severity === 'Critical' ? 'bg-red-500' : severity === 'High' ? 'bg-orange-500' : severity === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'
      }`}></span>
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const PRIORITY_STYLES = {
    Critical: 'text-red-700 font-extrabold bg-red-50 border border-red-200',
    High:     'text-orange-700 font-bold bg-orange-50 border border-orange-200',
    Medium:   'text-amber-800 font-bold bg-amber-50 border border-amber-200',
    Low:      'text-emerald-700 font-bold bg-emerald-50 border border-emerald-200',
  };

  return (
    <span className={`whitespace-nowrap inline-block px-2.5 py-1 text-xs rounded-lg ${PRIORITY_STYLES[priority] || 'text-slate-600 font-medium'}`}>
      {priority} Priority
    </span>
  );
}

/* ─── Mock Organization Gap Heatmap Data ─────────────────── */
const HEATMAP_DEPARTMENTS = ['Engineering', 'Data Science', 'Finance', 'Marketing', 'Operations', 'Human Resources'];
const HEATMAP_SKILLS = ['React / Frontend', 'Docker / DevSecOps', 'Python / ML', 'System Architecture', 'Financial Analytics', 'Project Delivery'];

const HEATMAP_MATRIX = {
  'Engineering':          { 'React / Frontend': 4.2, 'Docker / DevSecOps': 2.4, 'Python / ML': 3.0, 'System Architecture': 3.8, 'Financial Analytics': 2.0, 'Project Delivery': 4.0 },
  'Data Science':         { 'React / Frontend': 2.5, 'Docker / DevSecOps': 3.2, 'Python / ML': 4.5, 'System Architecture': 3.2, 'Financial Analytics': 3.8, 'Project Delivery': 3.5 },
  'Finance':              { 'React / Frontend': 1.5, 'Docker / DevSecOps': 1.8, 'Python / ML': 2.5, 'System Architecture': 2.0, 'Financial Analytics': 4.6, 'Project Delivery': 3.8 },
  'Marketing':            { 'React / Frontend': 3.0, 'Docker / DevSecOps': 1.5, 'Python / ML': 2.0, 'System Architecture': 1.8, 'Financial Analytics': 3.0, 'Project Delivery': 4.2 },
  'Operations':           { 'React / Frontend': 2.0, 'Docker / DevSecOps': 2.5, 'Python / ML': 2.2, 'System Architecture': 2.8, 'Financial Analytics': 3.5, 'Project Delivery': 4.5 },
  'Human Resources':      { 'React / Frontend': 1.8, 'Docker / DevSecOps': 1.2, 'Python / ML': 1.5, 'System Architecture': 1.5, 'Financial Analytics': 3.2, 'Project Delivery': 4.0 },
};

/* ─── Mock Strategic Future Skills Forecast Data ─────────── */
const FUTURE_SKILL_FORECAST = [
  { skill: 'Generative AI & LLM Engineering', currentProficiency: 2.2, futureRequired: 4.5, gapHorizon: '12 Months', riskLevel: 'Critical Risk', recommendation: 'L&D Fast-Track Certification' },
  { skill: 'Kubernetes Multi-Cloud Security', currentProficiency: 2.8, futureRequired: 4.2, gapHorizon: '6 Months', riskLevel: 'Internal DevOps Bootcamp' },
  { skill: 'Zero Trust Microservice Architecture', currentProficiency: 3.1, futureRequired: 4.5, gapHorizon: '9 Months', riskLevel: 'High Risk', recommendation: 'Architecture Workshop' },
  { skill: 'Automated ML Pipeline (MLOps)', currentProficiency: 2.5, futureRequired: 4.0, gapHorizon: '12 Months', riskLevel: 'Medium Risk', recommendation: 'Data Science Upskilling' },
];

/* ─── Mock Historical Trend Progression Data ─────────────── */
const GAP_PROGRESSION_LINE_DATA = [
  { label: 'Jan', value: 85, target: 40 },
  { label: 'Feb', value: 78, target: 40 },
  { label: 'Mar', value: 70, target: 40 },
  { label: 'Apr', value: 62, target: 40 },
  { label: 'May', value: 50, target: 40 },
  { label: 'Jun', value: 42, target: 40 },
];

const GAP_PROGRESSION_AREA_DATA = [
  { label: 'Jan', value: 35, reduction: 35 },
  { label: 'Feb', value: 45, reduction: 45 },
  { label: 'Mar', value: 58, reduction: 58 },
  { label: 'Apr', value: 68, reduction: 68 },
  { label: 'May', value: 78, reduction: 78 },
  { label: 'Jun', value: 88, reduction: 88 },
];

export default function GapAnalysis() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const [summary, setSummary]       = useState(null);
  const [details, setDetails]       = useState([]);
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

  function fetchAll() {
    setLoading(true);
    setError(null);
    Promise.all([getGapSummary(), getGapDetails()])
      .then(([sum, det]) => {
        setSummary(sum || {});
        setDetails(Array.isArray(det) ? det : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading gap analysis, using fallback:', err);
        setSummary({});
        setDetails([]);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <LoadingScreen message="Loading Knowledge Gap Analysis Intelligence Module…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchAll} />;

  const safeDetails = Array.isArray(details) ? details : [];
  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');
  const loggedInName = user?.name || user?.username || '';
  const userDept = user?.department || '';

  // Scope dataset based on Role
  let scopedDetails = safeDetails;
  if (isEmployeeView && loggedInName) {
    const matched = safeDetails.filter((item) => {
      if (!item) return false;
      const empStr = (item.employee || item.name || '').toLowerCase();
      const currStr = loggedInName.toLowerCase();
      return empStr.includes(currStr) || currStr.includes(empStr);
    });
    scopedDetails = matched.length > 0 ? matched : safeDetails;
  }

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
                        const gapVal = item.gapScore !== undefined ? item.gapScore : -1.5;
                        const isDeficit = gapVal < 0;
                        const scoreDisplay = item.currentScore || (item.overallSkillScore ? `${(item.overallSkillScore * 100).toFixed(0)}%` : '2.5 / 5.0');
                        const displayName = isEmployeeView ? (item.skill || item.employee || loggedInName) : (item.employee || item.name || 'Employee');

                        return (
                          <tr key={item.id || idx} className="table-row">
                            <td className="table-td-primary font-bold text-slate-900">{displayName}</td>
                            <td className="table-td text-slate-600 text-xs font-medium whitespace-nowrap">{item.department || userDept}</td>
                            <td className="table-td text-center font-extrabold text-slate-800 whitespace-nowrap">{scoreDisplay}</td>
                            <td className={`table-td text-center font-extrabold whitespace-nowrap ${isDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                              {isDeficit ? `${gapVal} Level` : `+${gapVal} Level`}
                            </td>
                            <td className="table-td text-center whitespace-nowrap">
                              <SeverityBadge severity={item.gapSeverity || 'Medium'} />
                            </td>
                            <td className="table-td text-center whitespace-nowrap">
                              <PriorityBadge priority={item.priority || item.gapSeverity || 'Medium'} />
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
                    ? `Cross-departmental skill ratings and competency benchmarks for ${userDept}`
                    : 'Cross-departmental rating matrix & competency deficit heatmap'}
                </p>
              </div>

              <div className="data-table-wrapper w-full overflow-x-auto">
                <table className="data-table w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">DEPARTMENT</th>
                      {HEATMAP_SKILLS.map((sk) => (
                        <th key={sk} className="table-th-center whitespace-nowrap">{sk}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="table-tbody">
                    {HEATMAP_DEPARTMENTS.map((dept) => (
                      <tr key={dept} className={`table-row ${isEmployeeView && (dept === 'Engineering' || dept === userDept) ? 'bg-blue-50/40' : ''}`}>
                        <td className="table-td-primary font-bold">
                          {dept} {isEmployeeView && (dept === 'Engineering' || dept === userDept) && <span className="text-[10px] text-blue-600 ml-1">(My Dept)</span>}
                        </td>
                        {HEATMAP_SKILLS.map((sk) => {
                          const rating = HEATMAP_MATRIX[dept]?.[sk] || 3.0;
                          const isLow = rating < 2.5;
                          const isMed = rating >= 2.5 && rating < 3.5;
                          return (
                            <td key={sk} className="table-td text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                                isLow ? 'bg-red-100 text-red-700 border-red-200' : isMed ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                                {rating.toFixed(1)} / 5.0
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Trend Progression & Future Forecast */}
          {activeTab === 'trend' && (
            <div className="space-y-8 w-full">
              {/* Historical Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isEmployeeView ? 'My Personal Skill Improvement Trend' : 'Total Deficit Gap Reduction Trend'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isEmployeeView
                        ? `6-Month historical progress towards target role proficiency benchmarks for ${loggedInName}`
                        : '6-Month MoM historical decrease in organization skill gaps'}
                    </p>
                  </div>
                  <div className="h-64">
                    <LineChart data={GAP_PROGRESSION_LINE_DATA} xKey="label" yKey="value" strokeColor="#2563EB" />
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
                    <AreaChart data={GAP_PROGRESSION_AREA_DATA} xKey="label" yKey="reduction" color="#10B981" />
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
                      : 'Predictive AI forecasting for upcoming technology shifts and skill risk horizons'}
                  </p>
                </div>

                <div className="data-table-wrapper w-full">
                  <table className="data-table w-full">
                    <thead className="table-head">
                      <tr>
                        <th className="table-th">FUTURE SKILL DOMAIN</th>
                        <th className="table-th-center">MY PROFICIENCY</th>
                        <th className="table-th-center">TARGET REQUIRED (12M)</th>
                        <th className="table-th-center">GAP HORIZON</th>
                        <th className="table-th-center">RISK LEVEL</th>
                        <th className="table-th">RECOMMENDED ROADMAP</th>
                      </tr>
                    </thead>
                    <tbody className="table-tbody">
                      {FUTURE_SKILL_FORECAST.map((f, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-td-primary font-bold text-slate-900">{f.skill}</td>
                          <td className="table-td text-center font-bold text-slate-800">{f.currentProficiency} / 5.0</td>
                          <td className="table-td text-center font-extrabold text-blue-600">{f.futureRequired} / 5.0</td>
                          <td className="table-td text-center font-semibold text-slate-700">{f.gapHorizon}</td>
                          <td className="table-td text-center">
                            <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                              f.riskLevel.includes('Critical') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {f.riskLevel}
                            </span>
                          </td>
                          <td className="table-td text-slate-700 text-xs font-semibold">{f.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
