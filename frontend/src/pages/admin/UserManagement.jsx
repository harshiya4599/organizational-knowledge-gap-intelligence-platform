import { useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import { getUsers, addUser } from '../../services/userService';
import { subscribeToStore, getCollection } from '../../utils/hybridStore';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState    from '../../components/feedback/ErrorState';
import EmptyState    from '../../components/feedback/EmptyState';

export default function UserManagement() {
  const { roleBadge } = useRole();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');

  function fetchUsers() {
    setLoading(true);
    setError(null);
    getUsers()
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : getCollection('users');
        setUsers(list);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[UserManagement] Backend failed, loading from hybridStore:', err);
        const fallback = getCollection('users');
        setUsers(fallback);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchUsers();
    const unsub = subscribeToStore(fetchUsers);
    return unsub;
  }, []);

  const safeUsers = Array.isArray(users) ? users : [];

  if (loading) return <LoadingScreen message="Loading user accounts…" />;
  if (error && safeUsers.length === 0) return <ErrorState message={error} onRetry={fetchUsers} />;

  const filtered = safeUsers.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase())
  );

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
      </div>

      <div className="panel p-4 flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input max-w-sm text-xs"
        />
        <span className="count-badge text-xs px-3 py-1 font-semibold">{filtered.length} Users</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Users Found" message="No user accounts match your search query." />
      ) : (
        <div className="panel p-0 overflow-hidden">
          <div className="data-table-wrapper w-full overflow-x-auto">
            <table className="data-table w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-th">User Profile</th>
                  <th className="table-th">Username</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">System Role</th>
                  <th className="table-th">Account Status</th>
                  <th className="table-th-center">Last Active</th>
                </tr>
              </thead>
              <tbody className="table-tbody">
                {filtered.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-td-primary font-bold text-slate-900">{u.name}</td>
                    <td className="table-td text-xs font-mono text-slate-700">{u.username}</td>
                    <td className="table-td text-xs text-slate-600">{u.email}</td>
                    <td className="table-td text-slate-800">{u.department}</td>
                    <td className="table-td">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role.includes('ADMIN') ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        u.role.includes('MANAGER') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {u.roleDisplay || u.role}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="badge-success text-xs">Active</span>
                    </td>
                    <td className="table-td text-center text-xs text-slate-500">{u.lastActive || 'Just now'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
