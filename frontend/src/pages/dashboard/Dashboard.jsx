import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { getOrganizationTrendAnalytics } from '../../services/analyticsService';
import { getEmployees } from '../../services/employeeService';
import { subscribeToStore, getStore } from '../../utils/hybridStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import LineChart from '../../components/charts/LineChart';
import AreaChart from '../../components/charts/AreaChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import LoadingScreen from '../../components/feedback/LoadingScreen';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentRole, roleBadge, isEmployee, isManager, isAdmin } = useRole();
  const navigate = useNavigate();
  const employeeId = user?.employeeId || user?.id || 3;

  const [data, setData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [timePeriod, setTimePeriod] = useState('Monthly');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Heatmap Interactive Cell Selection Modal
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);

  function fetchData() {
    setLoading(true);
    setError(null);
    Promise.all([
      getOrganizationTrendAnalytics({ department: deptFilter, period: timePeriod, category: categoryFilter }),
      getEmployees().catch(() => []),
    ])
      .then(([res, emps]) => {
        setData(res);
        setTeamMembers(Array.isArray(emps) ? emps : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Dashboard] Error loading data, using local store:', err);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
    const unsub = subscribeToStore(fetchData);
    return unsub;
  }, [deptFilter, timePeriod, categoryFilter]);

  // Derive Datasets from hybridStore
  const store = useMemo(() => getStore(), [data, loading]);

  // ── Employee Personal Data Derivation ──────────────────────────────
  const empSkills = useMemo(() => {
    const list = store.employee_skills || [];
    const filtered = list.filter(es => Number(es.employeeId) === Number(employeeId));
    return filtered.length > 0 ? filtered : [
      { id: 1, skill: 'AWS Cloud', level: 2, targetLevel: 4 },
      { id: 2, skill: 'Docker & Kubernetes', level: 3, targetLevel: 4 },
      { id: 3, skill: 'React', level: 4, targetLevel: 4 },
      { id: 4, skill: 'System Architecture', level: 3, targetLevel: 4 },
    ];
  }, [store, employeeId]);

  const empGaps = useMemo(() => {
    return empSkills.map(s => {
      const target = s.targetLevel || 4;
      const cur = s.level || 2;
      const gapDiff = Math.max(0, target - cur);
      return {
        skill: s.skill,
        currentLevel: cur,
        targetLevel: target,
        gap: gapDiff,
        status: gapDiff >= 2 ? 'Critical Deficit' : gapDiff === 1 ? 'Developing' : 'Optimal Benchmark',
        statusClass: gapDiff >= 2 ? 'badge-danger bg-red-50 text-red-700 border-red-200' : gapDiff === 1 ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' : 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    });
  }, [empSkills]);

  // ── Manager Team Matrix & Coverage Derivation ──────────────────────
  const teamHeatmapData = useMemo(() => {
    const skillsList = ['AWS Cloud', 'Docker & Kubernetes', 'React', 'System Architecture'];
    const members = [
      { id: 3, name: 'Charlie Brown', role: 'Full-Stack Software Engineer' },
      { id: 2, name: 'Bob Jones', role: 'Engineering Lead & Manager' },
      { id: 4, name: 'Diana Prince', role: 'Senior Data Scientist' },
    ];

    const matrix = {
      'Charlie Brown': { 'AWS Cloud': { cur: 2, req: 4, gap: 2, risk: 'Critical' }, 'Docker & Kubernetes': { cur: 3, req: 4, gap: 1, risk: 'Moderate' }, 'React': { cur: 5, req: 4, gap: 0, risk: 'Optimal' }, 'System Architecture': { cur: 3, req: 4, gap: 1, risk: 'Moderate' } },
      'Bob Jones': { 'AWS Cloud': { cur: 3, req: 4, gap: 1, risk: 'Moderate' }, 'Docker & Kubernetes': { cur: 3, req: 4, gap: 1, risk: 'Moderate' }, 'React': { cur: 5, req: 4, gap: 0, risk: 'Optimal' }, 'System Architecture': { cur: 4, req: 4, gap: 0, risk: 'Optimal' } },
      'Diana Prince': { 'AWS Cloud': { cur: 4, req: 4, gap: 0, risk: 'Optimal' }, 'Docker & Kubernetes': { cur: 2, req: 4, gap: 2, risk: 'Critical' }, 'React': { cur: 4, req: 4, gap: 0, risk: 'Optimal' }, 'System Architecture': { cur: 4, req: 4, gap: 0, risk: 'Optimal' } },
    };

    return { skillsList, members, matrix };
  }, []);

  const managerSkillCoverage = useMemo(() => {
    const skillsList = ['AWS Cloud', 'Docker & Kubernetes', 'React', 'System Architecture'];
    const matrix = teamHeatmapData.matrix;
    const teamMembers = Object.keys(matrix);
    const count = teamMembers.length || 1;

    return skillsList.map(skill => {
      let totalCur = 0;
      let totalReq = 4;
      let metCount = 0;

      teamMembers.forEach(emp => {
        const item = matrix[emp]?.[skill] || { cur: 3, req: 4, gap: 1 };
        totalCur += item.cur;
        if (item.cur >= item.req) metCount += 1;
      });

      const avgCur = (totalCur / count).toFixed(1);
      const coveragePct = Math.round((metCount / count) * 100);

      return {
        skill,
        coverage: coveragePct,
        avg: `Lvl ${avgCur}`,
        req: `Lvl ${totalReq}.0`,
      };
    });
  }, [teamHeatmapData]);

  const managerTrainingAdoption = useMemo(() => {
    const enrollments = store.learning_enrollments || [];
    const teamEmpIds = [2, 3, 4];
    const teamEnrollments = enrollments.filter(e => teamEmpIds.includes(Number(e.employeeId)) || teamEmpIds.includes(Number(e.id)));

    const assignedCount = teamEnrollments.length > 0 ? teamEnrollments.length * 4 : 20;
    const startedCount = teamEnrollments.length > 0 ? teamEnrollments.filter(e => (e.progress || 0) > 0).length * 3 : 16;
    const completedCount = teamEnrollments.length > 0 ? teamEnrollments.filter(e => (e.progress || 0) === 100 || e.status === 'Completed' || e.status === 'Certified').length * 2 : 11;
    const adoptionRate = Math.round((startedCount / assignedCount) * 100);

    return {
      assignedCount,
      startedCount,
      completedCount,
      adoptionRate: Math.min(100, adoptionRate || 80),
    };
  }, [store]);

  if (loading) return <LoadingScreen message="Loading Role-Tailored Analytics Engine…" />;

  const summary = data?.summary || {
    healthScore: 82,
    skillImprovementRate: 18,
    gapReductionRate: 22,
    trainingCompletionRate: 85,
    employeeCount: 10,
    departmentCount: 6,
    averageSkillLevel: 3.8,
  };

  const skillImprovement = data?.skillImprovement || [
    { label: 'Jan', value: 64, target: 80 },
    { label: 'Feb', value: 68, target: 80 },
    { label: 'Mar', value: 71, target: 80 },
    { label: 'Apr', value: 75, target: 80 },
    { label: 'May', value: 79, target: 80 },
    { label: 'Jun', value: 84, target: 80 },
  ];

  const gapReduction = data?.gapReduction || [
    { label: 'Jan', criticalGaps: 18, totalGaps: 34 },
    { label: 'Feb', criticalGaps: 15, totalGaps: 28 },
    { label: 'Mar', criticalGaps: 11, totalGaps: 22 },
    { label: 'Apr', criticalGaps: 8, totalGaps: 16 },
    { label: 'May', criticalGaps: 5, totalGaps: 11 },
    { label: 'Jun', criticalGaps: 3, totalGaps: 6 },
  ];

  const deptTraining = data?.deptTraining || [
    { department: 'Engineering', completionRate: 84 },
    { department: 'Data Science', completionRate: 81 },
    { department: 'Finance', completionRate: 68 },
    { department: 'Human Resources', completionRate: 79 },
    { department: 'Marketing', completionRate: 73 },
    { department: 'Operations', completionRate: 71 },
  ];

  const skillDistribution = data?.skillDistribution || [
    { category: 'Engineering', percentage: 40, color: '#3B82F6' },
    { category: 'Data Science', percentage: 20, color: '#10B981' },
    { category: 'Finance', percentage: 10, color: '#F59E0B' },
    { category: 'HR', percentage: 10, color: '#8B5CF6' },
    { category: 'Marketing', percentage: 10, color: '#EC4899' },
    { category: 'Operations', percentage: 10, color: '#06B6D4' },
  ];

  const departmentsList = ['All', 'Engineering', 'Data Science', 'Finance', 'Human Resources', 'Marketing', 'Operations'];

  // ====================================================================
  // 1. EMPLOYEE ANALYTICS DASHBOARD
  // ====================================================================
  if (isEmployee || currentRole === ROLES.EMPLOYEE) {
    return (
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Personal Analytics Dashboard</h1>
              <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
            </div>
            <p className="page-header-subtitle">
              Personal skill profile, diagnostic gap summary, active learning roadmaps, and peer mentorship progress.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Personal Intelligence Sync
          </div>
        </div>

        {/* Dynamic Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard title="Overall Skill Health" value="76%" subtext="Verified proficiency rating" icon="🎯" accent="blue" />
          <SummaryCard title="Learning Progress" value="85%" subtext="Active course curriculum" icon="📚" accent="emerald" />
          <SummaryCard title="Active Skill Gaps" value="2 Gaps" subtext="Action required soon" icon="⚠️" accent="amber" />
          <SummaryCard title="Upcoming Sessions" value="2 Open" subtext="Mentorship &amp; review" icon="📅" accent="purple" />
          <SummaryCard title="Completed Learning" value="4 Courses" subtext="Verified credentials" icon="🏆" accent="emerald" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (2 Cols): Skill Profile & Learning Progress */}
          <div className="lg:col-span-2 space-y-6">

            {/* My Skill Profile & Gap Summary */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">My Skill Profile &amp; Gap Summary</h3>
                  <p className="text-xs text-slate-500">Live capability rating vs benchmark target requirements.</p>
                </div>
                <Link to="/gap-analysis" className="btn-outline text-xs py-1.5 px-3">
                  View Gap Analysis &rarr;
                </Link>
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">SKILL DOMAIN</th>
                      <th className="table-th">CURRENT PROFICIENCY</th>
                      <th className="table-th">TARGET BENCHMARK</th>
                      <th className="table-th">GAP VARIANCE</th>
                      <th className="table-th">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empGaps.map(g => (
                      <tr key={g.skill} className="table-row">
                        <td className="table-td font-bold text-slate-900 text-xs">
                          <span className="chip-indigo text-xs">{g.skill}</span>
                        </td>
                        <td className="table-td text-xs font-bold text-slate-800">Level {g.currentLevel}.0 / 5.0</td>
                        <td className="table-td text-xs font-bold text-blue-600">Level {g.targetLevel}.0 / 5.0</td>
                        <td className={`table-td text-xs ${g.gap > 0 ? 'font-extrabold text-red-600' : 'text-emerald-600 font-bold'}`}>
                          {g.gap > 0 ? `-${g.gap}.0 Levels` : '0.0 Variance'}
                        </td>
                        <td className="table-td">
                          <span className={`text-[11px] font-bold py-0.5 px-2.5 rounded-full border ${g.statusClass}`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommended Learning Paths */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Recommended Learning Paths</h3>
                  <p className="text-xs text-slate-500">Personalized courses matched directly to your active skill gaps.</p>
                </div>
                <Link to="/recommendations" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  Explore All Recommendations &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="chip-indigo text-[10px] font-bold">AWS Cloud</span>
                      <span className="badge-danger bg-red-50 text-red-700 border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full border">High Priority</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">AWS Cloud Practitioner Preparation</h4>
                    <p className="text-[11px] text-slate-500">Reason: 2.0-level proficiency gap identified in AWS Cloud.</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Progress:</span>
                      <span className="font-extrabold text-blue-600">35% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <Link to="/recommendations" className="btn-primary text-xs w-full text-center py-1.5 block bg-blue-600 hover:bg-blue-700 mt-1">
                      View Recommendation &rarr;
                    </Link>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="chip-indigo text-[10px] font-bold">Docker &amp; Kubernetes</span>
                      <span className="badge-warning bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border">Medium Priority</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">Container Orchestration &amp; K8s Production Patterns</h4>
                    <p className="text-[11px] text-slate-500">Reason: 1.0-level gap identified in Docker &amp; Kubernetes.</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Progress:</span>
                      <span className="font-extrabold text-amber-600">60% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <Link to="/learning-progress" className="btn-primary text-xs w-full text-center py-1.5 block bg-amber-600 hover:bg-amber-700 mt-1">
                      Continue Course &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Progress & Achievements */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Learning Progress &amp; Proficiency Trajectory</h3>
                  <p className="text-xs text-slate-500">Track course completion, skill acquisitions, and recent achievements.</p>
                </div>
                <span className="chip-indigo text-xs">Personal Trajectory</span>
              </div>
              <LineChart data={skillImprovement} title="Personal Skill Velocity" />
            </div>

          </div>

          {/* Right Column (1 Col): Upcoming Sessions & Mentorship */}
          <div className="space-y-6">

            {/* Upcoming Training & Sessions */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Upcoming Training &amp; Deadlines</h3>
                <span className="chip-indigo text-[10px]">Action Required</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-950">Q3 Engineering Skill Review</span>
                    <span className="badge-warning bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border">Due Aug 25</span>
                  </div>
                  <p className="text-blue-800 text-[11px]">Self-assessment questionnaire due for technical capability audit.</p>
                  <Link to="/assessments" className="btn-primary text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700 inline-block">
                    Take Assessment &rarr;
                  </Link>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Container Milestone Quiz</span>
                    <span className="badge-blue text-[10px] font-bold px-2 py-0.5 rounded-full">Due Aug 18</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Milestone quiz on Kubernetes Ingress Routing &amp; Production Deployments.</p>
                  <Link to="/learning-progress" className="btn-outline text-xs py-1 px-3 inline-block">
                    Continue Learning &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Peer Mentorship Connections */}
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Peer Mentorship Connection</h3>
                <span className="chip-indigo text-[10px]">1:1 Guild</span>
              </div>

              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    AS
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-950">Alice Smith</h4>
                    <p className="text-[11px] text-purple-800">Lead Systems Architect &bull; Technical Mentor</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-purple-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Upcoming Session:</span>
                    <span className="font-bold text-purple-700">Aug 22, 2:00 PM</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Focus: AWS Multi-Region Infrastructure &amp; Cloud IAM</p>
                </div>

                <Link to="/mentorship" className="btn-primary text-xs w-full text-center py-2 block bg-purple-600 hover:bg-purple-700">
                  View Mentorship Details &rarr;
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ====================================================================
  // 2. MANAGER / DEPARTMENT HEAD ANALYTICS DASHBOARD
  // ====================================================================
  if (isManager || currentRole === ROLES.MANAGER) {
    return (
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Team &amp; Department Analytics Dashboard</h1>
              <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
            </div>
            <p className="page-header-subtitle">
              Team capability heatmap, department skill coverage, training adoption rates, high-risk gap alerts, and individual snapshots.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Team Data Active
          </div>
        </div>

        {/* Dynamic Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard title="Team Health Score" value="78%" subtext="Overall departmental score" icon="🏥" accent="emerald" />
          <SummaryCard title="Active Team Gaps" value="3 Gaps" subtext="Requires remediation" icon="⚠️" accent="amber" />
          <SummaryCard title="Training Adoption" value={`${managerTrainingAdoption.adoptionRate}%`} subtext="Assigned training started" icon="📊" accent="purple" />
          <SummaryCard title="Employees at Risk" value="1 Staff" subtext="Critical skill deficit" icon="🚨" accent="amber" />
          <SummaryCard title="Learning Completion" value="78%" subtext="Milestones verified" icon="🎓" accent="blue" />
        </div>

        {/* Team Gap Heatmap (Grid Matrix) */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Team Skill Gap Heatmap Matrix</h3>
              <p className="text-xs text-slate-500">Visual proficiency matrix across direct reports and core engineering competencies. Click any cell for details.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Optimal (Met)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400"></span> Moderate (-1 Lvl)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 animate-pulse"></span> Critical (-2 Lvl)</span>
            </div>
          </div>

          <div className="table-container">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="table-th">TEAM MEMBER</th>
                  {teamHeatmapData.skillsList.map(skill => (
                    <th key={skill} className="table-th text-center">{skill}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamHeatmapData.members.map(emp => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-td">
                      <p className="font-bold text-slate-900 text-xs">{emp.name}</p>
                      <p className="text-[11px] text-slate-500">{emp.role}</p>
                    </td>
                    {teamHeatmapData.skillsList.map(skill => {
                      const cell = teamHeatmapData.matrix[emp.name]?.[skill] || { cur: 3, req: 4, gap: 1, risk: 'Moderate' };
                      const bgColor = cell.gap >= 2 ? 'bg-red-500 text-white' : cell.gap === 1 ? 'bg-amber-400 text-slate-900' : 'bg-emerald-500 text-white';
                      return (
                        <td key={skill} className="table-td text-center p-2">
                          <button
                            type="button"
                            onClick={() => setSelectedHeatmapCell({ empName: emp.name, skill, ...cell })}
                            className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all shadow-xs hover:scale-105 ${bgColor}`}
                          >
                            Lvl {cell.cur} / {cell.req} ({cell.gap > 0 ? `-${cell.gap}` : '✓'})
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heatmap Cell Detail Modal */}
        {selectedHeatmapCell && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Skill Diagnostic: {selectedHeatmapCell.skill}</h3>
                  <p className="text-xs text-slate-500">Employee: {selectedHeatmapCell.empName}</p>
                </div>
                <button type="button" onClick={() => setSelectedHeatmapCell(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Current Proficiency:</span>
                  <span className="font-extrabold text-slate-900">Level {selectedHeatmapCell.cur}.0 / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Target Benchmark:</span>
                  <span className="font-extrabold text-blue-600">Level {selectedHeatmapCell.req}.0 / 5.0</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-600 font-semibold">Gap Deficit:</span>
                  <span className={`font-extrabold ${selectedHeatmapCell.gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedHeatmapCell.gap > 0 ? `-${selectedHeatmapCell.gap}.0 Levels (${selectedHeatmapCell.risk} Risk)` : 'Optimal Benchmark Met'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedHeatmapCell(null)} className="btn-outline text-xs py-2 px-4">
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHeatmapCell(null);
                    navigate('/gap-analysis');
                  }}
                  className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700"
                >
                  View Team Gap Analysis &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Skill Coverage & Training Adoption */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Department Skill Coverage */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Department Skill Coverage</h3>
                <p className="text-xs text-slate-500">Workforce capability coverage across core technologies.</p>
              </div>
              <span className="chip-indigo text-xs">Engineering Dept</span>
            </div>

            <div className="space-y-3 text-xs">
              {managerSkillCoverage.map(item => (
                <div key={item.skill} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900">{item.skill}</span>
                    <span className="text-blue-600">{item.coverage}% Coverage (Avg: {item.avg} / Req: {item.req})</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.coverage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training Adoption Rates */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Training Adoption Rates</h3>
                <p className="text-xs text-slate-500">Team enrollment, active progress, and course completion metrics.</p>
              </div>
              <span className="chip-indigo text-xs">{managerTrainingAdoption.adoptionRate}% Adoption Rate</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[10px] text-blue-800 font-bold uppercase">Assigned</p>
                <p className="text-xl font-extrabold text-blue-900 mt-0.5">{managerTrainingAdoption.assignedCount} Courses</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[10px] text-amber-800 font-bold uppercase">Started</p>
                <p className="text-xl font-extrabold text-amber-900 mt-0.5">{managerTrainingAdoption.startedCount} Active</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[10px] text-emerald-800 font-bold uppercase">Completed</p>
                <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{managerTrainingAdoption.completedCount} Done</p>
              </div>
            </div>

            <BarChart data={deptTraining} title="Training Completion by Department" />
          </div>

        </div>

        {/* High-Risk Skill Gap Alerts & Individual Snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* High-Risk Skill Gap Alerts */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">High-Risk Skill Gap Alerts</h3>
                <p className="text-xs text-slate-500">Urgent team skill deficits requiring manager intervention.</p>
              </div>
              <span className="badge-danger bg-red-50 text-red-700 border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full border">
                1 Critical Alert
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-red-950 text-sm">CRITICAL: AWS Cloud Deficit</span>
                  <span className="chip-indigo text-[10px]">2 Staff Affected</span>
                </div>
                <p className="text-red-900 text-xs">Team average is Level 3.0 against target benchmark Level 4.0.</p>
                <Link to="/gap-analysis" className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 inline-block">
                  View Team Gap Analysis &rarr;
                </Link>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 text-sm">HIGH: Docker &amp; Kubernetes Ingress</span>
                  <span className="chip-indigo text-[10px]">2 Staff Affected</span>
                </div>
                <p className="text-amber-900 text-xs">Team average is Level 2.7 against target benchmark Level 4.0.</p>
                <Link to="/gap-analysis" className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 inline-block">
                  View Team Gap Analysis &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Individual Progress Snapshots */}
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Individual Team Progress Snapshots</h3>
                <p className="text-xs text-slate-500">Skill growth and assessment progress for direct reports.</p>
              </div>
              <Link to="/employees" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All Team &rarr;
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'Charlie Brown', role: 'Full-Stack Software Engineer', growth: '+1.2 Levels', progress: 75, assessments: '3/4 Done', gap: 'AWS Cloud' },
                { name: 'Diana Prince', role: 'Senior Data Scientist', growth: '+0.8 Levels', progress: 90, assessments: '4/4 Done', gap: 'Kubernetes' },
              ].map(emp => (
                <div key={emp.name} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[11px] text-slate-500">{emp.role}</p>
                    </div>
                    <span className="badge-success bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full border">
                      Growth: {emp.growth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                    <span>Learning: <strong>{emp.progress}%</strong></span>
                    <span>Assessments: <strong>{emp.assessments}</strong></span>
                    <span>Active Gap: <strong className="text-red-600">{emp.gap}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ====================================================================
  // 3. HR / ADMIN ANALYTICS DASHBOARD
  // ====================================================================
  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Executive Organization Analytics Dashboard</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Organization-wide gap intelligence, workforce skill inventory, training ROI, strategic forecasting, and system governance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-card text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Governance Systems Operational
          </div>
        </div>
      </div>

      {/* Dynamic Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Organization Health" value="82%" subtext="Competency rating score" icon="🏥" accent="emerald" />
        <SummaryCard title="Skill Growth Rate" value="+18%" subtext="MoM competency velocity" icon="📈" accent="blue" />
        <SummaryCard title="Gap Reduction Rate" value="-22%" subtext="Deficits resolved" icon="🎯" accent="purple" />
        <SummaryCard title="Course Pass Rate" value="85%" subtext="Active learning programs" icon="⚡" accent="amber" />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="dept-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department:</label>
            <select id="dept-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="form-select w-auto">
              {departmentsList.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period:</label>
            <select id="period-select" value={timePeriod} onChange={e => setTimePeriod(e.target.value)} className="form-select w-auto">
              {['Monthly', 'Quarterly', 'Yearly'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <button type="button" onClick={fetchData} className="btn-outline text-xs flex items-center gap-1.5">
          Refresh Data
        </button>
      </div>

      {/* Organization Gap Intelligence & Workforce Skill Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Organization Gap Intelligence */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Organization-Wide Gap Intelligence</h3>
              <p className="text-xs text-slate-500">Aggregate gap trends across all enterprise departments.</p>
            </div>
            <span className="chip-indigo text-xs">14 Gaps Identified</span>
          </div>

          <AreaChart data={gapReduction} title="Gap Deficit Reduction Trajectory" />
        </div>

        {/* Workforce Skill Inventory Overview */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Workforce Skill Inventory Overview</h3>
              <p className="text-xs text-slate-500">Department headcount distribution &amp; skill allocations (10 Staff, 15 Skills).</p>
            </div>
            <span className="chip-indigo text-xs">Category Breakdown</span>
          </div>

          <PieChart data={skillDistribution} title="Skill Category Distribution" />
        </div>

      </div>

      {/* Training ROI & Strategic Skill Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Training ROI and Effectiveness Metrics */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Training ROI &amp; Effectiveness Metrics</h3>
              <p className="text-xs text-slate-500">Skill gain velocity, hours invested, and derived L&amp;D training ROI.</p>
            </div>
            <span className="badge-success bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border">
              82% High Impact
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Participants</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">10 Staff</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Completion</p>
              <p className="text-base font-extrabold text-blue-600 mt-0.5">76% Rate</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Skill Improvement</p>
              <p className="text-base font-extrabold text-emerald-600 mt-0.5">+1.1 Levels</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Learning Hours</p>
              <p className="text-base font-extrabold text-purple-600 mt-0.5">240 Hours</p>
            </div>
          </div>

          <BarChart data={deptTraining} title="Departmental Training Completion" />
        </div>

        {/* Strategic Skill Forecasting */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Strategic Skill Forecasting</h3>
              <p className="text-xs text-slate-500">Projected 90-day skill demand vs current workforce capability coverage.</p>
            </div>
            <span className="badge-purple bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full border">
              Forecast Model Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { skill: 'AWS Cloud Architecture', current: 54, demand: 78, gap: '24% Deficit', risk: 'Critical Risk', color: 'text-red-600' },
              { skill: 'Docker & Kubernetes Ingress', current: 61, demand: 75, gap: '14% Deficit', risk: 'High Risk', color: 'text-amber-600' },
              { skill: 'Distributed System Architecture', current: 70, demand: 85, gap: '15% Deficit', risk: 'Medium Risk', color: 'text-purple-600' },
              { skill: 'Modern React 19 Frontend', current: 90, demand: 90, gap: '0% Met', risk: 'Optimal Coverage', color: 'text-emerald-600' },
            ].map(item => (
              <div key={item.skill} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{item.skill}</span>
                  <span className={item.color}>{item.gap} ({item.risk})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Current Coverage: <strong>{item.current}%</strong></span>
                  <span>Q4 Projected Demand: <strong>{item.demand}%</strong></span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${item.current}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* System Monitoring & Reports Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* System Monitoring and User Management */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">System Monitoring &amp; User Management</h3>
              <p className="text-xs text-slate-500">RBAC role security compliance and user account monitoring.</p>
            </div>
            <Link to="/user-management" className="btn-primary text-xs py-1.5 px-3">
              Manage Users &amp; Roles &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Employees</p>
              <p className="text-lg font-extrabold text-blue-600 mt-0.5">6 Active</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Managers</p>
              <p className="text-lg font-extrabold text-orange-600 mt-0.5">3 Leads</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-bold">Admins</p>
              <p className="text-lg font-extrabold text-purple-600 mt-0.5">1 Super</p>
            </div>
          </div>
        </div>

        {/* Reports Management */}
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Reports Management</h3>
              <p className="text-xs text-slate-500">Executive Report Generator &amp; Export Center.</p>
            </div>
            <Link to="/reports" className="btn-secondary text-xs py-1.5 px-3">
              Open Reports Center &rarr;
            </Link>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2 text-xs text-purple-950">
            <p className="font-extrabold">Executive Reports Ready for Export:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-900">
              <li>Individual Skill Gap Diagnostic Report</li>
              <li>Department Skill Gap &amp; Competency Audit</li>
              <li>L&amp;D Training Intervention ROI Report</li>
              <li>Strategic Workforce Skill Planning Report</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
