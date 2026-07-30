import { Routes, Route } from 'react-router-dom';

// Layout & guards
import ProtectedRoute   from '../components/auth/ProtectedRoute';
import DashboardLayout  from '../components/layout/DashboardLayout';

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
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/employees"              element={<EmployeeList />} />
          <Route path="/employees/:id"          element={<EmployeeDetails />} />
          <Route path="/profile"                element={<EmployeeProfile />} />
          <Route path="/departments"            element={<DepartmentList />} />
          <Route path="/skills"                 element={<SkillList />} />
          <Route path="/employee-skills"        element={<EmployeeSkills />} />
          <Route path="/competency-matrix"      element={<CompetencyMatrix />} />
          <Route path="/gap-analysis"           element={<GapAnalysis />} />
          <Route path="/recommendations"        element={<Recommendations />} />
          <Route path="/department-skill-matrix" element={<DepartmentSkillMatrix />} />
        </Route>
      </Route>

      {/* ── 404 catch-all ────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
