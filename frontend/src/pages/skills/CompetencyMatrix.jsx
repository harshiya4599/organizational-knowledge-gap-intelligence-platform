import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getCompetencyMatrix } from '../../services/competencyService';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const STATUS_BADGE = {
  'Met':         'badge-success',
  'Low Gap':     'badge-info',
  'Medium Gap':  'badge-warning',
  'High Gap':    'badge-danger',
};

const DEPT_OPTIONS = [
  'All', 'Engineering', 'Software Development', 'Data Science', 'Marketing', 'Finance', 'Human Resources', 'Operations',
];

const PROFICIENCY_LEVELS = {
  1: 'Unaware',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

/* ─── Mock Strategic Goals Mapping ───────────────────────── */
const STRATEGIC_GOALS = [
  { id: 1, goal: 'Cloud Native Infrastructure & DevSecOps', dept: 'Engineering', targetQuarter: 'Q4 2026', alignedSkills: ['Docker', 'Kubernetes Orchestration', 'System Security'], priority: 'High', progress: 82 },
  { id: 2, goal: 'AI & Automated Knowledge Intelligence', dept: 'Data Science', targetQuarter: 'Q3 2026', alignedSkills: ['Machine Learning', 'Python', 'TensorFlow'], priority: 'Critical', progress: 75 },
  { id: 3, goal: 'Enterprise Financial Analytics & Compliance', dept: 'Finance', targetQuarter: 'Q4 2026', alignedSkills: ['Financial Modeling', 'Power BI', 'Excel'], priority: 'Medium', progress: 90 },
];

/* ─── Mock Industry Benchmarks ───────────────────────────── */
const INDUSTRY_BENCHMARKS = [
  { skill: 'React & Frontend Architecture', internalAvg: 4.2, industryAvg: 3.8, status: 'Above Benchmark', source: 'Gartner Tech Index 2026' },
  { skill: 'Docker Containerization & K8s', internalAvg: 2.8, industryAvg: 3.6, status: 'Deficit Gap', source: 'IEEE Cloud Benchmark' },
  { skill: 'System Microservices Architecture', internalAvg: 3.5, industryAvg: 3.5, status: 'On Par', source: 'Software Architecture Council' },
  { skill: 'Predictive Data Analytics', internalAvg: 3.2, industryAvg: 4.0, status: 'Deficit Gap', source: 'Fortune 500 AI Standard' },
];

/* ─── Mock Framework Version Control ─────────────────────── */
const VERSION_HISTORY = [
  { version: 'v3.2', title: 'Q3 2026 Cloud & AI Competency Realignment', author: 'L&D Governance Board', date: 'Aug 01, 2026', changes: 'Updated target levels for Docker (3.0 -> 4.0) and Machine Learning (3.5 -> 4.5).' },
  { version: 'v3.1', title: 'Mid-Year Departmental Framework Audit', author: 'HR Analytics Team', date: 'May 15, 2026', changes: 'Added 5 new strategic competencies for Data Science and Finance divisions.' },
  { version: 'v3.0', title: '2026 Annual Competency Framework Baseline', author: 'System Administrator', date: 'Jan 10, 2026', changes: 'Initial release of 5-tier competency rating framework.' },
];

/* ─── Initial Custom Skill Taxonomy Mock Tree ─────────────── */
const INITIAL_TAXONOMY = [
  {
    id: 'cat-tech',
    name: 'Technical & Engineering',
    badgeClass: 'bg-blue-50 border-blue-200 text-blue-700',
    subcategories: [
      {
        id: 'sub-frontend',
        name: 'Frontend',
        skills: [
          { id: 'sk-1', name: 'React', desc: 'Component-based UI library' },
          { id: 'sk-2', name: 'Angular', desc: 'Enterprise TypeScript web framework' },
          { id: 'sk-3', name: 'Vue.js', desc: 'Progressive JavaScript framework' },
        ],
      },
      {
        id: 'sub-backend',
        name: 'Backend',
        skills: [
          { id: 'sk-4', name: 'Spring Boot', desc: 'Java microservice framework' },
          { id: 'sk-5', name: 'Node.js', desc: 'Server-side JavaScript runtime' },
          { id: 'sk-6', name: 'Django', desc: 'High-level Python web framework' },
        ],
      },
      {
        id: 'sub-db',
        name: 'Database Architecture',
        skills: [
          { id: 'sk-7', name: 'PostgreSQL', desc: 'Relational database engine' },
          { id: 'sk-8', name: 'MongoDB', desc: 'NoSQL document database' },
        ],
      },
    ],
  },
  {
    id: 'cat-biz',
    name: 'Business & Management',
    badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    subcategories: [
      {
        id: 'sub-mgmt',
        name: 'Leadership & Delivery',
        skills: [
          { id: 'sk-14', name: 'Leadership', desc: 'Team mentorship & organizational direction' },
          { id: 'sk-15', name: 'Communication', desc: 'Executive messaging & stakeholder alignment' },
          { id: 'sk-16', name: 'Project Management', desc: 'Resource planning & agile delivery' },
        ],
      },
    ],
  },
];

export default function CompetencyMatrix() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');

  const [matrix,        setMatrix]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // Active Tab: 'matrix' | 'goals' | 'benchmarks' | 'taxonomy' | 'versions'
  const [activeTab,     setActiveTab]     = useState('matrix');

  // Filters & Search (Default to 'All' to ensure competencies load instantly)
  const [deptFilter,    setDeptFilter]    = useState('All');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [search,        setSearch]        = useState('');

  // Editable Target Levels State
  const [targetLevels,  setTargetLevels]  = useState({});

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Taxonomy Local State
  const [taxonomy, setTaxonomy] = useState(INITIAL_TAXONOMY);

  function fetchData() {
    setLoading(true);
    setError(null);
    getCompetencyMatrix()
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setMatrix(safeData);

        const initialMap = {};
        safeData.forEach((row, i) => {
          initialMap[row.id || i] = row.requiredLevel || row.targetLevel || 3;
        });
        setTargetLevels(initialMap);

        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading competency matrix, using fallback:', err);
        setMatrix([]);
        setLoading(false);
      });
  }

  useEffect(() => { fetchData(); }, []);

  function showToastMsg(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  const safeMatrix = Array.isArray(matrix) ? matrix : [];

  const filtered = safeMatrix.filter((row) => {
    if (!row) return false;
    const skillName = row.skill || row.skillName || row.name || '';
    const matchDept =
      deptFilter === 'All' ||
      row.department === deptFilter ||
      (deptFilter === 'Software Development' && row.department === 'Engineering') ||
      (deptFilter === 'Engineering' && row.department === 'Software Development');
    const matchStatus = statusFilter === 'All' || row.status === statusFilter;
    const matchSearch = search === '' || skillName.toLowerCase().includes(search.toLowerCase()) || (row.department || '').toLowerCase().includes(search.toLowerCase());
    return matchDept && matchStatus && matchSearch;
  });

  function handleTargetLevelChange(rowId, newLvl) {
    if (isEmployeeView) return; // Prevent employee edits
    setTargetLevels((prev) => ({
      ...prev,
      [rowId]: Number(newLvl),
    }));
    showToastMsg('Target competency level updated!');
  }

  if (loading) return <LoadingScreen message="Loading Competency Framework &amp; Benchmarks…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="page-container w-full max-w-none space-y-6">

      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
          role="alert"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {toast.type === 'error' ? <circle cx="12" cy="12" r="10"/> : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title text-2xl font-extrabold">Competency Framework &amp; Role Benchmarking</h1>
            <span className="badge-purple text-xs font-bold">Module 3</span>
            {isEmployeeView && <span className="badge-blue text-xs font-bold">Read-Only Benchmark View</span>}
          </div>
          <p className="page-header-subtitle">
            {isEmployeeView
              ? 'Role-specific required benchmark standards and department target specifications'
              : 'Role-specific competency definitions, target skill benchmarking, strategic goal mapping, industry standards & taxonomy governance'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="count-badge text-xs px-3 py-1.5">{safeMatrix.length} Framework Benchmarks</span>
        </div>
      </div>

      {/* ── Module 3 Navigation Tabs ────────────────── */}
      <div className="panel overflow-hidden w-full">
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { id: 'matrix',     label: 'Role Competencies & Requirements', icon: '📋' },
              { id: 'goals',      label: 'Strategic Goal Mapping', icon: '🎯' },
              { id: 'benchmarks', label: 'Industry Benchmarks', icon: '🌐' },
              { id: 'taxonomy',   label: 'Custom Taxonomy', icon: '🏷️' },
              { id: 'versions',   label: 'Version History & Audit', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-sm -mb-px z-10'
                    : 'bg-slate-100/80 text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 sm:p-8 w-full bg-white">

          {/* TAB 1: Role Competencies & Requirements */}
          {activeTab === 'matrix' && (
            <div className="space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Role &amp; Department Skill Requirements</h3>
                  <p className="text-xs text-slate-500">
                    {isEmployeeView
                      ? `Official target benchmark standards for ${deptFilter} and organization departments`
                      : 'Define required proficiency levels per role and evaluate current workforce average variance'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="search-input-wrapper min-w-[200px]">
                    <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search skill or department..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-input text-xs"
                    />
                  </div>

                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="form-select w-auto text-xs"
                  >
                    {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select w-auto text-xs"
                  >
                    {['All', 'Met', 'Low Gap', 'Medium Gap', 'High Gap'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="No competency entries found" message="Adjust search or department filters." />
              ) : (
                <div className="data-table-wrapper w-full">
                  <table className="data-table w-full">
                    <thead className="table-head">
                      <tr>
                        <th className="table-th">Department</th>
                        <th className="table-th">Skill Competency</th>
                        <th className="table-th-center">Required Level {isEmployeeView ? '(Target Benchmark)' : '(Editable Set)'}</th>
                        <th className="table-th-center">Current Avg</th>
                        <th className="table-th-center">Variance Gap</th>
                        <th className="table-th-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="table-tbody">
                      {filtered.map((row, idx) => {
                        const rowId = row.id || idx;
                        const skillTitle = row.skill || row.skillName || row.name || 'Skill Competency';
                        const currentReq = targetLevels[rowId] !== undefined ? targetLevels[rowId] : (row.requiredLevel || row.targetLevel || 3);
                        const avgVal = typeof row.avgCurrentLevel === 'number' ? row.avgCurrentLevel : (typeof row.currentAvg === 'number' ? row.currentAvg : 2.8);
                        
                        const varianceNum = parseFloat((avgVal - currentReq).toFixed(1));
                        const isDeficit = varianceNum < 0;

                        return (
                          <tr key={rowId} className="table-row">
                            <td className="table-td-primary font-bold text-slate-900">{row.department}</td>
                            <td className="table-td text-slate-800 font-semibold">{skillTitle}</td>
                            
                            {/* Required Level: Read-Only Badge for Employees, Editable Select for Admin/Manager */}
                            <td className="table-td text-center">
                              {isEmployeeView ? (
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
                                  Level {currentReq}: {PROFICIENCY_LEVELS[currentReq]}
                                </span>
                              ) : (
                                <select
                                  value={currentReq}
                                  onChange={(e) => handleTargetLevelChange(rowId, e.target.value)}
                                  className="form-select text-xs py-1 px-2 w-auto mx-auto font-bold text-blue-600 bg-blue-50 border-blue-200"
                                >
                                  {[1, 2, 3, 4, 5].map((lvl) => (
                                    <option key={lvl} value={lvl}>Level {lvl}: {PROFICIENCY_LEVELS[lvl]}</option>
                                  ))}
                                </select>
                              )}
                            </td>

                            <td className="table-td text-center font-bold text-slate-900">{avgVal.toFixed(1)} / 5.0</td>
                            <td className={`table-td text-center font-extrabold ${isDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                              {varianceNum > 0 ? `+${varianceNum}` : `${varianceNum}`}
                            </td>
                            <td className="table-td text-center">
                              <span className={STATUS_BADGE[row.status] || (isDeficit ? 'badge-warning' : 'badge-success')}>
                                {row.status || (isDeficit ? 'Gap' : 'Met')}
                              </span>
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

          {/* TAB 2: Strategic Goal Mapping */}
          {activeTab === 'goals' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Organizational Strategic Goal Competency Alignment</h3>
                <p className="text-xs text-slate-500">Mapping corporate OKRs and strategic milestones directly to target skill competencies</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {STRATEGIC_GOALS.map((g) => (
                  <div key={g.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="chip-indigo text-xs">{g.dept} &middot; {g.targetQuarter}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          g.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {g.priority} Priority
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{g.goal}</h4>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aligned Competencies</span>
                        <div className="flex flex-wrap gap-1.5">
                          {g.alignedSkills.map((sk, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded text-xs font-semibold">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Strategic Readiness</span>
                        <span className="font-extrabold text-blue-600">{g.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Industry Benchmarks */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Global Industry Benchmark Integration</h3>
                <p className="text-xs text-slate-500">Benchmarking organizational workforce averages against Gartner, IEEE, and Fortune 500 standards</p>
              </div>

              <div className="data-table-wrapper w-full">
                <table className="data-table w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">Competency Domain</th>
                      <th className="table-th-center">Internal Avg</th>
                      <th className="table-th-center">Industry Benchmark Avg</th>
                      <th className="table-th-center">Benchmark Variance</th>
                      <th className="table-th">Data Source</th>
                    </tr>
                  </thead>
                  <tbody className="table-tbody">
                    {INDUSTRY_BENCHMARKS.map((b, i) => {
                      const gap = (b.internalAvg - b.industryAvg).toFixed(1);
                      const isDeficit = gap < 0;
                      return (
                        <tr key={i} className="table-row">
                          <td className="table-td-primary font-bold text-slate-900">{b.skill}</td>
                          <td className="table-td text-center font-extrabold text-blue-600">{b.internalAvg} / 5.0</td>
                          <td className="table-td text-center font-bold text-slate-700">{b.industryAvg} / 5.0</td>
                          <td className="table-td text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              isDeficit ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {gap > 0 ? `+${gap} (Surplus)` : `${gap} (Deficit)`}
                            </span>
                          </td>
                          <td className="table-td text-slate-500 text-xs font-medium">{b.source}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Custom Skill Taxonomy */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Custom Skill Taxonomy Reference</h3>
                  <p className="text-xs text-slate-500">Hierarchical taxonomy mapping for skill categories, subcategories, and competency tags</p>
                </div>
              </div>

              <div className="space-y-4 w-full">
                {taxonomy.map((cat) => (
                  <div key={cat.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${cat.badgeClass}`}>
                        {cat.name}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{cat.subcategories.length} Subcategories</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">{sub.name}</h5>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {sub.skills.map((sk) => (
                              <span key={sk.id} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                                {sk.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Version History & Audit */}
          {activeTab === 'versions' && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-900">Competency Framework Version Control &amp; Audit Trail</h3>
                <p className="text-xs text-slate-500">Immutable version history of framework adjustments, target level changes, and audit logs</p>
              </div>

              <div className="space-y-4 w-full">
                {VERSION_HISTORY.map((v, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-xs font-extrabold">{v.version}</span>
                        <h4 className="text-sm font-bold text-slate-900">{v.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">{v.changes}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-800 block">📅 {v.date}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{v.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
