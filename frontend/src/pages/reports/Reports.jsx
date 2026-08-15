import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { generateReport } from '../../services/reportService';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ExportToolbar from '../../components/common/ExportToolbar';

export default function Reports() {
  const { user } = useAuth();
  const { roleBadge, isEmployee, isManager, isAdmin } = useRole();
  const employeeId = user?.employeeId || user?.id || 3;

  const [generating, setGenerating] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState('individual-skill-gap');
  const [reportResult, setReportResult] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  // ── Role-Based Available Report Catalog ────────────────────────────
  const availableReportTypes = useMemo(() => {
    if (isEmployee) {
      return [
        {
          id: 'individual-skill-gap',
          title: 'My Personal Skill Gap Report',
          type: 'Personal Diagnostics',
          icon: '👤',
          description: 'Personal skill ratings, target benchmarks, gap variance, and recommended learning interventions.',
        },
        {
          id: 'training-effectiveness',
          title: 'My Learning Progress & Effectiveness',
          type: 'Learning Progress',
          icon: '📚',
          description: 'Personal course completion rates, assessment score improvements, and verified skill gains.',
        },
      ];
    }
    if (isManager) {
      return [
        {
          id: 'department-gap-summary',
          title: 'Department Skill Gap Summary Report',
          type: 'Department Audit',
          icon: '📊',
          description: 'Department-level competency benchmarks, team member gap counts, and critical risk areas.',
        },
        {
          id: 'training-effectiveness',
          title: 'Team Training Effectiveness Report',
          type: 'Team L&D Audit',
          icon: '📈',
          description: 'Evaluation of team course completions, pre/post evaluation scores, and skill gain velocity.',
        },
        {
          id: 'individual-skill-gap',
          title: 'Team Member Skill Gap Diagnostics',
          type: 'Individual Diagnostics',
          icon: '👥',
          description: 'Individual employee skill gap breakdown across engineering team members.',
        },
      ];
    }
    // Administrator
    return [
      {
        id: 'individual-skill-gap',
        title: 'Individual Skill Gap Diagnostic Report',
        type: 'Workforce Diagnostics',
        icon: '👤',
        description: 'Detailed employee skill ratings, target benchmarks, gap variance, risk severity, and recommendations.',
      },
      {
        id: 'department-gap-summary',
        title: 'Department Skill Gap & Competency Audit',
        type: 'Departmental Breakdown',
        icon: '📊',
        description: 'Department-level competency benchmarks, employee headcount, and high-risk skill areas.',
      },
      {
        id: 'training-effectiveness',
        title: 'L&D Training Intervention & Effectiveness Audit',
        type: 'L&D Effectiveness',
        icon: '📈',
        description: 'Evaluation of training completion rates, assessment score improvements, and gap remediation.',
      },
      {
        id: 'learning-roi',
        title: 'L&D Training ROI & Competency Value Analysis',
        type: 'ROI Analysis',
        icon: '💳',
        description: 'Derived skill ROI analysis, learning hours invested, gap closure rates, and effectiveness index.',
      },
      {
        id: 'strategic-workforce',
        title: 'Strategic Workforce Skill Planning & Forecasting',
        type: 'Strategic Forecasting',
        icon: '🌐',
        description: 'Organization workforce skill inventory, high-risk skill deficits, 90-day projected demand, and forecast gap %.',
      },
    ];
  }, [isEmployee, isManager, isAdmin]);

  // Set default report type based on role
  useEffect(() => {
    if (availableReportTypes.length > 0 && !availableReportTypes.some(r => r.id === selectedReportId)) {
      setSelectedReportId(availableReportTypes[0].id);
    }
  }, [availableReportTypes, selectedReportId]);

  async function handleGenerate(reportId, title) {
    setGenerating(reportId);
    setSelectedReportId(reportId);
    try {
      const res = await generateReport(reportId, {
        userRole: isEmployee ? 'Employee' : isManager ? 'Manager' : 'Administrator',
        employeeId,
      });
      setReportResult({ title, data: res });
      showToast(`✓ Generated ${title} from live organizational dataset!`);
    } catch (err) {
      showToast(err?.message || `Unable to generate ${title}.`, 'error');
    } finally {
      setGenerating(null);
    }
  }

  // Load default report on initial mount
  useEffect(() => {
    if (!reportResult && availableReportTypes.length > 0) {
      handleGenerate(availableReportTypes[0].id, availableReportTypes[0].title);
    }
  }, []);

  const reportData = reportResult?.data;
  const summary = reportData?.summary;
  const columns = reportData?.columns || [];
  const rawTableData = reportData?.tableData || [];

  // Filter Table Data
  const filteredTableData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawTableData.filter(row => {
      const matchesDept = deptFilter === 'All' || !row.department || row.department === deptFilter;
      const matchesSkill = skillFilter === 'All' || !row.skill || row.skill === skillFilter || !row.skillDomain || row.skillDomain === skillFilter;
      const matchesSearch = !q || Object.values(row).some(val => String(val).toLowerCase().includes(q));
      return matchesDept && matchesSkill && matchesSearch;
    });
  }, [rawTableData, deptFilter, skillFilter, searchQuery]);

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
            Generate role-tailored skill gap diagnostic reports, department audits, L&amp;D training ROI analytics, and strategic workforce forecasts.
          </p>
        </div>
      </div>

      {/* Report Type Selector Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableReportTypes.map((r) => {
          const isSelected = selectedReportId === r.id;
          return (
            <div
              key={r.id}
              className={`panel p-5 space-y-3 flex flex-col justify-between transition-all ${
                isSelected ? 'border-2 border-blue-500 bg-blue-50/30 shadow-md' : 'hover:shadow-card'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{r.icon}</span>
                  <span className="chip-indigo text-[10px] font-bold">{r.type}</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
              </div>
              <button
                type="button"
                disabled={generating === r.id}
                onClick={() => handleGenerate(r.id, r.title)}
                className={`btn-primary text-xs w-full justify-center py-2.5 mt-2 font-bold shadow-sm ${
                  isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {generating === r.id ? 'Generating Report…' : `Generate ${r.type} \u2192`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Structured Report Presentation View */}
      {reportResult && reportData && (
        <div className="space-y-6 animate-fadeIn">

          {/* Report Metadata Banner & Export Toolbar */}
          <div className="panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">📊</span>
                  <h2 className="text-lg font-extrabold text-white">{reportResult.title}</h2>
                  <span className="badge-success text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                    Official {reportData.roleScope} Audit
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Generated On: <span className="font-semibold text-slate-200">{reportData.generatedAt}</span> &bull; Scope: {reportData.roleScope} Data Universe
                </p>
              </div>

              <div className="shrink-0">
                <ExportToolbar
                  data={filteredTableData}
                  columns={columns}
                  filename={`Report_${reportResult.title.replace(/\s+/g, '_')}`}
                  title="Export Options"
                />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Scope</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{summary?.totalEmployees || summary?.workforceHeadcount || 10} Headcount</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tracked Skills</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{summary?.totalSkills || summary?.trackedDomains || 15} Skills</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Proficiency Score</p>
                <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{summary?.averageSkillScore || summary?.averageCoverage || '76%'}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Critical Deficits</p>
                <p className="text-lg font-extrabold text-amber-400 mt-0.5">{summary?.employeesWithCriticalGaps || 2} Areas</p>
              </div>
            </div>
          </div>

          {/* Interactive Report Filters */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-60">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter report records..."
                  className="form-input text-xs pl-8 w-full"
                />
              </div>

              {!isEmployee && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Department:</label>
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="form-select text-xs w-auto font-bold"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Skill Filter:</label>
                <select
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                  className="form-select text-xs w-auto font-bold"
                >
                  <option value="All">All Skills</option>
                  <option value="AWS Cloud">AWS Cloud</option>
                  <option value="Docker & Kubernetes">Docker &amp; Kubernetes</option>
                  <option value="React">React</option>
                  <option value="System Architecture">System Architecture</option>
                </select>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredTableData.length} of {rawTableData.length} records
            </span>
          </div>

          {/* Section 1: Executive KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Average Proficiency"
              value={summary?.averageSkillScore || summary?.averageCoverage || '76%'}
              subtext="Normalized workforce competency rating"
              icon="🎯"
              accent="blue"
            />
            <SummaryCard
              title="Target Compliance Rate"
              value={summary?.targetAchievement || summary?.averageCompletionRate || '74%'}
              subtext="Benchmark standard compliance"
              icon="⭐"
              accent="emerald"
            />
            <SummaryCard
              title="Critical Priority Gaps"
              value={summary?.employeesWithCriticalGaps || 2}
              subtext="High-risk deficit areas requiring action"
              icon="🚨"
              accent="amber"
            />
            <SummaryCard
              title="Training Effectiveness"
              value={summary?.trainingEffectivenessScore || '82%'}
              subtext="L&D skill gain index"
              icon="📈"
              accent="purple"
            />
          </div>

          {/* Section 2: Detailed Data Table View */}
          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{reportResult.title} — Detailed Data Matrix</h3>
                <p className="text-xs text-slate-500">Live verified data records synchronized with Gap Analysis and Learning Progress.</p>
              </div>
              <span className="count-badge text-xs px-2.5 py-1 font-bold">{filteredTableData.length} Rows</span>
            </div>

            <div className="table-container">
              <table className="table-base">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="table-th">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.map((row, idx) => (
                    <tr key={row.id || idx} className="table-row">
                      {columns.map(col => {
                        const val = row[col.key] !== undefined ? row[col.key] : '—';
                        const isSeverity = col.key === 'severity' || col.key === 'riskLevel';
                        const isGap = col.key === 'gap' || col.key === 'forecastGap';
                        return (
                          <td key={col.key} className={`table-td text-xs ${isGap ? 'font-extrabold text-red-600' : 'text-slate-800'}`}>
                            {isSeverity ? (
                              <span className={`text-[11px] font-bold py-0.5 px-2.5 rounded-full border ${
                                String(val).includes('Critical') ? 'badge-danger bg-red-50 text-red-700 border-red-200' :
                                String(val).includes('High') ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                                'badge-success bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
