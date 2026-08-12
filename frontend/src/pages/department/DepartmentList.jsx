import { useState, useEffect } from 'react';
import { getDepartments } from '../../services/departmentService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const DEPT_COLUMNS = [
  { label: 'Department Name', key: 'name' },
  { label: 'Description',     key: 'description' },
  { label: 'Department Head', key: 'head' },
  { label: 'Employee Count',  key: 'employeeCount' },
];

const DEPT_ACCENTS = [
  { bg: 'from-blue-600 to-indigo-600',   icon: '🏢', light: 'bg-blue-50 text-blue-600', badge: 'badge-info' },
  { bg: 'from-purple-600 to-indigo-600', icon: '💡', light: 'bg-purple-50 text-purple-600', badge: 'badge-purple' },
  { bg: 'from-emerald-500 to-teal-600',  icon: '🔬', light: 'bg-emerald-50 text-emerald-600', badge: 'badge-success' },
  { bg: 'from-amber-500 to-orange-500',  icon: '📊', light: 'bg-amber-50 text-amber-600', badge: 'badge-warning' },
  { bg: 'from-rose-500 to-pink-600',     icon: '⚙️',  light: 'bg-rose-50 text-rose-600', badge: 'badge-danger' },
  { bg: 'from-indigo-600 to-blue-700',   icon: '🎯', light: 'bg-indigo-50 text-indigo-600', badge: 'badge-indigo' },
];

function DepartmentCard({ dept, idx }) {
  const accent = DEPT_ACCENTS[idx % DEPT_ACCENTS.length];
  const headName = dept.head || dept.manager?.name || dept.manager || 'Department Lead';

  return (
    <div className="panel card-hover flex flex-col overflow-hidden group">
      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accent.bg}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${accent.light} flex items-center justify-center text-xl shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
              {accent.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {dept.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Organizational Unit</p>
            </div>
          </div>
          <span className={`${accent.badge} text-[11px]`}>{dept.status || 'Active'}</span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed">
          {dept.description || 'Department responsible for operational excellence and skill alignment.'}
        </p>

        {/* Stats Grid */}
        <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Department Head</span>
            <span className="font-semibold text-slate-800 truncate block">{headName}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Team Size</span>
            <span className="font-extrabold text-blue-600 text-sm block">{dept.employeeCount || 2} members</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  function fetchDepartments() {
    setLoading(true);
    setError(null);
    getDepartments()
      .then((data) => {
        const safeData = Array.isArray(data) && data.length > 0 ? data : getCollection('departments');
        setDepartments(safeData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[DepartmentList] Backend failed, loading from hybridStore:', err);
        const fallback = getCollection('departments');
        setDepartments(fallback);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDepartments();
    const unsub = subscribeToStore(fetchDepartments);
    return unsub;
  }, []);

  const safeDepts = Array.isArray(departments) ? departments : [];

  if (loading) return <LoadingScreen message="Loading departments overview…" />;
  if (error && safeDepts.length === 0) return <ErrorState message={error} onRetry={fetchDepartments} />;

  const totalHeadcount = safeDepts.reduce((acc, d) => acc + (d?.employeeCount || 0), 0);

  return (
    <div className="page-container">
      {/* Header Row */}
      <div className="page-header-row mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">Departments Overview</h1>
            <span className="count-badge text-xs">{safeDepts.length} Departments</span>
          </div>
          <p className="page-header-subtitle">
            Organizational divisions, headcounts, and leadership structure across {totalHeadcount} employees.
          </p>
        </div>

        <ExportToolbar
          data={safeDepts}
          columns={DEPT_COLUMNS}
          filename="Organizational_Departments"
        />
      </div>

      {safeDepts.length === 0 ? (
        <EmptyState
          title="No Departments Found"
          message="There are currently no active organizational departments registered in the system."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeDepts.map((dept, idx) => (
            <DepartmentCard key={dept.id || idx} dept={dept} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
