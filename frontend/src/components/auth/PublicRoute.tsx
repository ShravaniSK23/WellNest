import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth.types';
import { Loader2 } from 'lucide-react';

export const getRoleHomePath = (role?: UserRole): string => {
  switch (role) {
    case 'HELP_SEEKER':
      return '/dashboard';
    case 'THERAPIST':
      return '/therapist/portal';
    case 'MODERATOR':
      return '/moderation';
    case 'ADMIN':
      return '/admin';
    default:
      return '/dashboard';
  }
};

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        data-testid="public-route-loading"
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3"
      >
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const destination = getRoleHomePath(user.role);
    return <Navigate to={destination} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
