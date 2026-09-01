import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export default function ProtectedRoute({
  children,
  requiredRole = null,
}) {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
