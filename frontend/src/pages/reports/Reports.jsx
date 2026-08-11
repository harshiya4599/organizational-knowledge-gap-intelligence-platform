import { useRole } from '../../context/RoleContext';

export default function Reports() {
  const { roleBadge } = useRole();

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Executive Reports &amp; Exports</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} Access</span>
          </div>
          <p className="page-header-subtitle">Generate and download organizational skill gap reports and compliance documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: 'Workforce Skill Gap Summary', type: 'PDF / CSV', icon: '📄' },
          { title: 'Department Competency Audit', type: 'Excel XLSX', icon: '📊' },
          { title: 'Training Intervention ROI Report', type: 'PDF Report', icon: '📈' },
        ].map((r, i) => (
          <div key={i} className="panel p-5 space-y-3">
            <span className="text-2xl">{r.icon}</span>
            <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
            <span className="chip-indigo text-[10px]">{r.type}</span>
            <button type="button" className="btn-outline text-xs w-full justify-center py-2 mt-2">
              Generate Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
