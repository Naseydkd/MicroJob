import { Navigate } from 'react-router';
import { getAuthUser } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'jeune' | 'entreprise';
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredUserType && user.userType !== requiredUserType) {
    const redirectPath = user.userType === 'jeune' ? '/dashboard-jeune' : '/dashboard-entreprise';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
