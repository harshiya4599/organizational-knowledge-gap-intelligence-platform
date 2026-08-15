import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import {
  getNotifications,
  toggleNotificationRead,
  markAllRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationDeliveryLogs,
} from '../../services/notificationService';
import { subscribeToStore } from '../../utils/hybridStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import LoadingScreen from '../../components/feedback/LoadingScreen';
import ErrorState from '../../components/feedback/ErrorState';

function formatTime12h(time24 = '22:00') {
  if (!time24) return '10:00 PM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function NotificationsView() {
  const { user } = useAuth();
  const { roleBadge, isManager, isAdmin } = useRole();
  const navigate = useNavigate();
  const employeeId = isManager ? 2 : isAdmin ? 1 : (user?.employeeId || user?.id || 3);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('center'); // 'center' | 'preferences' | 'logs'

  // Data
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [deliveryLogs, setDeliveryLogs] = useState([]);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [nList, pData, lData] = await Promise.all([
        getNotifications(employeeId),
        getNotificationPreferences(employeeId),
        getNotificationDeliveryLogs(),
      ]);
      setNotifications(Array.isArray(nList) ? nList : []);
      setPreferences(pData || {});
      setDeliveryLogs(Array.isArray(lData) ? lData : []);
      setLoading(false);
    } catch (err) {
      console.warn('[NotificationsView] Error loading data:', err);
      setError('Unable to load notifications. Please retry.');
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return unsub;
  }, [loadData]);

  // ── Actions ─────────────────────────────────────────────────────────
  function handleToggleRead(id) {
    toggleNotificationRead(id);
  }

  function handleMarkAllRead() {
    markAllRead(employeeId);
    showToast('✓ All notifications marked as read.');
  }

  function handleNotificationNavigate(n) {
    handleToggleRead(n.id);
    let targetRoute = n.actionRoute || '/dashboard';
    
    // Normalize routes for Manager & Admin navigation
    if (targetRoute === '/knowledge-sharing') targetRoute = '/mentorship';

    // Guard against employee routing to restricted admin routes
    const restrictedAdminRoutes = [
      '/system-settings',
      '/user-management',
      '/role-management',
      '/training-management',
      '/analytics',
      '/skills',
      '/department-skill-matrix'
    ];
    if (restrictedAdminRoutes.includes(targetRoute) && !isAdmin && !isManager) {
      targetRoute = '/dashboard';
    }

    navigate(targetRoute);
  }

  function handlePrefToggle(key, value) {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    updateNotificationPreferences(updated);
    showToast('✓ Notification preferences updated.');
  }

  function handleCategoryChannelToggle(category, channel) {
    const currentCats = preferences.categoryChannels || {};
    const catChannels = currentCats[category] || { email: true, sms: false, push: true };
    const updatedCat = { ...catChannels, [channel]: !catChannels[channel] };

    const updated = {
      ...preferences,
      categoryChannels: {
        ...currentCats,
        [category]: updatedCat,
      },
    };

    setPreferences(updated);
    updateNotificationPreferences(updated);
    showToast(`✓ Channel ${channel.toUpperCase()} updated for ${category}.`);
  }

  function applyTimePreset(start, end) {
    const updated = {
      ...preferences,
      quietHoursEnabled: true,
      quietHoursStart: start,
      quietHoursEnd: end,
    };
    setPreferences(updated);
    updateNotificationPreferences(updated);
    showToast(`✓ Quiet hours updated: ${formatTime12h(start)} to ${formatTime12h(end)}`);
  }

  // ── Derived Metrics ────────────────────────────────────────────────
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'Critical' || n.priority === 'High').length;
  const alertsCount = notifications.filter(n => n.category === 'Alerts' || n.category === 'Skill Gap').length;

  // ── Filtered Notifications ─────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const displayedNotifications = notifications.filter(n => {
    const matchesCategory = categoryFilter === 'All' || 
      n.category === categoryFilter || 
      (categoryFilter === 'Alerts' && n.category === 'Skill Gap') || 
      (categoryFilter === 'Skill Gap' && n.category === 'Alerts');
    const matchesPriority = priorityFilter === 'All' || n.priority === priorityFilter;
    const matchesUnread = !unreadOnlyFilter || !n.read;
    const matchesSearch = !q || [n.title, n.description, n.category].some(v => v && v.toLowerCase().includes(q));
    return matchesCategory && matchesPriority && matchesUnread && matchesSearch;
  });

  if (loading) return <LoadingScreen message="Loading Notification Center…" />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="page-container space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-fadeIn ${
          toast.type === 'info' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          <span className="text-emerald-400 text-base">✓</span>
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-header-title text-2xl font-extrabold">Notifications &amp; Alert Center</h1>
            <span className={roleBadge.badgeClass}>{roleBadge.label} View</span>
          </div>
          <p className="page-header-subtitle">
            Stay informed about skill gaps, learning activities, assessments, mentorship, and critical governance actions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <span>✓✓</span> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="All Notifications" value={`${totalCount} Total`} subtext="Enterprise alert history" icon="🔔" accent="blue" />
        <SummaryCard title="Unread Items" value={`${unreadCount} New`} subtext={unreadCount > 0 ? 'Action required' : 'All caught up!'} icon="📬" accent={unreadCount > 0 ? 'amber' : 'emerald'} />
        <SummaryCard title="High Priority / Critical" value={`${criticalCount} Alerts`} subtext="Immediate focus required" icon="⚠️" accent={criticalCount > 0 ? 'amber' : 'blue'} />
        <SummaryCard title="Skill Gap Alerts" value={`${alertsCount} Active`} subtext="Auto-synced with Gap Analysis" icon="🎯" accent="purple" />
      </div>

      {/* ── Main Panel ────────────────────────────────────────── */}
      <div className="panel overflow-hidden">

        {/* Tab Navigation */}
        <div className="w-full bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            {[
              { id: 'center', label: 'Notification Center', icon: '🔔' },
              { id: 'preferences', label: 'Channel & Quiet Hours', icon: '⚙️' },
              { id: 'logs', label: 'Delivery History Log', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">

          {/* ================================================================ */}
          {/* TAB 1: NOTIFICATION CENTER                                       */}
          {/* ================================================================ */}
          {activeTab === 'center' && (
            <div className="space-y-4">

              {/* Filter + Search Controls */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">

                  {/* Search */}
                  <div className="relative w-full sm:w-60">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search notifications..."
                      className="form-input text-xs pl-8 w-full"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Category:</label>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="form-select text-xs w-auto"
                    >
                      <option value="All">All Categories</option>
                      <option value="Alerts">Skill Gap Alerts</option>
                      <option value="Learning">Learning &amp; Milestones</option>
                      <option value="Certifications">Certifications</option>
                      <option value="Mentorship">Mentorship &amp; Guilds</option>
                      <option value="Recommendations">Recommendations</option>
                      <option value="Assessments">Assessments</option>
                      <option value="System">System &amp; Governance</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Priority:</label>
                    <select
                      value={priorityFilter}
                      onChange={e => setPriorityFilter(e.target.value)}
                      className="form-select text-xs w-auto"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Info">Info</option>
                    </select>
                  </div>
                </div>

                {/* Unread Only Toggle */}
                <button
                  type="button"
                  onClick={() => setUnreadOnlyFilter(!unreadOnlyFilter)}
                  className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                    unreadOnlyFilter ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <span>📬</span>
                  <span>Unread Only ({unreadCount})</span>
                </button>
              </div>

              {/* Notifications List */}
              {displayedNotifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <span className="text-4xl block">🎉</span>
                  <p className="text-sm font-bold text-slate-800">You're all caught up!</p>
                  <p className="text-xs text-slate-500">No notifications match your current filters or search query.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedNotifications.map(n => {
                    const isUnread = !n.read;
                    const priorityClass =
                      n.priority === 'Critical' ? 'badge-danger bg-red-50 text-red-700 border-red-200' :
                      n.priority === 'High' ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                      n.priority === 'Medium' ? 'badge-blue bg-blue-50 text-blue-700 border-blue-200' :
                      'badge-neutral bg-slate-50 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isUnread
                            ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Unread indicator dot */}
                          <button
                            type="button"
                            onClick={() => handleToggleRead(n.id)}
                            className="mt-1 text-slate-400 hover:text-blue-600 shrink-0"
                            title={isUnread ? 'Mark as Read' : 'Mark as Unread'}
                          >
                            <span className={`w-3 h-3 rounded-full block ${isUnread ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="chip-indigo text-xs font-bold">{n.category}</span>
                              <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${priorityClass}`}>
                                {n.priority}
                              </span>
                              <span className="text-[11px] text-slate-400">&bull; {n.timestamp || 'Recent'}</span>
                            </div>
                            <h4 className={`text-sm font-extrabold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>
                          </div>
                        </div>

                        {/* Safe Direct Action Link */}
                        <div className="flex items-center gap-2 shrink-0">
                          {n.actionRoute && (
                            <button
                              type="button"
                              onClick={() => handleNotificationNavigate(n)}
                              className="btn-primary text-xs py-2 px-3.5 bg-blue-600 hover:bg-blue-700 shrink-0 whitespace-nowrap"
                            >
                              {n.actionLabel || 'View Action'} &rarr;
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleRead(n.id)}
                            className="btn-outline text-[11px] py-2 px-3 shrink-0"
                          >
                            {isUnread ? 'Mark Read' : 'Mark Unread'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: CLEAN LIGHT CHANNEL PREFERENCES & QUIET HOURS             */}
          {/* ================================================================ */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">

              {/* 1. Global Delivery Channels */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">Notification Delivery Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive daily digests & critical gap alerts via email.', icon: '📧' },
                    { key: 'smsEnabled', label: 'SMS / Mobile Alerts', desc: 'Receive instant text notifications for urgent items.', icon: '📱' },
                    { key: 'pushEnabled', label: 'Browser Push Alerts', desc: 'Receive desktop popups while platform is open.', icon: '🔔' },
                  ].map(item => (
                    <div key={item.key} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{item.icon}</span>
                          <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`text-xs font-bold ${preferences[item.key] ? 'text-blue-600' : 'text-slate-400'}`}>
                          {preferences[item.key] ? '✓ ENABLED' : 'OFF'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePrefToggle(item.key, !preferences[item.key])}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all flex items-center ${
                            preferences[item.key] ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. CLEAN SIMPLE LIGHT QUIET HOURS SECTION */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌙</span>
                      <h3 className="text-sm font-extrabold text-slate-900">Quiet Hours &amp; Do Not Disturb Schedule</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mute non-critical notifications automatically during your rest or off-work hours.
                    </p>
                  </div>

                  {/* Enable / Disable Switch */}
                  <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">
                      {preferences.quietHoursEnabled ? 'SCHEDULE ACTIVE' : 'MUTED / OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrefToggle('quietHoursEnabled', !preferences.quietHoursEnabled)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-all flex items-center ${
                        preferences.quietHoursEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-sm block" />
                    </button>
                  </div>
                </div>

                {preferences.quietHoursEnabled && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Active Schedule Summary Banner */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⏰</span>
                        <div>
                          <span className="font-bold">Quiet Hours Active: </span>
                          <span className="font-semibold">{formatTime12h(preferences.quietHoursStart || '22:00')} &rarr; {formatTime12h(preferences.quietHoursEnd || '07:00')}</span>
                        </div>
                      </div>
                      <span className="badge-blue text-[11px] font-bold py-0.5 px-2.5 rounded-full border">
                        Daily Schedule
                      </span>
                    </div>

                    {/* Simple Light Time Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Quiet Hours Start */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>🌙 QUIET HOURS START</span>
                          <span className="text-xs font-mono text-purple-700">{formatTime12h(preferences.quietHoursStart || '22:00')}</span>
                        </label>
                        <input
                          type="time"
                          value={preferences.quietHoursStart || '22:00'}
                          onChange={e => handlePrefToggle('quietHoursStart', e.target.value)}
                          className="form-input text-xs w-full font-mono"
                        />
                      </div>

                      {/* Quiet Hours End */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>☀️ QUIET HOURS END</span>
                          <span className="text-xs font-mono text-emerald-700">{formatTime12h(preferences.quietHoursEnd || '07:00')}</span>
                        </label>
                        <input
                          type="time"
                          value={preferences.quietHoursEnd || '07:00'}
                          onChange={e => handlePrefToggle('quietHoursEnd', e.target.value)}
                          className="form-input text-xs w-full font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick Schedule Presets */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Schedule Presets:</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '🌙 Night Rest (10:00 PM – 07:00 AM)', start: '22:00', end: '07:00' },
                          { label: '🌆 Evening Rest (08:00 PM – 06:00 AM)', start: '20:00', end: '06:00' },
                          { label: '💼 Off-Work Hours (06:00 PM – 08:00 AM)', start: '18:00', end: '08:00' },
                        ].map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyTimePreset(p.start, p.end)}
                            className="btn-outline text-xs py-1 px-3 border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Critical Bypass Toggle */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>⚡</span> Allow Critical Skill Gap Alerts During Quiet Hours
                        </p>
                        <p className="text-[11px] text-slate-500">High-severity skill gaps will still notify you immediately.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrefToggle('criticalBypassQuietHours', !preferences.criticalBypassQuietHours)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-all flex items-center shrink-0 ${
                          preferences.criticalBypassQuietHours ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full shadow-sm block" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Per-Category Delivery Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">Per-Category Channel Matrix</h3>
                <div className="table-container">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th className="table-th">NOTIFICATION CATEGORY</th>
                        <th className="table-th text-center">EMAIL CHANNEL</th>
                        <th className="table-th text-center">SMS CHANNEL</th>
                        <th className="table-th text-center">PUSH / IN-APP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Alerts', 'Certifications', 'Learning', 'Mentorship', 'Recommendations', 'Assessments', 'System'].map(cat => {
                        const catState = preferences.categoryChannels?.[cat] || { email: true, sms: false, push: true };
                        return (
                          <tr key={cat} className="table-row">
                            <td className="table-td font-bold text-slate-900 text-xs">
                              <span className="chip-indigo text-xs">{cat}</span>
                            </td>
                            {['email', 'sms', 'push'].map(ch => (
                              <td key={ch} className="table-td text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCategoryChannelToggle(cat, ch)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                    catState[ch]
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {catState[ch] ? '✓ Active' : 'Off'}
                                </button>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: DELIVERY HISTORY LOG                                      */}
          {/* ================================================================ */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Notification Delivery Audit History</h3>
                  <p className="text-xs text-slate-500">Simulated delivery channel logs across Push, Email, and SMS.</p>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{deliveryLogs.length} Delivery Events Recorded</span>
              </div>

              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="table-th">NOTIFICATION TITLE</th>
                      <th className="table-th">CHANNEL</th>
                      <th className="table-th">RECIPIENT</th>
                      <th className="table-th text-center">DELIVERY STATUS</th>
                      <th className="table-th text-right">SENT TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryLogs.map(log => (
                      <tr key={log.id} className="table-row">
                        <td className="table-td font-bold text-slate-900 text-xs">{log.title}</td>
                        <td className="table-td text-xs">
                          <span className="chip-indigo text-xs font-bold">{log.channel}</span>
                        </td>
                        <td className="table-td text-xs text-slate-600 font-mono">{log.recipient}</td>
                        <td className="table-td text-center">
                          <span className={`text-xs font-bold py-0.5 px-2.5 rounded-full border ${
                            log.status === 'Delivered' ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200' :
                            log.status === 'Queued' ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200' :
                            'badge-neutral bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="table-td text-right text-xs text-slate-500">{log.sentAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
