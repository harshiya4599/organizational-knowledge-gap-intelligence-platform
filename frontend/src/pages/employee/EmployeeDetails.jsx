import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById } from '../../services/employeeService';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';

const STATUS_STYLES = {
  'Active':   'badge-success',
  'Inactive': 'badge-danger',
  'On Leave': 'badge-warning',
};

export default function EmployeeDetails() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [employee,  setEmployee]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  function fetchEmployee() {
    setLoading(true);
    setError(null);
    getEmployeeById(id)
      .then((data) => { setEmployee(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }

  useEffect(() => { fetchEmployee(); }, [id]);

  if (loading) return <LoadingScreen message="Loading employee profile…" />;
  if (error)   return <ErrorState message={error} onRetry={fetchEmployee} />;
  if (!employee) return null;

  const initials = (employee.name || 'EM')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container max-w-4xl">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost gap-1.5 -ml-2 pl-2 text-xs"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Employees
      </button>

      <div className="panel">
        {/* ── Gradient Header Banner ─────────────────────── */}
        <div className="profile-header p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 relative z-10">
            <div className="avatar-2xl shadow-card text-2xl border-2 border-white/30">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{employee.name}</h1>
                <span className={`shrink-0 ${STATUS_STYLES[employee.status] ?? 'badge-neutral'} text-xs px-2.5 py-0.5`}>
                  {employee.status}
                </span>
              </div>
              <p className="text-sm text-blue-200 mt-0.5">{employee.designation} · {employee.department}</p>
              <p className="text-xs text-blue-300 mt-1">Employee Code: {employee.employeeCode || `EMP-${employee.id}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-xl text-xs font-semibold text-white border border-white/20">
              {employee.experience ? `${employee.experience} yrs exp.` : 'Senior Staff'}
            </span>
          </div>
        </div>

        {/* ── Tabs Navigation ────────────────────────────── */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview &amp; Contact
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'skills'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Assigned Skills ({employee.skills.length})
          </button>
        </div>

        {/* ── Tab Content ────────────────────────────────── */}
        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="section-title">Personal Details</h3>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="info-key">Full Name</span>
                    <span className="info-value">{employee.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Email Address</span>
                    <span className="info-value">{employee.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Status</span>
                    <span className="info-value">{employee.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="section-title">Organizational Role</h3>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="info-key">Department</span>
                    <span className="info-value">{employee.department}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Designation</span>
                    <span className="info-value">{employee.designation}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Experience</span>
                    <span className="info-value">{employee.experience} years</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="section-title">Assigned Skill Competencies</h3>
              {employee.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employee.skills.map((skill) => (
                    <div key={skill} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-sm font-bold text-slate-800">{skill}</span>
                      </div>
                      <span className="chip-indigo text-xs">Proficient</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No skills assigned yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
