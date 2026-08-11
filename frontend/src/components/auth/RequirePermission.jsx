import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';

/**
 * RequirePermission
 * Route guard that checks if the logged-in user role has the required permission.
 * If permitted, renders child route (<Outlet />).
 * Otherwise, redirects to /unauthorized without crashing or rendering a white screen.
 */
export default function RequirePermission({ permission }) {
  const { hasPermission } = useRole();

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
