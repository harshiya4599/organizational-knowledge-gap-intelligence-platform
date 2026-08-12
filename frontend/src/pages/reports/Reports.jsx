import { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { generateReport } from '../../services/reportService';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ExportToolbar from '../../components/common/ExportToolbar';

const REPORT_TYPES = [
  {
    id: 'workforce',
    title: 'Workforce Skill Gap Summary',
    type: 'Executive Analytics',
    icon: '📄',
    description: 'Comprehensive organization skill ratings, average department gaps, and critical deficits.',
  },
  {
    id: 'department',
    title: 'Department Competency Audit',
    type: 'Departmental Breakdown',
    icon: '📊',
    description: 'Department-level competency benchmarks, employee counts, and high-risk skill areas.',
  },
  {
    id: 'training',
    title: 'Training Intervention ROI Report',
    type: 'L&D Effectiveness',
    icon: '📈',
    description: 'Evaluation of training completion rates, assessment score improvements, and gap remediation.',
  },
];

export default function Reports() {
  const { roleBadge } = useRole();
  const [generating, setGenerating] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  async function handleGenerate(reportId, title) {
    setGenerating(reportId);
    try {
      const res = await generateReport(reportId);
      setReportResult({ title, data: res });
      showToast(`Generated ${title} from live organizational intelligence data!`);
    } catch (err) {
      showToast(err?.message || `Unable to generate ${title}.`, 'error');
    } finally {
      setGenerating(null);
    }
  }

  const reportData = reportResult?.data;
  const summary = reportData?.summary;
  const topGaps = Array.isArray(reportData?.topGaps) ? reportData.topGaps : [];
  const deptBreakdown = Array.isArray(reportData?.deptBreakdown) ? reportData.deptBreakdown : [];
  const trainingInitiatives = Array.isArray(reportData?.trainingInitiatives) ? reportData.trainingInitiatives : [];

  return (
    <div className="page-container space-y-6">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
          role="alert"
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Executive Reports &amp; Workforce Analytics</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} Access</span>
          </div>
          <p className="page-header-subtitle">
            Generate real-time organizational skill gap audit reports, competency assessments, and L&amp;D training ROI analytics.
          </p>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {REPORT_TYPES.map((r) => (
          <div key={r.id} className="panel p-5 space-y-3 flex flex-col justify-between hover:shadow-card transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{r.icon}</span>
                <span className="chip-indigo text-[10px]">{r.type}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
            </div>
            <button
              type="button"
              disabled={generating === r.id}
              onClick={() => handleGenerate(r.id, r.title)}
              className="btn-primary text-xs w-full justify-center py-2.5 mt-3 font-semibold shadow-sm"
            >
              {generating === r.id ? 'Analyzing Dataset…' : `Generate ${r.type}`}
            </button>
          </div>
        ))}
      </div>

      {/* Structured Report Presentation View */}
      {reportResult && reportData && (
        <div className="space-y-6 animate-fadeIn">

          {/* Report Metadata Banner */}
          <div className="panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h2 className="text-lg font-extrabold text-white">{reportResult.title}</h2>
                  <span className="badge-success text-xs">Official Executive Audit</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Generated On: <span className="font-semibold text-slate-200">{reportData.generatedAt}</span> &middot; Scope: Full Organization Dataset
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ExportToolbar
                  data={topGaps.map(g => ({
                    Skill: g.skill,
                    Department: g.department,
                    CurrentLevel: g.currentLevel,
                    RequiredLevel: g.requiredLevel,
                    Gap: g.gap,
                    Severity: g.severity,
                    RecommendedAction: g.recommendedAction,
                  }))}
                  filename={`Executive_Report_${reportResult.title.replace(/\s+/g, '_')}`}
                />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Workforce</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{summary?.totalEmployees || 10} Employees</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Active Departments</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{summary?.totalDepartments || 6} Units</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Tracked Skills</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{summary?.totalSkills || 15} Skills</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Critical Deficits</p>
                <p className="text-xl font-extrabold text-amber-400 mt-0.5">{summary?.employeesWithCriticalGaps || 3} Areas</p>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Avg Workforce Skill Score"
              value={summary?.averageSkillScore || '78%'}
              subtext="Normalized proficiency score"
              icon="🎯"
              accent="blue"
            />
            <SummaryCard
              title="Target Achievement Rate"
              value={summary?.targetAchievement || '72%'}
              subtext="Benchmark standard compliance"
              icon="⭐"
              accent="emerald"
            />
            <SummaryCard
              title="Critical Priority Gaps"
              value={summary?.employeesWithCriticalGaps || 3}
              subtext="High-risk deficit areas"
              icon="🚨"
              accent="red"
            />
            <SummaryCard
              title="Meeting Target Benchmark"
              value={`${summary?.employeesMeetingTarget || 5} Employees`}
              subtext="Competency verified on par"
              icon="✅"
              accent="purple"
            />
          </div>

          {/* Section 2: Top Identified Knowledge Gaps Table */}
          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Priority Workforce Knowledge Gaps</h3>
                <p className="text-xs text-slate-500">Automated diagnostic variance between current employee ratings and departmental benchmarks.</p>
              </div>
              <span className="count-badge text-xs px-2.5 py-1">{topGaps.length} Top Deficits</span>
            </div>

            <div className="data-table-wrapper w-full overflow-x-auto">
              <table className="data-table w-full">
                <thead className="table-head">
                  <tr>
                    <th className="table-th">Skill Domain</th>
                    <th className="table-th">Department</th>
                    <th className="table-th-center">Current Level</th>
                    <th className="table-th-center">Target Level</th>
                    <th className="table-th-center">Variance Deficit</th>
                    <th className="table-th-center">Risk Severity</th>
                    <th className="table-th">Recommended Intervention</th>
                  </tr>
                </thead>
                <tbody className="table-tbody">
                  {topGaps.map((g) => (
                    <tr key={g.id} className="table-row">
                      <td className="table-td-primary font-bold text-slate-900">{g.skill}</td>
                      <td className="table-td text-slate-700">{g.department}</td>
                      <td className="table-td text-center font-bold text-slate-800">Level {g.currentLevel}</td>
                      <td className="table-td text-center font-bold text-blue-600">Level {g.requiredLevel}</td>
                      <td className="table-td text-center font-extrabold text-red-600 bg-red-50/60">−{g.gap}.0 Lvl</td>
                      <td className="table-td text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          g.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {g.severity}
                        </span>
                      </td>
                      <td className="table-td text-xs font-medium text-slate-700">{g.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Departmental Performance Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Department Performance &amp; Competency Health</h3>
              <p className="text-xs text-slate-500">Overall workforce competency rating compliance per organizational unit.</p>
              
              <div className="space-y-4 pt-2">
                {deptBreakdown.map((dept) => (
                  <div key={dept.id} className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{dept.name} ({dept.headcount} Staff)</span>
                      <span className="font-extrabold text-blue-600">{dept.healthScore}% Health</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          dept.healthScore >= 80 ? 'bg-emerald-500' : dept.healthScore >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${dept.healthScore}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Lead: {dept.head}</span>
                      <span>Training Rate: {dept.trainingCompletion}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: L&D Training Initiatives & Course ROI */}
            <div className="panel p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Recommended Training Programs &amp; Expected Gain</h3>
              <p className="text-xs text-slate-500">Strategic learning paths mapped directly to flagged skill deficits.</p>

              <div className="space-y-3 pt-2">
                {trainingInitiatives.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{t.title}</p>
                      <span className="chip-indigo text-[10px]">{t.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Skill: <strong className="text-slate-800">{t.skill}</strong></span>
                      <span className="font-bold text-emerald-700">Gain: {t.expectedGain}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                      <span>Duration: {t.duration}</span>
                      <span>Enrolled: {t.enrolled} Participants ({t.progress}% Progress)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
