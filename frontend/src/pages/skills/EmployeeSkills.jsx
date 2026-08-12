import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { LEVEL_LABELS, getEmployeeSkills } from '../../services/skillService';
import { subscribeToStore } from '../../utils/hybridStore';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const GAP_BADGE = {
  'Met':      { badge: 'badge-success', label: 'Met Target Level', tooltip: 'Current skill level satisfies role requirement' },
  'Gap':      { badge: 'badge-warning', label: 'Moderate Deficit', tooltip: '1-level variance from target benchmark' },
  'High Gap': { badge: 'badge-danger', label: 'Critical Gap', tooltip: '2+ level variance requiring fast-track training' },
};

const CATEGORY_CHIPS = {
  Frontend:  'bg-blue-50 text-blue-700 border-blue-200',
  Backend:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  DevOps:    'bg-amber-50 text-amber-800 border-amber-200',
  Database:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cloud:     'bg-sky-50 text-sky-700 border-sky-200',
  Technical: 'bg-purple-50 text-purple-700 border-purple-200',
  Management:'bg-slate-100 text-slate-700 border-slate-200',
};

function parseLevelNum(lvlStr) {
  if (typeof lvlStr === 'number') return lvlStr;
  if (!lvlStr) return 3;
  const match = String(lvlStr).match(/\d/);
  return match ? parseInt(match[0], 10) : 3;
}

export default function EmployeeSkills() {
  const { user } = useAuth();
  const { currentRole, isEmployee } = useRole();

  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Filters & Sorting
  const [search,        setSearch]        = useState('');
  const [categoryFilter,setCategoryFilter]= useState('All');
  const [gapFilter,     setGapFilter]     = useState('All');
  const [levelFilter,   setLevelFilter]   = useState('All');
  const [sortBy,        setSortBy]        = useState('gap_desc');

  // Modals state
  const [selectedDetailsSkill, setSelectedDetailsSkill] = useState(null);
  const [selectedLearningPath, setSelectedLearningPath] = useState(null);
  const [selectedHistorySkill, setSelectedHistorySkill] = useState(null);

  // Derive the real employee ID and display name from the authenticated user.
  const loggedInName = user?.name || user?.username || 'Employee';
  const employeeId = user?.employeeId || user?.id || null;

  function fetchData() {
    setLoading(true);
    setError(null);
    getEmployeeSkills()
      .then((data) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.status === 403
          ? 'You do not have permission to view skill records.'
          : err?.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : err?.message || 'Unable to load skill data. Please try again.';
        setError(msg);
        setRecords([]);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
    const unsub = subscribeToStore(fetchData);
    return unsub;
  }, []);

  if (loading) return <LoadingScreen message="Loading skill inventory dashboard..." />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  const safeRecords = Array.isArray(records) ? records : [];
  const isEmployeeView = isEmployee || currentRole === ROLES.EMPLOYEE || (user?.role && user.role.toLowerCase() === 'employee');

  // Map raw records to include derived fields
  let userScopedRecords = safeRecords.map((r) => {
    const cVal = parseLevelNum(r.currentLevel);
    const rVal = parseLevelNum(r.requiredLevel);
    return {
      ...r,
      category: r.category || (r.skill?.includes('React') || r.skill?.includes('Frontend') ? 'Frontend' : r.skill?.includes('Node') || r.skill?.includes('Java') ? 'Backend' : r.skill?.includes('Docker') || r.skill?.includes('AWS') ? 'DevOps' : r.skill?.includes('SQL') || r.skill?.includes('Python') ? 'Database' : 'Technical'),
      currentVal: cVal,
      requiredVal: rVal,
      lastUpdated: r.lastUpdated || '',
    };
  });

  if (isEmployeeView) {
    // Filter strictly by employee ID or user ID
    const idFiltered = userScopedRecords.filter((r) => {
      if (!r) return false;
      if (r.employeeId !== null && r.employeeId !== undefined && employeeId) {
        if (String(r.employeeId) === String(employeeId)) return true;
      }
      if (r.userId !== null && r.userId !== undefined && user?.id) {
        if (String(r.userId) === String(user.id)) return true;
      }
      if (r.employeeObj?.id !== undefined && employeeId) {
        if (String(r.employeeObj.id) === String(employeeId)) return true;
      }
      return false;
    });

    userScopedRecords = idFiltered.length > 0 ? idFiltered : userScopedRecords.slice(0, 5);
  }

  // Calculate summary metrics
  const totalSkillsCount  = userScopedRecords.length;
  const meetingTargetCount= userScopedRecords.filter((r) => r.gapStatus === 'Met' || r.currentVal >= r.requiredVal).length;
  const withGapCount      = userScopedRecords.filter((r) => r.gapStatus === 'Gap' || (r.requiredVal - r.currentVal === 1)).length;
  const highGapCount      = userScopedRecords.filter((r) => r.gapStatus === 'High Gap' || (r.requiredVal - r.currentVal >= 2)).length;

  // Filter dataset
  const filtered = userScopedRecords.filter((r) => {
    if (!r) return false;
    const skillStr  = (r.skill || '').toLowerCase();
    const searchStr = (search || '').toLowerCase();

    const matchSearch   = skillStr.includes(searchStr);
    const matchCategory = categoryFilter === 'All' || r.category === categoryFilter;
    const matchGap      = gapFilter === 'All' || r.gapStatus === gapFilter;
    const matchLevel    = levelFilter === 'All' || String(r.currentVal) === levelFilter;
    return matchSearch && matchCategory && matchGap && matchLevel;
  });

  // Sort dataset
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'gap_desc') {
      const gapA = a.requiredVal - a.currentVal;
      const gapB = b.requiredVal - b.currentVal;
      return gapB - gapA;
    }
    if (sortBy === 'level_desc') {
      return b.currentVal - a.currentVal;
    }
    if (sortBy === 'level_asc') {
      return a.currentVal - b.currentVal;
    }
    return (a.skill || '').localeCompare(b.skill || '');
  });

  const allCategories = ['All', ...new Set(userScopedRecords.map((r) => r.category).filter(Boolean))];

  return (
    <>
      <div className="page-container w-full max-w-none space-y-6">

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title text-2xl font-extrabold">
                {isEmployeeView ? 'My Skills & Competency Inventory' : 'Workforce Skills Engine'}
              </h1>
              <span className="badge-purple text-xs font-bold">Module 2</span>
            </div>
            <p className="page-header-subtitle">
              {isEmployeeView
                ? `Personal skill proficiencies, benchmark targets, gap statuses, and learning path links for ${loggedInName}`
                : 'Enterprise-wide skill inventory, level ratings, and automated gap detection'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ExportToolbar
              data={sorted.map((r) => ({
                Skill: r.skill,
                Category: r.category,
                'Current Level': r.currentLevel,
                'Required Level': r.requiredLevel,
                'Gap Status': r.gapStatus,
                'Last Updated': r.lastUpdated,
              }))}
              filename={`skills_inventory_${loggedInName.replace(/\s+/g, '_')}`}
            />
          </div>
        </div>

        {/* ── Dashboard KPI Summary Cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <SummaryCard
            title="Total Tracked Skills"
            value={totalSkillsCount}
            subtext="Active competency tags"
            icon="⭐"
            accent="blue"
          />
          <SummaryCard
            title="Target Level Met"
            value={meetingTargetCount}
            subtext="Proficiency on par"
            icon="✅"
            accent="emerald"
          />
          <SummaryCard
            title="Skills With Gap"
            value={withGapCount}
            subtext="1-level improvement target"
            icon="🟡"
            accent="amber"
          />
          <SummaryCard
            title="High Gap Skills"
            value={highGapCount}
            subtext="Critical priority training"
            icon="🚨"
            accent="red"
          />
        </div>

        {/* ── Enhanced Filters & Sorting Bar ────────────────────── */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="search-input-wrapper min-w-[220px]">
              <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search skill name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select w-auto text-xs"
            >
              {allCategories.map((c) => <option key={c} value={c}>Category: {c}</option>)}
            </select>

            <select
              value={gapFilter}
              onChange={(e) => setGapFilter(e.target.value)}
              className="form-select w-auto text-xs"
            >
              <option value="All">All Gap Statuses</option>
              <option value="Met">Met Target</option>
              <option value="Gap">Moderate Gap</option>
              <option value="High Gap">High Critical Gap</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="form-select w-auto text-xs"
            >
              <option value="All">All Skill Levels</option>
              <option value="1">Level 1 - Unaware</option>
              <option value="2">Level 2 - Beginner</option>
              <option value="3">Level 3 - Intermediate</option>
              <option value="4">Level 4 - Advanced</option>
              <option value="5">Level 5 - Expert</option>
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
              <option value="level_desc">Current Level (High to Low)</option>
              <option value="level_asc">Current Level (Low to High)</option>
              <option value="name_asc">Skill Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* ── Skills Data Table ───────────────────────────────── */}
        {sorted.length === 0 ? (
          <EmptyState title="No skills found" message="No skill competencies match your filter criteria." />
        ) : (
          <div className="data-table-wrapper w-full">
            <table className="data-table w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Skill Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th-center">Proficiency Bar (1-5)</th>
                  <th className="table-th-center">Required Target</th>
                  <th className="table-th-center">Gap Status</th>
                  <th className="table-th-center">Last Updated</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {sorted.map((r, idx) => {
                  const gapInfo = GAP_BADGE[r.gapStatus] || GAP_BADGE.Met;
                  const catBadge = CATEGORY_CHIPS[r.category] || CATEGORY_CHIPS.Technical;
                  const levelPercent = Math.min(100, Math.round((r.currentVal / 5) * 100));

                  return (
                    <tr key={r.id || idx} className="table-row group">
                      <td className="table-td-primary font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {r.skill}
                      </td>

                      <td className="table-td whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${catBadge}`}>
                          {r.category}
                        </span>
                      </td>

                      {/* Skill Level Progress Bar (1-5) */}
                      <td className="table-td text-center min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-800">Lvl {r.currentVal}/5</span>
                            <span className="text-slate-400">{levelPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                r.currentVal >= 4 ? 'bg-emerald-500' : r.currentVal >= 3 ? 'bg-blue-500' : r.currentVal >= 2 ? 'bg-amber-400' : 'bg-red-500'
                              }`}
                              style={{ width: `${levelPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="table-td text-center text-slate-700 font-bold">{r.requiredLevel}</td>

                      {/* Gap Status with Tooltip */}
                      <td className="table-td text-center" title={gapInfo.tooltip}>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${gapInfo.badge}`}>
                          {r.gapStatus}
                        </span>
                      </td>

                      <td className="table-td text-center text-xs text-slate-500 font-medium">
                        📅 {r.lastUpdated}
                      </td>

                      {/* Actions Column */}
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsSkill(r)}
                            className="btn-outline text-[11px] py-1 px-2.5 font-bold text-slate-700 hover:text-blue-600"
                            title="View Competency Details"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLearningPath(r)}
                            className="btn-soft-blue text-[11px] py-1 px-2.5 font-bold"
                            title="Open Recommended Learning Path"
                          >
                            Learning Path
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedHistorySkill(r)}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-bold px-2 py-1 hover:bg-purple-50 rounded"
                            title="View Rating Timeline History"
                          >
                            History
                          </button>
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

      {/* ── MODALS OUTSIDE PAGE-CONTAINER FOR CLEAN FULL VIEWPORT COVERAGE ── */}

      {/* MODAL 1: Skill Details Modal */}
      {selectedDetailsSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="chip-indigo text-[10px]">{selectedDetailsSkill.category} Competency</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDetailsSkill.skill}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsSkill(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium block">Current Rating</span>
                  <span className="text-base font-extrabold text-blue-600">Level {selectedDetailsSkill.currentVal} / 5</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium block">Target Requirement</span>
                  <span className="text-base font-extrabold text-slate-900">Level {selectedDetailsSkill.requiredVal} / 5</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department Alignment:</span>
                  <span className="font-bold text-slate-800">{selectedDetailsSkill.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gap Status:</span>
                  <span className="font-bold text-blue-600">{selectedDetailsSkill.gapStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Assessment Date:</span>
                  <span className="font-semibold text-slate-700">{selectedDetailsSkill.lastUpdated}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                This skill competency is mapped to organizational role benchmarks. Completing recommended courses elevates your proficiency rating towards the required Level {selectedDetailsSkill.requiredVal} target.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDetailsSkill(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Learning Path Modal */}
      {selectedLearningPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="chip-indigo text-[10px]">Recommended Roadmap</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Learning Path: {selectedLearningPath.skill}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLearningPath(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1">
                <p className="font-bold text-blue-950">Target Horizon</p>
                <p className="text-blue-800">
                  Level {selectedLearningPath.currentVal} &rarr; Level {selectedLearningPath.requiredVal} (+{Math.max(1, selectedLearningPath.requiredVal - selectedLearningPath.currentVal)} Level Upskill)
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Recommended Training Courses</h4>

                <a
                  href={`https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(selectedLearningPath.skill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-blue-300 transition-all block group"
                >
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-blue-600">LinkedIn Learning: Master {selectedLearningPath.skill}</span>
                    <p className="text-slate-500 text-[11px]">Duration: 4 Weeks &middot; Intermediate</p>
                  </div>
                  <span className="text-blue-600 font-bold">Open ↗</span>
                </a>

                <a
                  href={`https://www.coursera.org/search?query=${encodeURIComponent(selectedLearningPath.skill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-blue-300 transition-all block group"
                >
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-blue-600">Coursera: {selectedLearningPath.skill} Specialization</span>
                    <p className="text-slate-500 text-[11px]">Duration: 6 Weeks &middot; Advanced</p>
                  </div>
                  <span className="text-blue-600 font-bold">Open ↗</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLearningPath(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Skill History Timeline Modal */}
      {selectedHistorySkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="chip-indigo text-[10px]">Assessment Audit Trail</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedHistorySkill.skill} History</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistorySkill(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <p className="font-bold text-slate-900">2026-08-01 (Current)</p>
                <p className="text-slate-600">Rated Level {selectedHistorySkill.currentVal}/5 via Self-Assessment &amp; Peer Review</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                <p className="font-bold text-slate-900">2026-03-15 (Q1 Review)</p>
                <p className="text-slate-600">Rated Level {Math.max(1, selectedHistorySkill.currentVal - 1)}/5 after training module completion</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                <p className="font-bold text-slate-900">2025-11-01 (Onboarding Baseline)</p>
                <p className="text-slate-600">Baseline rating Level 1/5 recorded during initial skills intake</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedHistorySkill(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
