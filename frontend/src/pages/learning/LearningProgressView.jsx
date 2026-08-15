import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import {
  getLearningEnrollments,
  getLearningMilestones,
  getSkillImprovements,
  getCertifications,
  getLearningVelocity,
  getTeamLearningProgress,
  applyVerifiedSkillGain,
  toggleMilestone,
} from '../../services/learningProgressService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState from '../../components/feedback/ErrorState';
import EmptyState from '../../components/feedback/EmptyState';

export default function LearningProgressView({ initialTab = 'enrollments' }) {
  const { user } = useAuth();
  const { currentRole, roleBadge, isManager, isAdmin } = useRole();
  const employeeId = user?.employeeId || user?.id || 3;
  const userName = user?.name || user?.username || 'Charlie Brown';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Datasets
  const [enrollments, setEnrollments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [skillGains, setSkillGains] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [velocityData, setVelocityData] = useState(null);
  const [teamProgress, setTeamProgress] = useState([]);

  // Filters & Sub-views
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [teamDeptFilter, setTeamDeptFilter] = useState('All');

  // Interactive Milestone Viewer Modal
  const [selectedCourseMilestones, setSelectedCourseMilestones] = useState(null);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);

  // Cross-Module Skill Verification Modal
  const [verifyModalCourse, setVerifyModalCourse] = useState(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const [actionSuccessToast, setActionSuccessToast] = useState(null);

  function showToast(msg) {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  }

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [enList, mlList, sgList, certList, vel, team] = await Promise.all([
        getLearningEnrollments(isManager || isAdmin ? null : employeeId),
        getLearningMilestones(),
        getSkillImprovements(isManager || isAdmin ? null : employeeId),
        getCertifications(isManager || isAdmin ? null : employeeId),
        getLearningVelocity(employeeId),
        getTeamLearningProgress(),
      ]);

      setEnrollments(Array.isArray(enList) ? enList : []);
      setMilestones(Array.isArray(mlList) ? mlList : []);
      setSkillGains(Array.isArray(sgList) ? sgList : []);
      setCertifications(Array.isArray(certList) ? certList : []);
      setVelocityData(vel || {});
      setTeamProgress(Array.isArray(team) ? team : []);
      setLoading(false);
    } catch (err) {
      console.warn('[LearningProgressView] Error fetching data:', err);
      setError('Unable to load learning progress records. Please retry.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
    const unsub = subscribeToStore(loadAllData);
    return unsub;
  }, [employeeId, currentRole]);

  if (loading) return <LoadingScreen message="Loading Learning Progress & Velocity Intelligence Engine…" />;
  if (error) return <ErrorState message={error} onRetry={loadAllData} />;

  // ── FILTER LOGIC ──────────────────────────────────────────────
  const displayedEnrollments = enrollments.filter(en => {
    const matchesStatus = statusFilter === 'All' || en.status === statusFilter;
    const matchesPlatform = platformFilter === 'All' || en.platform.toLowerCase().includes(platformFilter.toLowerCase());
    return matchesStatus && matchesPlatform;
  });


  const displayedTeam = teamProgress.filter(t => {
    return teamDeptFilter === 'All' || t.employee.department === teamDeptFilter;
  });

  // Calculate Metrics
  const completedEnrollmentsCount = enrollments.filter(e => e.status === 'Completed' || e.status === 'Certified').length;
  const inProgressEnrollmentsCount = enrollments.filter(e => e.status === 'In Progress').length;
  const expiringCertsCount = certifications.filter(c => c.status === 'Expiring Soon' || c.status === 'Expired' || c.renewalRequired).length;
  const overallAvgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
    : 0;

  // ── ACTIONS ───────────────────────────────────────────────────
  async function handleMilestoneToggle(milestone) {
    await toggleMilestone(milestone.id);
    // Refresh modal milestones if open
    if (selectedCourseMilestones) {
      const allMs = getCollection('learning_milestones');
      const updatedMs = allMs.filter(m => String(m.enrollmentId) === String(selectedCourseMilestones.course.id));
      const allEn = getCollection('learning_enrollments');
      const updatedCourse = allEn.find(e => String(e.id) === String(selectedCourseMilestones.course.id));
      setSelectedCourseMilestones({ course: updatedCourse || selectedCourseMilestones.course, milestones: updatedMs });
    }
    showToast(`✓ Milestone "${milestone.title}" updated.`);
  }

  async function handleApplySkillGain(item) {
    await applyVerifiedSkillGain(item.id, item.employeeId || employeeId, item.skill, item.targetLevelAfter || item.afterLevel || 4);
    setVerifyModalOpen(false);
    showToast(`✓ Cross-Module Sync: Skill "${item.skill}" upgraded to Level ${item.targetLevelAfter || item.afterLevel || 4}! Deficit closed across Gap Analysis & Competencies.`);
  }

  async function handleRenewCert(cert) {
    await renewCert(cert.id);
    showToast(`✓ Certification "${cert.certificationName}" renewed for 3 years (Expiry: 2029)!`);
  }

  return (
    <div className="page-container space-y-6">

      {/* Toast */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <span className="text-emerald-400 text-base">✓</span>
          <span className="text-xs font-semibold">{actionSuccessToast}</span>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title text-2xl font-extrabold">
              Learning Progress &amp; Milestones
            </h1>
            <span className="badge-blue text-xs font-bold">Module 6</span>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Tracking training course milestones, post-training skill proficiency gains, and team learning velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="count-badge text-xs px-3 py-1.5">{enrollments.length} Assigned Programs</span>
          <span className="badge-purple text-xs font-bold">Cross-Module Sync Active</span>
        </div>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Overall Learning Progress"
          value={`${overallAvgProgress}%`}
          subtext={`${completedEnrollmentsCount} of ${enrollments.length} Courses Completed`}
          icon="🎓"
          accent="blue"
        />
        <SummaryCard
          title="Active Course Tracks"
          value={`${inProgressEnrollmentsCount} In Progress`}
          subtext="Structured milestone roadmaps"
          icon="⚡"
          accent="emerald"
        />
        <SummaryCard
          title="Verified Certifications"
          value={`${certifications.filter(c => c.status === 'Valid').length} Active`}
          subtext={expiringCertsCount > 0 ? `⚠️ ${expiringCertsCount} Expirations require action` : 'All credentials compliant'}
          icon="📜"
          accent={expiringCertsCount > 0 ? 'amber' : 'purple'}
        />
        <SummaryCard
          title="Learning Velocity Index"
          value={`${velocityData?.learningVelocityIndex || 88} / 100`}
          subtext={`${velocityData?.totalLearningHours || 138} Total Learning Hours`}
          icon="📈"
          accent="indigo"
        />
      </div>

      {/* ── Tab Navigation ────────────────────────────────────── */}
      <div className="panel overflow-hidden">
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: 'enrollments',   label: 'Courses & Milestones', icon: '📚' },
              { id: 'skill-gains',   label: 'Post-Training Skill Gains', icon: '⭐' },
              { id: 'velocity',      label: 'Learning Velocity Analytics', icon: '📊' },
              { id: 'team-progress', label: isManager || isAdmin ? 'Team Learning Oversight' : 'Personal Benchmark', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 rounded-t-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-sm -mb-px z-10'
                    : 'bg-slate-100/80 text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ================================================================ */}
          {/* TAB 1: TRAINING ENROLLMENTS & MILESTONES                        */}
          {/* ================================================================ */}
          {activeTab === 'enrollments' && (
            <div className="space-y-6">
              {/* Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Training Statuses</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Certified">Certified</option>
                    <option value="Expired / Renewal Required">Expired / Renewal Required</option>
                    <option value="Not Started">Not Started</option>
                  </select>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All LMS Platforms</option>
                    <option value="Internal">Internal LMS</option>
                    <option value="Coursera">Coursera Enterprise</option>
                    <option value="AWS">AWS Skill Builder</option>
                    <option value="Udemy">Udemy for Business</option>
                    <option value="CompTIA">CompTIA</option>
                  </select>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Showing {displayedEnrollments.length} Programs
                </span>
              </div>

              {/* Enrollments Cards List */}
              <div className="space-y-4">
                {displayedEnrollments.map((en) => {
                  const courseMilestones = milestones.filter(m => String(m.enrollmentId) === String(en.id));

                  return (
                    <div
                      key={en.id}
                      className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${en.statusBadge} text-xs font-bold py-0.5 px-2.5 rounded-full border`}>
                            {en.status}
                          </span>
                          <span className="chip-indigo text-xs font-bold">{en.skill}</span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-600 font-semibold">{en.platform}</span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900">{en.courseName}</h4>

                        {/* Progress Bar */}
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">Course Progress</span>
                            <span className="font-extrabold text-blue-600">{en.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                en.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${en.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span>👨‍🏫 <strong>Instructor:</strong> {en.instructor}</span>
                          <span>&bull;</span>
                          <span>⏳ {en.duration}</span>
                          <span>&bull;</span>
                          <span>📅 {en.startDate} to {en.endDate}</span>
                          {en.score && (
                            <>
                              <span>&bull;</span>
                              <span className="font-bold text-emerald-700">Score: {en.score}%</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Milestone Steps & Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseMilestones({ course: en, milestones: courseMilestones });
                            setMilestoneModalOpen(true);
                          }}
                          className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <span>📋</span>
                          <span>Milestones ({en.milestonesCompleted || 0}/{en.milestonesTotal || 5})</span>
                        </button>

                        {(en.status === 'Completed' || en.progress === 100) && (
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyModalCourse(en);
                              setVerifyModalOpen(true);
                            }}
                            className="btn-primary text-xs py-2 px-3 bg-purple-600 hover:bg-purple-700 border-purple-600"
                          >
                            ⭐ Apply Skill Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: POST-TRAINING SKILL GAINS (CROSS-MODULE SYNC)            */}
          {/* ================================================================ */}
          {activeTab === 'skill-gains' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">
                      Cross-Module Skill Proficiency &amp; Gap Resolution Engine
                    </h3>
                    <p className="text-xs text-purple-800/80 mt-0.5 leading-relaxed">
                      Completing verified training tracks automatically updates <strong>Employee Skills</strong>, resolves deficits in <strong>Gap Analysis</strong>, recalculates <strong>Competency Matrix</strong>, and promotes your profile to Expert status.
                    </p>
                  </div>
                </div>
                <span className="badge-purple text-xs font-bold shrink-0">Live Integration Active</span>
              </div>

              {/* Skill Gains Table */}
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">SKILL &amp; COMPETENCY</th>
                      <th className="table-th">ASSOCIATED TRAINING COURSE</th>
                      <th className="table-th text-center">BEFORE TRAINING</th>
                      <th className="table-th text-center">AFTER TRAINING</th>
                      <th className="table-th text-center">NET GAIN</th>
                      <th className="table-th">STATUS &amp; IMPACT</th>
                      <th className="table-th text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillGains.map((sg) => (
                      <tr key={sg.id} className="table-row">
                        <td className="table-td font-bold text-slate-900">
                          <span className="chip-indigo text-xs">{sg.skill}</span>
                        </td>
                        <td className="table-td text-xs text-slate-700 font-medium">
                          {sg.courseName}
                        </td>
                        <td className="table-td text-center">
                          <span className="badge-neutral text-xs font-bold">
                            Lvl {sg.beforeLevel}.0 ({sg.beforeScorePct}%)
                          </span>
                        </td>
                        <td className="table-td text-center">
                          <span className="badge-success text-xs font-bold">
                            Lvl {sg.afterLevel}.0 ({sg.afterScorePct}%)
                          </span>
                        </td>
                        <td className="table-td text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                            +{sg.levelGain} Levels (+{sg.improvementPct}%)
                          </span>
                        </td>
                        <td className="table-td text-xs text-slate-600 leading-relaxed">
                          <p className="font-semibold text-slate-800">{sg.status}</p>
                          <p className="text-[11px] text-slate-500">{sg.impact}</p>
                        </td>
                        <td className="table-td text-right">
                          {sg.verified ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <span>✓</span> Applied to Profile
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplySkillGain(sg)}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              Apply Update
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* ================================================================ */}
          {/* TAB 4: LEARNING VELOCITY ANALYTICS                              */}
          {/* ================================================================ */}
          {activeTab === 'velocity' && (
            <div className="space-y-6">
              {/* Velocity Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Courses Completed</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{velocityData?.coursesCompletedTotal || completedEnrollmentsCount || 4}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">&uarr; +2 MoM growth</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Avg Completion Speed</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{velocityData?.avgCompletionDays || 16} Days</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Top 10% organization velocity</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Skills Elevated</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{velocityData?.skillsImprovedCount || skillGains.filter(s => s.verified).length || 3} Skills</p>
                  <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Avg +{velocityData?.avgSkillLevelGain || 1.8} Level Gain</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Total Learning Time</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{velocityData?.totalLearningHours || 138} Hours</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">L&amp;D certified investment</p>
                </div>
              </div>

              {/* Velocity Trend Chart */}
              <div className="panel p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="section-title">Monthly Learning Velocity &amp; Skill Progression Trend</h3>
                    <p className="text-xs text-slate-400">Completed courses and dedicated study hours MoM</p>
                  </div>
                  <span className="badge-purple text-xs font-bold">Velocity Index: {velocityData?.learningVelocityIndex || 88}/100</span>
                </div>
                <LineChart
                  data={(velocityData?.monthlyTrend || []).map(t => ({
                    label: t.month,
                    value: Math.round((t.coursesCompleted || 1) * 20),
                    target: 80,
                  }))}
                  title="Learning Progress MoM"
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: TEAM & ORG LEARNING INTELLIGENCE                          */}
          {/* ================================================================ */}
          {activeTab === 'team-progress' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isManager || isAdmin ? 'Team & Department Learning Oversight' : 'Personal Benchmark vs Team'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monitor workforce upskilling completion rates, employee progress health, and identify at-risk roadblocks.
                  </p>
                </div>
                {isManager && (
                  <span className="badge-orange text-xs font-bold">Manager Visibility Active</span>
                )}
                {isAdmin && (
                  <span className="badge-purple text-xs font-bold">Administrator Org Intelligence</span>
                )}
              </div>

              {/* Department Filter for Admin */}
              {isAdmin && (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600">Department:</label>
                  <select
                    value={teamDeptFilter}
                    onChange={(e) => setTeamDeptFilter(e.target.value)}
                    className="form-select text-xs w-auto"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              )}

              {/* Team Progress Table */}
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">TEAM MEMBER</th>
                      <th className="table-th">DEPARTMENT &amp; ROLE</th>
                      <th className="table-th text-center">ASSIGNED COURSES</th>
                      <th className="table-th text-center">COMPLETED</th>
                      <th className="table-th min-w-[200px]">AVERAGE PROGRESS</th>
                      <th className="table-th text-center">VELOCITY</th>
                      <th className="table-th text-center">HEALTH STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTeam.map((item) => (
                      <tr key={item.employee.id} className="table-row">
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {item.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-bold text-slate-900 text-xs">{item.employee.name}</span>
                          </div>
                        </td>
                        <td className="table-td text-xs text-slate-600">
                          {item.employee.department} &middot; {item.employee.designation}
                        </td>
                        <td className="table-td text-center font-semibold text-slate-800">
                          {item.totalCourses}
                        </td>
                        <td className="table-td text-center font-bold text-emerald-600">
                          {item.completedCourses}
                        </td>
                        <td className="table-td">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">{item.averageProgress}%</span>
                              <span className="text-slate-400">{item.completedCourses}/{item.totalCourses} Done</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${item.averageProgress >= 70 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${item.averageProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-center">
                          <span className={`text-xs font-bold ${
                            item.learningVelocity === 'High' ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {item.learningVelocity}
                          </span>
                        </td>
                        <td className="table-td text-center">
                          {item.isAtRisk ? (
                            <span className="badge-warning text-xs font-bold">⚠️ Needs Support</span>
                          ) : (
                            <span className="badge-success text-xs font-bold">✓ On Track</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL: MILESTONE CHECKLIST VIEWER                                */}
      {/* ================================================================ */}
      {milestoneModalOpen && selectedCourseMilestones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="chip-indigo text-xs font-bold">{selectedCourseMilestones.course.skill}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCourseMilestones.course.courseName}</h3>
                <p className="text-xs text-slate-500">Interactive Learning Milestones &amp; Step Completion &middot; Progress: {selectedCourseMilestones.course.progress}%</p>
              </div>
              <button
                type="button"
                onClick={() => setMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Milestones List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedCourseMilestones.milestones.map((m, idx) => {
                const isDone = m.status === 'Completed';

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleMilestoneToggle(m)}
                        className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs mt-0.5 transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-slate-300 text-transparent hover:border-emerald-500'
                        }`}
                      >
                        ✓
                      </button>
                      <div className="space-y-0.5">
                        <p className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          Step {idx + 1}: {m.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{m.description}</p>
                        <p className="text-[10px] text-slate-400">
                          📅 Due: {m.dueDate} {m.completedDate ? `&middot; Completed: ${m.completedDate}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDone ? 'badge-success' : 'badge-warning'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMilestoneModalOpen(false)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close Milestones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: CROSS-MODULE SKILL UPGRADE VERIFICATION                   */}
      {/* ================================================================ */}
      {verifyModalOpen && verifyModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Verify &amp; Apply Skill Upgrade</h3>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-2 leading-relaxed">
              <p className="font-bold text-purple-950">
                You have completed 100% of "{verifyModalCourse.courseName}"!
              </p>
              <p className="text-purple-800">
                Applying this upgrade will immediately update your <strong>{verifyModalCourse.skill}</strong> proficiency level from <strong>Level {verifyModalCourse.currentLevelBefore || 2}</strong> to <strong>Level {verifyModalCourse.targetLevelAfter || 4}</strong> across the entire platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-400">Previous Level</p>
                <p className="text-base font-bold text-slate-700">Level {verifyModalCourse.currentLevelBefore || 2} / 5.0</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] text-emerald-600 font-bold">New Verified Level</p>
                <p className="text-base font-bold text-emerald-700">Level {verifyModalCourse.targetLevelAfter || 4} / 5.0</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplySkillGain(verifyModalCourse)}
                className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700"
              >
                Apply to My Skills &amp; Close Gap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
