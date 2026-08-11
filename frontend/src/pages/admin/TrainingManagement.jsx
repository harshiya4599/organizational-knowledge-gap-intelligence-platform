import { useRole } from '../../context/RoleContext';

export default function TrainingManagement() {
  const { roleBadge } = useRole();

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Training &amp; L&amp;D Management</h1>
            <span className={roleBadge.badgeClass}>L&amp;D Admin</span>
          </div>
          <p className="page-header-subtitle">Configure training programs, manage course assignments, and track skill interventions</p>
        </div>
        <button type="button" className="btn-primary text-xs flex items-center gap-2">
          <span>+</span> Create New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { name: 'Docker Containerization & Kubernetes', dept: 'Engineering', enrolled: 42, status: 'In Progress' },
          { name: 'Power BI Advanced Financial Modeling', dept: 'Finance & Data Science', enrolled: 28, status: 'Active' },
          { name: 'React 19 Architecture Patterns', dept: 'Engineering', enrolled: 35, status: 'In Progress' },
        ].map((t, i) => (
          <div key={i} className="panel p-5 space-y-3">
            <span className="badge-info text-[10px]">{t.dept}</span>
            <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Enrolled: <strong>{t.enrolled}</strong></span>
              <span className="text-emerald-600 font-bold">{t.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
