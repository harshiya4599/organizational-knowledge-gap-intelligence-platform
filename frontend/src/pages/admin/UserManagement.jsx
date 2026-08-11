import { useState } from 'react';
import { useRole } from '../../context/RoleContext';

const INITIAL_USERS = [
  { id: 1, name: 'Rohith N', email: 'admin@company.com', role: 'Administrator', status: 'Active', department: 'Executive Management', lastActive: '2 mins ago' },
  { id: 2, name: 'Department Lead', email: 'manager@company.com', role: 'Manager', status: 'Active', department: 'Engineering', lastActive: '10 mins ago' },
  { id: 3, name: 'Senior Specialist', email: 'employee@company.com', role: 'Employee', status: 'Active', department: 'Software Development', lastActive: '1 hour ago' },
  { id: 4, name: 'David Chen', email: 'david.chen@company.com', role: 'Employee', status: 'Active', department: 'Engineering', lastActive: '3 hours ago' },
  { id: 5, name: 'Alice Johnson', email: 'alice.j@company.com', role: 'Manager', status: 'Active', department: 'Data Science', lastActive: 'Yesterday' },
];

export default function UserManagement() {
  const { roleBadge } = useRole();
  const [users] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container space-y-6">
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header-title">User Management</h1>
            <span className={roleBadge.badgeClass}>Admin Governance</span>
          </div>
          <p className="page-header-subtitle">Manage user accounts, assign system access levels, and monitor user statuses</p>
        </div>
        <button type="button" className="btn-primary text-xs flex items-center gap-2">
          <span>+</span> Add New User
        </button>
      </div>

      <div className="filter-bar flex items-center justify-between gap-4">
        <div className="search-input-wrapper flex-1 max-w-sm">
          <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <span className="count-badge">{filtered.length} Active Accounts</span>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead className="table-head">
            <tr>
              <th className="table-th">User Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Assigned Role</th>
              <th className="table-th">Department</th>
              <th className="table-th">Status</th>
              <th className="table-th">Last Active</th>
            </tr>
          </thead>
          <tbody className="table-tbody">
            {filtered.map(u => (
              <tr key={u.id} className="table-row">
                <td className="table-td-primary font-bold">{u.name}</td>
                <td className="table-td text-slate-600">{u.email}</td>
                <td className="table-td">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    u.role === 'Administrator' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    u.role === 'Manager' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="table-td text-slate-600">{u.department}</td>
                <td className="table-td"><span className="badge-success">{u.status}</span></td>
                <td className="table-td text-slate-400 text-xs">{u.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
