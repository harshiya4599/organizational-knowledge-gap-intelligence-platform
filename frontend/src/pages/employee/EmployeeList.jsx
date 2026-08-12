import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEmployees } from '../../services/employeeService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import ExportToolbar from '../../components/common/ExportToolbar';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

const STATUS_STYLES = {
  'Active':   'badge-success',
  'Inactive': 'badge-danger',
  'On Leave': 'badge-warning',
};

const EMPLOYEE_COLUMNS = [
  { label: 'Employee Code', key: 'employeeCode' },
  { label: 'Full Name',     key: 'name' },
  { label: 'Email',         key: 'email' },
  { label: 'Department',    key: 'department' },
  { label: 'Designation',   key: 'designation' },
  { label: 'Experience (Yrs)', key: 'experience' },
  { label: 'Status',        key: 'status' },
];

export default function EmployeeList() {
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  function fetchEmployees() {
    setLoading(true);
    setError(null);
    getEmployees()
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : getCollection('employees');
        setEmployees(list);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[EmployeeList] Backend failed, loading from hybridStore:', err);
        const fallback = getCollection('employees');
        setEmployees(fallback);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchEmployees();
    const unsub = subscribeToStore(fetchEmployees);
    return unsub;
  }, []);

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const departments = ['All', ...new Set(safeEmployees.map((e) => e?.department).filter(Boolean))];

  const filtered = safeEmployees.filter((e) => {
    if (!e) return false;
    const nameStr = (e.name || '').toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchesSearch = nameStr.includes(searchStr);
    const matchesDept   = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) return <LoadingScreen message="Loading employees…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchEmployees} />;

  return (
    <div className="page-container">

      {/* ── Page Header ────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Employees</h1>
          <p className="page-header-subtitle">Manage and view workforce profiles</p>
        </div>
        <span className="count-badge">{employees.length} total</span>
      </div>

      {/* ── Export Toolbar ──────────────────────────────── */}
      <ExportToolbar
        data={filtered}
        columns={EMPLOYEE_COLUMNS}
        filename="employees_report"
        title="Export Employee List"
      />

      {/* ── Filters ────────────────────────────────────── */}
      <div className="filter-bar flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            id="employee-search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select
          id="dept-filter"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="form-select sm:w-52"
        >
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* ── Results ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No employees found"
          message={employees.length === 0 ? "No employee records exist in the database yet." : "Try adjusting your search or department filter."}
        />
      ) : (
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="table-head">
                <tr>
                  {['Name', 'Department', 'Designation', 'Experience', 'Status', 'Action'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-tbody">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="avatar-sm text-[10px] shrink-0">
                          {(emp.name || 'EM').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="chip-slate">{emp.department}</span>
                    </td>
                    <td className="table-td text-slate-600">{emp.designation}</td>
                    <td className="table-td text-slate-600">
                      {emp.experience ? `${emp.experience} yrs` : '—'}
                    </td>
                    <td className="table-td">
                      <span className={STATUS_STYLES[emp.status] ?? 'badge-neutral'}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
                      >
                        View Details
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 19 5 12 12 5"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="table-footer">
            <span>Showing {filtered.length} of {employees.length} employees</span>
            {filtered.length < employees.length && (
              <span className="text-blue-600 font-semibold">Filter active</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
