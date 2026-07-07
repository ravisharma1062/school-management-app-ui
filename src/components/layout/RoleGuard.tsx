import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

/**
 * Restricts a route subtree to specific roles. Assumes RequireAuth has already
 * confirmed the user is authenticated.
 */
export function RoleGuard({ allow }: { allow: Role[] }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
