import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';

/** Derive up-to-2 uppercase initials from a name string */
function getInitials(name = '') {
  return name
    .split(/[\s@]+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const { roleBadge } = useRole();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const displayName = user ? (user.name || user.username || user.email || 'User') : '';
  const initials    = getInitials(displayName);

  return (
    <header
      style={{ height: '64px' }}
      className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm flex items-center"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* ── LEFT: Hamburger + Brand ──────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Mobile hamburger */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          {/* Brand link */}
          <Link
            to="/dashboard"
            className="group flex items-center gap-2.5 no-underline"
            aria-label="Go to dashboard"
          >
            {/* Logo icon box */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>

            {/* Brand text */}
            <div className="hidden sm:flex flex-col justify-center leading-none">
              <span className="text-[14px] font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                KnowledgeGap
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                Intelligence Platform
              </span>
            </div>
          </Link>
        </div>

        {/* ── RIGHT: Notification + Profile + Sign Out ─────────── */}
        <div className="flex items-center gap-2">

          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {/* Badge dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>

          {/* Vertical separator */}
          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          {/* Profile chip */}
          {user && (
            <Link
              to="/profile"
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm transition-all duration-150 no-underline"
              aria-label="View your profile"
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                style={{
                  background: roleBadge.color === 'purple'
                    ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                    : roleBadge.color === 'orange'
                    ? 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                }}
              >
                {initials}
              </div>

              {/* Name + Colored Role Badge */}
              <div className="hidden sm:flex flex-col justify-center leading-none">
                <span className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {displayName}
                </span>
                <span className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full inline-block ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              </div>
            </Link>
          )}

          {/* Vertical separator */}
          <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />

          {/* Sign Out */}
          <button
            type="button"
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm transition-all duration-150"
            aria-label="Sign out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
