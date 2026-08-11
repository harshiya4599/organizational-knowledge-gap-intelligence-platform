import { useRole } from '../../context/RoleContext';

export default function AnalyticsView() {
  const { roleBadge } = useRole();

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Analytics &amp; AI Intelligence Engine</h1>
            <span className={roleBadge.badgeClass}>Deep Analytics</span>
          </div>
          <p className="page-header-subtitle">Advanced machine learning workforce predictive insights and gap forecasting</p>
        </div>
      </div>

      <div className="panel p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4">
        <h3 className="text-lg font-bold text-white">AI Skill Gap Predictive Model</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          The AI Intelligence engine projects a 24.2% gap reduction rate across the Engineering and Data Science divisions over the next 90 days following completion of active learning paths.
        </p>
      </div>
    </div>
  );
}
