import { useState, useEffect } from 'react';
import { useRole, ROLES } from '../../context/RoleContext';
import { getOrganizationTrendAnalytics } from '../../services/analyticsService';
import SummaryCard   from '../../components/dashboard/SummaryCard';
import LineChart     from '../../components/charts/LineChart';
import AreaChart     from '../../components/charts/AreaChart';
import BarChart      from '../../components/charts/BarChart';
import PieChart      from '../../components/charts/PieChart';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

export default function Dashboard() {
  const { currentRole, roleBadge } = useRole();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Filters
  const [deptFilter, setDeptFilter]         = useState('All');
  const [timePeriod, setTimePeriod]         = useState('Monthly');
  const [categoryFilter, setCategoryFilter] = useState('All');

  function fetchData() {
    setLoading(true);
    setError(null);
    getOrganizationTrendAnalytics({ department: deptFilter, period: timePeriod, category: categoryFilter })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load organization trend analytics.');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
  }, [deptFilter, timePeriod, categoryFilter]);

  if (loading) return <LoadingScreen message="Loading Role-Tailored Intelligence Dashboard…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;
  if (!data)   return <EmptyState title="No analytics data available" />;

  const { summary, skillImprovement, gapReduction, deptTraining, skillDistribution, insights } = data;

  const departments = ['All', 'Engineering', 'Data Science', 'Finance', 'Human Resources', 'Marketing', 'Operations'];
  const categories  = ['All', 'Technical', 'Data Science', 'Management', 'Finance', 'Marketing', 'Operations'];

  // ── 1. EMPLOYEE ROLE DASHBOARD ───────────────────────────────
  if (currentRole === ROLES.EMPLOYEE) {
    return (
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">My Skill &amp; Learning Dashboard</h1>
              <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
            </div>
            <p className="page-header-subtitle">
              Personal competency progress, gap diagnostics, and active learning roadmaps.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Performance Sync
          </div>
        </div>

        {/* Employee Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Personal Skill Score" value={`${summary.healthScore}%`} subtext="Live assessment tracking" icon="🎯" accent="blue" />
          <SummaryCard title="Assigned Competencies" value={`${summary.skillImprovementRate > 0 ? 'Active' : 'Standard'}`} subtext="Platform Verified" icon="⭐" accent="emerald" />
          <SummaryCard title="Skill Deficit Gap" value={`${summary.gapReductionRate}%`} subtext="Competency target in progress" icon="⚡" accent="amber" />
          <SummaryCard title="Course Completion" value={`${summary.trainingCompletionRate}%`} subtext="Active Learning Paths" icon="🎓" accent="purple" />
        </div>

        {/* Charts & Recommended Learning Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="section-title">My Competency Growth Trend</h3>
                  <p className="text-xs text-slate-400">MoM personal skill proficiency score improvement</p>
                </div>
              </div>
              <LineChart data={skillImprovement} title="Personal Growth" />
            </div>

            <div className="panel p-5">
              <h3 className="section-title mb-3">Active Learning Roadmap</h3>
              <div className="space-y-3">
                {[
                  { title: 'Docker Containerization & K8s Architecture', provider: 'Internal LMS', progress: 85, dueDate: 'In 3 days' },
                  { title: 'React 19 & TypeScript Production Patterns', provider: 'Coursera', progress: 60, dueDate: 'Next week' },
                  { title: 'System Design & Distributed Microservices', provider: 'Udemy', progress: 40, dueDate: 'In 2 weeks' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                        <span className="chip-indigo text-[10px]">{item.provider}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-blue-600">{item.progress}%</span>
                      <p className="text-[10px] text-slate-400">{item.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Action Plan */}
          <div className="space-y-6">
            <div className="panel p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-bold text-white">AI Skill Recommendation</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Based on your current gap analysis in <strong>Docker</strong>, completing the <em>Container Orchestration</em> module will boost your overall competency to <strong>Expert (4.5)</strong>.
              </p>
              <a href="/recommendations" className="btn-primary text-xs w-full text-center py-2">
                View Recommendations &rarr;
              </a>
            </div>

            <div className="panel p-5">
              <h3 className="section-title mb-3">Upcoming Assessments</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                  <p className="font-bold text-blue-900">Q3 Frontend Competency Review</p>
                  <p className="text-blue-700 text-[11px] mt-0.5">Scheduled for Aug 15, 2026</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="font-bold text-slate-800">DevOps Peer Assessment</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Scheduled for Aug 28, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. MANAGER ROLE DASHBOARD ────────────────────────────────
  if (currentRole === ROLES.MANAGER) {
    return (
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Team Competency &amp; Department Analytics</h1>
              <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
            </div>
            <p className="page-header-subtitle">
              Monitor team health scores, high-risk skill deficits, and department learning progress.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Team Sync Active
          </div>
        </div>

        {/* Manager Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Team Health Score" value={`${summary.healthScore}%`} subtext="Live Department Assessment" icon="🏥" accent="emerald" />
          <SummaryCard title="Skill Improvement" value={`+${summary.skillImprovementRate}%`} subtext="Team Competency Growth" icon="👥" accent="blue" />
          <SummaryCard title="Gap Reduction Rate" value={`-${summary.gapReductionRate}%`} subtext="Remediation in Progress" icon="⚠️" accent="amber" />
          <SummaryCard title="Training Pass Rate" value={`${summary.trainingCompletionRate}%`} subtext="Active Team Courses" icon="📊" accent="purple" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <h3 className="section-title mb-1">Team Skill Improvement Rate</h3>
            <p className="text-xs text-slate-400 mb-4">Competency growth across team members</p>
            <LineChart data={skillImprovement} title="Team Growth" />
          </div>

          <div className="panel p-5">
            <h3 className="section-title mb-1">Department Training Completion</h3>
            <p className="text-xs text-slate-400 mb-4">Course completion rates by department</p>
            <BarChart data={deptTraining} title="Training Rates" />
          </div>
        </div>

        {/* High Risk Employees & Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Team Members Needing Intervention</h3>
              <a href="/gap-analysis" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All &rarr;</a>
            </div>
            <div className="space-y-3">
              {[
                { name: 'David Chen', dept: 'Engineering', gap: '2.4 Level Deficit', skill: 'Docker Architecture', priority: 'Critical' },
                { name: 'Bob Martinez', dept: 'Data Science', gap: '2.2 Level Deficit', skill: 'Power BI Reporting', priority: 'High' },
                { name: 'Irene Lopez', dept: 'Operations', gap: '2.0 Level Deficit', skill: 'Process Automation', priority: 'High' },
              ].map((emp, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                      <p className="text-[11px] text-slate-500">{emp.dept} &middot; Deficit: <strong className="text-red-600">{emp.skill}</strong></p>
                    </div>
                  </div>
                  <span className="badge-danger text-[10px]">{emp.priority} Priority</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="section-title mb-3">Department Quick Actions</h3>
            <div className="space-y-2">
              <a href="/employees" className="btn-outline text-xs w-full justify-start gap-2 py-2">
                <span>👥</span> View Team Members
              </a>
              <a href="/competency-matrix" className="btn-outline text-xs w-full justify-start gap-2 py-2">
                <span>📋</span> Review Competency Matrix
              </a>
              <a href="/reports" className="btn-outline text-xs w-full justify-start gap-2 py-2">
                <span>📊</span> Generate Department Report
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. ADMINISTRATOR ROLE DASHBOARD ──────────────────────────
  return (
    <div className="page-container space-y-6">

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Executive Organization Health &amp; Governance</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Real-time workforce skill development, training completion rates, and organizational gap reduction trends.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Systems Operational
          </div>
        </div>
      </div>

      {/* Metric Bar */}
      <div className="metric-row">
        <div className="metric-cell">
          <span className="metric-label">Organization Health</span>
          <div className="flex items-baseline justify-between">
            <span className="metric-value text-emerald-600">{summary.healthScore}%</span>
            <span className="metric-trend-up">↑ 4.2%</span>
          </div>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Skill Growth Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="metric-value text-blue-600">+{summary.skillImprovementRate}%</span>
            <span className="metric-trend-up">↑ 2.1%</span>
          </div>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Gap Reduction Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="metric-value text-indigo-600">-{summary.gapReductionRate}%</span>
            <span className="metric-trend-up">↓ 5.4%</span>
          </div>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Course Pass Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="metric-value text-amber-600">{summary.trainingCompletionRate}%</span>
            <span className="metric-trend-up">↑ 1.8%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          title="Organization Health"
          value={`${summary.healthScore}%`}
          subtext="MoM Competency Growth (+4.2%)"
          icon="🏥"
          accent="emerald"
        />
        <SummaryCard
          title="Skill Improvement Rate"
          value={`+${summary.skillImprovementRate}%`}
          subtext="Target: 20% by Q4"
          icon="📈"
          accent="blue"
        />
        <SummaryCard
          title="Gap Reduction Rate"
          value={`-${summary.gapReductionRate}%`}
          subtext="Critical deficits resolved"
          icon="📉"
          accent="indigo"
        />
        <SummaryCard
          title="Training Completion"
          value={`${summary.trainingCompletionRate}%`}
          subtext="Active learning paths"
          icon="🎓"
          accent="amber"
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="dept-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department:</label>
            <select
              id="dept-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="form-select w-auto"
            >
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period:</label>
            <select
              id="period-select"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="form-select w-auto"
            >
              {['Monthly', 'Quarterly', 'Yearly'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="cat-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category:</label>
            <select
              id="cat-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select w-auto"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="btn-outline text-xs flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Skill Score Improvement Rate</h3>
              <p className="text-xs text-slate-400">Monthly aggregate workforce competency progression vs target</p>
            </div>
            <span className="chip-indigo">Line Analysis</span>
          </div>
          <LineChart data={skillImprovement} title="Skill Improvement Rate" />
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Knowledge Gap Reduction Trend</h3>
              <p className="text-xs text-slate-400">Reduction in critical gaps vs total active organizational gaps</p>
            </div>
            <span className="chip-slate">Area Analytics</span>
          </div>
          <AreaChart data={gapReduction} title="Gap Reduction Trend" />
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Departmental Training Completion</h3>
              <p className="text-xs text-slate-400">Completion rate % and active courses per department</p>
            </div>
            <span className="chip-indigo">Bar Comparison</span>
          </div>
          <BarChart data={deptTraining} title="Departmental Training Completion" />
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Skill Category Breakdown</h3>
              <p className="text-xs text-slate-400">Distribution across domain categories</p>
            </div>
            <span className="chip-slate">Pie Distribution</span>
          </div>
          <PieChart data={skillDistribution} title="Skill Category Breakdown" />
        </div>
      </div>

      {/* AI Workforce Intelligence Banner */}
      <div className="panel bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-lg">
                ✨
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Workforce Intelligence</h3>
                <p className="text-xs text-slate-400">Automated organizational recommendations &amp; highlights</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-300 border border-white/15">
              AI Engine v2.4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Top Dept</span>
              <p className="text-xs font-semibold text-emerald-400 truncate">{insights.bestPerformingDept}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fastest Growth</span>
              <p className="text-xs font-semibold text-blue-400 truncate">{insights.fastestSkillGrowth}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Needs Training</span>
              <p className="text-xs font-semibold text-amber-400 truncate">{insights.deptNeedingTraining}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Most Improved</span>
              <p className="text-xs font-semibold text-indigo-400 truncate">{insights.mostImprovedSkill}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Highest Gap</span>
              <p className="text-xs font-semibold text-rose-400 truncate">{insights.highestRemainingGap}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
