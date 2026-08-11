import { useRole } from '../../context/RoleContext';

export default function SystemSettings() {
  const { roleBadge } = useRole();

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">System Settings &amp; Platform Config</h1>
            <span className={roleBadge.badgeClass}>System Admin</span>
          </div>
          <p className="page-header-subtitle">Platform configuration, API integration parameters, and authentication rules</p>
        </div>
      </div>

      <div className="panel p-6 space-y-6 max-w-2xl">
        <h3 className="section-title">Authentication &amp; Security Settings</h3>
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="font-bold text-slate-800">OAuth2 Social Login</p>
              <p className="text-slate-500 text-[11px]">Google &amp; Microsoft SSO active</p>
            </div>
            <span className="badge-success">Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="font-bold text-slate-800">RBAC Role Enforcement</p>
              <p className="text-slate-500 text-[11px]">3-Role Frontend RBAC Guard Active</p>
            </div>
            <span className="badge-purple">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
