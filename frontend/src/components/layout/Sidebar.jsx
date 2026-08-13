import { NavLink } from 'react-router-dom';
import { useRole, ROLES } from '../../context/RoleContext';

const Icons = {
  dashboard: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  employees: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  departments: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  skills: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  employeeSkills: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
      <line x1="9" y1="11" x2="11" y2="11"/>
    </svg>
  ),
  competency: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2.5"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  ),
  gap: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  recommendations: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  matrix: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  ),
  profile: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  reports: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  users: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  roles: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  training: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  analytics: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  mentorship: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  communities: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  learningProgress: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  certifications: (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
};

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { currentRole, roleBadge } = useRole();

  // Dynamic Navigation Sections based on Role
  const navSections = [];

  if (currentRole === ROLES.EMPLOYEE) {
    navSections.push(
      {
        label: 'Overview',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
          { to: '/profile',   label: 'My Profile', icon: Icons.profile },
        ],
      },
      {
        label: 'My Skills & Diagnostics',
        items: [
          { to: '/employee-skills',   label: 'My Skills',          icon: Icons.employeeSkills },
          { to: '/competency-matrix', label: 'Competency Matrix', icon: Icons.competency },
          { to: '/gap-analysis',      label: 'Gap Analysis',      icon: Icons.gap },
          { to: '/recommendations',   label: 'Recommendations',   icon: Icons.recommendations },
        ],
      },
      {
        label: 'Knowledge & Mentorship',
        items: [
          { to: '/knowledge-sharing', label: 'Mentorship & Guilds', icon: Icons.mentorship },
        ],
      },
      {
        label: 'Learning & Certifications',
        items: [
          { to: '/learning-progress', label: 'Learning Progress',  icon: Icons.learningProgress },
          { to: '/certifications',    label: 'My Certifications',  icon: Icons.certifications },
        ],
      }
    );
  } else if (currentRole === ROLES.MANAGER) {
    navSections.push(
      {
        label: 'Overview',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
          { to: '/profile',   label: 'My Profile', icon: Icons.profile },
        ],
      },
      {
        label: 'Team & Department',
        items: [
          { to: '/employees',   label: 'Employees',   icon: Icons.employees },
          { to: '/departments', label: 'Departments', icon: Icons.departments },
          { to: '/reports',     label: 'Reports',     icon: Icons.reports },
        ],
      },
      {
        label: 'Competency & Analysis',
        items: [
          { to: '/competency-matrix', label: 'Team Competencies', icon: Icons.competency },
          { to: '/gap-analysis',      label: 'Team Gap Analysis', icon: Icons.gap },
          { to: '/recommendations',   label: 'Recommendations',  icon: Icons.recommendations },
        ],
      },
      {
        label: 'Knowledge & Mentorship',
        items: [
          { to: '/knowledge-sharing', label: 'Mentorship & Guilds', icon: Icons.mentorship },
        ],
      },
      {
        label: 'Team Learning Progress',
        items: [
          { to: '/learning-progress', label: 'Team Learning & Certs', icon: Icons.learningProgress },
        ],
      }
    );
  } else {
    // ADMINISTRATOR
    navSections.push(
      {
        label: 'Overview',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
          { to: '/profile',   label: 'My Profile', icon: Icons.profile },
        ],
      },
      {
        label: 'Workforce & Organization',
        items: [
          { to: '/employees',   label: 'Employees',   icon: Icons.employees },
          { to: '/departments', label: 'Departments', icon: Icons.departments },
        ],
      },
      {
        label: 'Skills & Analysis Engine',
        items: [
          { to: '/skills',                  label: 'Skills Catalog',        icon: Icons.skills },
          { to: '/employee-skills',         label: 'Employee Skills',       icon: Icons.employeeSkills },
          { to: '/competency-matrix',       label: 'Competency Matrix',     icon: Icons.competency },
          { to: '/gap-analysis',            label: 'Gap Analysis',          icon: Icons.gap },
          { to: '/recommendations',         label: 'Recommendations',       icon: Icons.recommendations },
          { to: '/department-skill-matrix', label: 'Skill Heatmap',        icon: Icons.matrix },
          { to: '/reports',                 label: 'Reports',               icon: Icons.reports },
        ],
      },
      {
        label: 'Knowledge Sharing & Mentorship',
        items: [
          { to: '/knowledge-sharing', label: 'Mentorship & Guilds', icon: Icons.mentorship },
        ],
      },
      {
        label: 'Learning Progress & Compliance',
        items: [
          { to: '/learning-progress',   label: 'Learning & Certifications', icon: Icons.learningProgress },
          { to: '/training-management', label: 'Training Management',       icon: Icons.training },
        ],
      },
      {
        label: 'Administration & Governance',
        items: [
          { to: '/user-management',     label: 'User Management',     icon: Icons.users },
          { to: '/role-management',     label: 'Role Management',     icon: Icons.roles },
          { to: '/analytics',           label: 'Analytics Engine',    icon: Icons.analytics },
          { to: '/system-settings',     label: 'System Settings',     icon: Icons.settings },
        ],
      }
    );
  }

  const sidebarContent = (
    <div className="w-64 h-full bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between select-none">
      <div>
        {/* ── Brand Logo Area ─────────────────────────────── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-btn-primary shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate">KnowledgeGap</p>
              <p className="text-[10px] text-blue-600 font-semibold leading-tight">Intelligence Platform</p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Dynamic Navigation ───────────────────────────── */}
        <nav className="py-4 px-3 space-y-4 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-thin">
          {navSections.map(({ label, items }) => (
            <div key={label}>
              <p className="nav-section-label">{label}</p>
              <div className="space-y-0.5 mt-1">
                {items.map(({ to, label: itemLabel, icon }) => (
                  <NavLink
                    key={to}
                    to={to.split(' ')[0]}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      isActive ? 'nav-item-active' : 'nav-item'
                    }
                  >
                    {icon}
                    <span className="truncate">{itemLabel}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ── Role Badge Footer Card ─────────────────────── */}
      <div className="p-3 m-3 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm leading-none">{roleBadge.icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
            {roleBadge.label} View
          </span>
        </div>
        <p className="text-[10px] text-slate-300 font-normal leading-relaxed">
          {currentRole === ROLES.EMPLOYEE && 'Personal mentorship, milestones & learning roadmap active.'}
          {currentRole === ROLES.MANAGER && 'Team health, department analytics & mentorship active.'}
          {currentRole === ROLES.ADMINISTRATOR && 'Full platform governance, guilds & learning compliance active.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex min-h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex-1 max-w-xs w-full h-full shadow-2xl animate-fadeIn">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
