import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Gate for any route subtree that requires a logged-in user. Renders
// nothing meaningful while we're still checking for an existing session,
// so an unauthenticated visitor never sees a flash of protected content.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
