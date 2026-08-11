import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

/**
 * 3-Role Consolidation System (Frontend RBAC)
 *
 * Frontend Roles:
 * 1. Employee      (= Employee)
 * 2. Manager       (= Team Lead / Manager + Department Head)
 * 3. Administrator (= HR Specialist + L&D Admin + System Admin)
 *
 * Designed to seamlessly receive 6 raw backend roles or 3 frontend consolidated roles.
 */

export const ROLES = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  ADMINISTRATOR: 'Administrator',
};

/** Normalize backend role string or raw role into one of the 3 consolidated roles */
export function normalizeRole(rawRole = '') {
  const str = String(rawRole).trim();

  if (/admin|hr|learning|system/i.test(str)) {
    return ROLES.ADMINISTRATOR;
  }
  if (/manager|lead|department_head|dept_head/i.test(str)) {
    return ROLES.MANAGER;
  }
  return ROLES.EMPLOYEE;
}

/** Centralized Permission Mapping Matrix */
const PERMISSION_MATRIX = {
  [ROLES.EMPLOYEE]: {
    canViewPersonalDashboard: true,
    canViewProfile: true,
    canViewMySkills: true,
    canViewCompetencyMatrix: true,
    canViewGapAnalysis: true,
    canViewRecommendations: true,
    canViewNotifications: true,

    // Restricted
    canViewEmployees: false,
    canViewDepartments: false,
    canViewSkillsCatalog: false,
    canViewDeptSkillMatrix: false,
    canViewReports: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageTraining: false,
    canViewAnalytics: false,
    canAccessSettings: false,
  },
  [ROLES.MANAGER]: {
    canViewManagerDashboard: true,
    canViewProfile: true,
    canViewEmployees: true,
    canViewDepartments: true,
    canViewMySkills: true,
    canViewCompetencyMatrix: true,
    canViewGapAnalysis: true,
    canViewRecommendations: true,
    canViewReports: true,
    canViewNotifications: true,

    // Restricted
    canViewSkillsCatalog: false,
    canViewDeptSkillMatrix: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageTraining: false,
    canViewAnalytics: false,
    canAccessSettings: false,
  },
  [ROLES.ADMINISTRATOR]: {
    canViewAdminDashboard: true,
    canViewProfile: true,
    canViewEmployees: true,
    canViewDepartments: true,
    canViewSkillsCatalog: true,
    canViewEmployeeSkills: true,
    canViewMySkills: true,
    canViewCompetencyMatrix: true,
    canViewGapAnalysis: true,
    canViewRecommendations: true,
    canViewDeptSkillMatrix: true,
    canViewReports: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageTraining: true,
    canViewNotifications: true,
    canViewAnalytics: true,
    canAccessSettings: true,
  },
};

/** Get UI Badge Config for Role */
export function getRoleBadge(roleStr = '') {
  const role = normalizeRole(roleStr);
  if (role === ROLES.ADMINISTRATOR) {
    return {
      label: 'Administrator',
      badgeClass: 'badge-purple bg-purple-50 text-purple-700 border-purple-200',
      color: 'purple',
      icon: '🛡️',
    };
  }
  if (role === ROLES.MANAGER) {
    return {
      label: 'Manager',
      badgeClass: 'badge-orange bg-orange-50 text-orange-700 border-orange-200',
      color: 'orange',
      icon: '👨‍💼',
    };
  }
  return {
    label: 'Employee',
    badgeClass: 'badge-info bg-blue-50 text-blue-700 border-blue-200',
    color: 'blue',
    icon: '👤',
  };
}

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const { user } = useAuth();
  const currentRole = normalizeRole(user?.role);
  const permissions = PERMISSION_MATRIX[currentRole] || PERMISSION_MATRIX[ROLES.EMPLOYEE];

  function hasPermission(permissionKey) {
    return !!permissions[permissionKey];
  }

  function hasRole(requiredRole) {
    return currentRole === normalizeRole(requiredRole);
  }

  const value = {
    currentRole,
    permissions,
    hasPermission,
    hasRole,
    roleBadge: getRoleBadge(currentRole),
    
    // Quick Permission Helper Aliases
    canManageEmployees: hasPermission('canViewEmployees'),
    canManageDepartments: hasPermission('canViewDepartments'),
    canViewReports: hasPermission('canViewReports'),
    canManageUsers: hasPermission('canManageUsers'),
    canManageRoles: hasPermission('canManageRoles'),
    canManageTraining: hasPermission('canManageTraining'),
    canViewAnalytics: hasPermission('canViewAnalytics'),
    canAccessSettings: hasPermission('canAccessSettings'),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a <RoleProvider>');
  }
  return context;
}

export default RoleContext;
