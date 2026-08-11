import { Routes, Route } from 'react-router-dom';

// Layout & guards
import ProtectedRoute    from '../components/auth/ProtectedRoute';
import RequirePermission from '../components/auth/RequirePermission';
import DashboardLayout   from '../components/layout/DashboardLayout';

// Public pages
import Login         from '../pages/auth/Login';
import Register      from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Protected pages
import Dashboard          from '../pages/dashboard/Dashboard';
import EmployeeList       from '../pages/employee/EmployeeList';
import EmployeeDetails    from '../pages/employee/EmployeeDetails';
import EmployeeProfile    from '../pages/employee/EmployeeProfile';
import DepartmentList     from '../pages/department/DepartmentList';
import SkillList          from '../pages/skills/SkillList';
import EmployeeSkills     from '../pages/skills/EmployeeSkills';
import CompetencyMatrix   from '../pages/skills/CompetencyMatrix';
import GapAnalysis        from '../pages/skills/GapAnalysis';
import Recommendations    from '../pages/skills/Recommendations';
import DepartmentSkillMatrix from '../pages/skills/DepartmentSkillMatrix';

// Admin & Governance pages
import UserManagement     from '../pages/admin/UserManagement';
import RoleManagement     from '../pages/admin/RoleManagement';
import TrainingManagement from '../pages/admin/TrainingManagement';
import SystemSettings     from '../pages/admin/SystemSettings';
import Reports            from '../pages/reports/Reports';
import AnalyticsView      from '../pages/analytics/AnalyticsView';

// Common
import NotFound     from '../pages/common/NotFound';
import Unauthorized from '../pages/common/Unauthorized';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ───────────────────────────────────── */}
      <Route path="/"         element={<Login />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ── Protected routes (inside DashboardLayout) ────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Accessible to all 3 roles */}
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/profile"           element={<EmployeeProfile />} />
          <Route path="/competency-matrix" element={<CompetencyMatrix />} />
          <Route path="/gap-analysis"      element={<GapAnalysis />} />
          <Route path="/recommendations"   element={<Recommendations />} />
          <Route path="/learning"          element={<Recommendations />} />
          <Route path="/employee-skills"   element={<EmployeeSkills />} />

          {/* Manager & Admin permissions */}
          <Route element={<RequirePermission permission="canViewEmployees" />}>
            <Route path="/employees"     element={<EmployeeList />} />
            <Route path="/employees/:id" element={<EmployeeDetails />} />
          </Route>

          <Route element={<RequirePermission permission="canViewDepartments" />}>
            <Route path="/departments" element={<DepartmentList />} />
          </Route>

          <Route element={<RequirePermission permission="canViewReports" />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Administrator only permissions */}
          <Route element={<RequirePermission permission="canViewSkillsCatalog" />}>
            <Route path="/skills" element={<SkillList />} />
          </Route>

          <Route element={<RequirePermission permission="canViewDeptSkillMatrix" />}>
            <Route path="/department-skill-matrix" element={<DepartmentSkillMatrix />} />
          </Route>

          <Route element={<RequirePermission permission="canManageUsers" />}>
            <Route path="/user-management" element={<UserManagement />} />
          </Route>

          <Route element={<RequirePermission permission="canManageRoles" />}>
            <Route path="/role-management" element={<RoleManagement />} />
          </Route>

          <Route element={<RequirePermission permission="canManageTraining" />}>
            <Route path="/training-management" element={<TrainingManagement />} />
          </Route>

          <Route element={<RequirePermission permission="canViewAnalytics" />}>
            <Route path="/analytics" element={<AnalyticsView />} />
          </Route>

          <Route element={<RequirePermission permission="canAccessSettings" />}>
            <Route path="/system-settings" element={<SystemSettings />} />
          </Route>

        </Route>
      </Route>

      {/* ── 404 catch-all ────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
