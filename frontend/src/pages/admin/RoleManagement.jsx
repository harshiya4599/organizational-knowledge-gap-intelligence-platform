import { useRole } from '../../context/RoleContext';

const ROLES_LIST = [
  {
    role: 'Employee',
    mappedFrom: 'Employee',
    usersCount: 142,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Personal skill scoring, self gap analysis, and recommended learning access.',
  },
  {
    role: 'Manager',
    mappedFrom: 'Team Lead, Department Head',
    usersCount: 28,
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Department health monitoring, team competency matrix, and team deficit reporting.',
  },
  {
    role: 'Administrator',
    mappedFrom: 'HR Specialist, L&D Admin, System Administrator',
    usersCount: 5,
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Full system governance, organizational gap heatmaps, user management & RBAC administration.',
  },
];

export default function RoleManagement() {
  const { roleBadge } = useRole();

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Role Management &amp; RBAC Architecture</h1>
            <span className={roleBadge.badgeClass}>Governance</span>
          </div>
          <p className="page-header-subtitle">
            3-Role Consolidated Frontend Access Control with future-ready backend mapping.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {ROLES_LIST.map((r, i) => (
          <div key={i} className="panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${r.badge}`}>
                {r.role}
              </span>
              <span className="text-xs font-semibold text-slate-500">{r.usersCount} Assigned</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
            <div className="pt-3 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Consolidated Backend Roles:</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 block">
                {r.mappedFrom}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
