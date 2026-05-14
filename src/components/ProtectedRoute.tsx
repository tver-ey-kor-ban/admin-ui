import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  requireAdmin?: boolean;   // admin (is_superuser) only
  requireOwner?: boolean;   // admin OR shop owner
}

export function ProtectedRoute({ requireAdmin, requireOwner }: ProtectedRouteProps) {
  const { token, isLoading, isAdmin, isOwner } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/owner" replace />;
  if (requireOwner && !isOwner && !isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
}
